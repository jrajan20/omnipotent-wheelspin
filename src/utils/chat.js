import { supabase } from './supabase';

// Data-access wrapper around the `chat` Supabase Edge Function. Components must
// not call `supabase.functions.invoke` directly — use the `useChat` hook.
//
// The edge function streams an SSE response. `onToken` is called with each
// incremental text delta so the UI can show tokens as they arrive. The
// function resolves with the fully-parsed { canCreateWheel, title, items,
// message } payload once the stream is complete.
export async function sendChatMessage({ prompt, history, onToken }) {
  // Retrieve the current session token for the Authorization header, keeping
  // auth working without reimplementing auth header logic ourselves.
  const { data: { session } } = await supabase.auth.getSession();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  const url = `${supabaseUrl}/functions/v1/chat`;

  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    // Supabase edge functions require an Authorization header. Fall back to the
    // anon key when no authenticated session is present so unauthenticated users
    // can still use the chatbot without getting a 401.
    Authorization: session?.access_token
      ? 'Bearer ' + session.access_token
      : 'Bearer ' + supabaseKey,
  };

  // Only send the last 8 turns — the edge function also caps at 8, but trimming
  // here reduces the network payload.
  const trimmedHistory = Array.isArray(history) ? history.slice(-8) : [];

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, history: trimmedHistory }),
  });

  if (!res.ok) {
    throw new Error(`Chat request failed with status ${res.status}.`);
  }

  // Non-streaming fallback: if the edge function returned JSON (e.g. a rate
  // limit or validation error before it could stream), handle it directly.
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    const data = await res.json();
    if (data?.message) onToken?.(data.message);
    return data;
  }

  // Read the SSE stream, call onToken with each delta, accumulate full text.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      let parsed;
      try { parsed = JSON.parse(payload); } catch { continue; }
      if (typeof parsed?.text === 'string') {
        accumulated += parsed.text;
        onToken?.(parsed.text);
      }
    }
  }

  // The accumulated text is a raw JSON object emitted by the model.
  // Strip optional markdown fences in case the model wraps anyway.
  const jsonText = accumulated
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let result;
  try {
    result = JSON.parse(jsonText);
  } catch {
    throw new Error('Could not parse bot response. Please try again.');
  }

  const items = Array.isArray(result.items)
    ? result.items.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const canCreateWheel = Boolean(result.canCreateWheel) && items.length >= 2;

  return {
    canCreateWheel,
    title: String(result.title ?? '').slice(0, 80),
    items: canCreateWheel ? items : [],
    message: String(
      result.message ??
        (canCreateWheel
          ? 'Here is your wheel!'
          : 'I could not build a wheel from that. Try a topic like "dinner ideas".'),
    ),
  };
}
