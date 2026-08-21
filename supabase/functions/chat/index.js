// Supabase Edge Function: list-generating chatbot backed by Google Gemini.
//
// Deploy:  npx supabase functions deploy chat
// Secret:  npx supabase secrets set GEMINI_API_KEY=your-key
//
// Streams an SSE response of text tokens. The final token(s) contain a JSON
// object: { canCreateWheel, title, items[], message }. The client reads the
// stream, accumulates text, and parses the JSON fence when the stream ends.

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
// gemini-2.0-flash-lite: faster and cheaper than gemini-3.6-flash for simple
// list-generation tasks. TTFT is significantly lower.
const MODEL = 'gemini-2.0-flash-lite';
const GENERATE_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Patterns that suggest the user may be in crisis.  When matched we respond
// with crisis resources instead of forwarding the message to the AI model.
const SELF_HARM_PATTERNS = [
  /\b(suicide|suicidal)\b/i,
  /\bkill (my|him|her|them|your|our)self(ves)?\b/i,
  /\bself[- ]?harm\b/i,
  /\bself[- ]?injur/i,
  /\bcut (my|him|her|them|your|our)self(ves)?\b/i,
  /\bend (my|his|her|their|your|our) life\b/i,
  /\bwant to die\b/i,
  /\b(hurt|harm) (my|him|her|them|your|our)self(ves)?\b/i,
];

function crisisResponse() {
  return {
    canCreateWheel: false,
    title: '',
    items: [],
    message:
      "It sounds like you may be going through something really difficult. " +
      "Please reach out — you don't have to face this alone.\n\n" +
      "🇺🇸 **988 Suicide & Crisis Lifeline** — call or text **988** (US, 24/7)\n" +
      "🌍 **International resources** — https://www.befrienders.org",
  };
}

// The system prompt instructs the model to output a JSON object directly.
// No response_format/schema is used so the model can stream tokens freely.
const SYSTEM_PROMPT = `You are "Wheelspin Bot" for an app called Omnipotent Wheelspin.
Your ONLY job is to turn a user's request into a list of concise, spinnable options for a prize wheel.

Rules:
- If the request implies a set of choices (e.g. "dinner ideas", "movies to watch", "team names"), produce a list of options. Include as many relevant options as make sense for the topic.
- If the request cannot reasonably become a list of options (e.g. "what's the weather?", "who are you?", a factual question, a greeting, or anything with a single answer), set canCreateWheel to false and briefly explain, in a friendly tone, that a wheelspin can't be created from that prompt. Suggest they try a topic like "dinner ideas".
- Never produce unsafe, hateful, or explicit options.
- The "title" should be a short name for the wheel (e.g. "Dinner Ideas").
Output ONLY a raw JSON object — no markdown fences, no extra text — with exactly these keys:
{"canCreateWheel": boolean, "title": string, "items": string[], "message": string}`;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Extract the text delta from a streamGenerateContent SSE chunk.
function deltaText(chunk) {
  if (typeof chunk !== 'object' || chunk === null) return '';
  const candidates = Array.isArray(chunk.candidates) ? chunk.candidates : [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'object' || candidate === null) continue;
    const parts = Array.isArray(candidate.content?.parts)
      ? candidate.content.parts
      : [];
    for (const part of parts) {
      if (typeof part?.text === 'string') return part.text;
    }
  }
  return '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    const { prompt, history = [] } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return jsonResponse({
        canCreateWheel: false,
        title: '',
        items: [],
        message: 'Please type a topic to build a wheel from.',
      });
    }

    // Detect potential self-harm language before sending anything to the AI.
    if (SELF_HARM_PATTERNS.some((re) => re.test(prompt))) {
      return jsonResponse(crisisResponse());
    }

    // Build the conversation as generateContent `contents` turns.
    // Only send the last 8 turns to keep the payload small.
    const historyTurns = (Array.isArray(history) ? history : [])
      .slice(-8)
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.text ?? '').trim() }],
      }));

    const requestBody = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        ...historyTurns,
        { role: 'user', parts: [{ text: prompt }] },
      ],
      generationConfig: { temperature: 0.7 },
    };

    const geminiRes = await fetch(GENERATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (geminiRes.status === 429) {
      return jsonResponse({
        canCreateWheel: false,
        title: '',
        items: [],
        message:
          'The Wheelspin Bot is a little busy right now — please try again in a moment.',
      });
    }
    if (!geminiRes.ok) {
      throw new Error(`Gemini request failed with status ${geminiRes.status}.`);
    }

    // Stream SSE from Gemini → SSE to client.
    // Each `data:` line is forwarded as-is so the browser can display tokens
    // incrementally. The client accumulates text and parses JSON at stream end.
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = geminiRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE lines from the buffer.
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            let chunk;
            try { chunk = JSON.parse(jsonStr); } catch { continue; }

            const text = deltaText(chunk);
            if (text) {
              // Forward as an SSE data line carrying just the text delta.
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              );
            }
          }
        }
      } finally {
        // Signal end-of-stream to the client.
        await writer.write(encoder.encode('data: [DONE]\n\n'));
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return jsonResponse({
      canCreateWheel: false,
      title: '',
      items: [],
      message:
        error instanceof Error ? error.message : 'Something went wrong.',
    });
  }
});
