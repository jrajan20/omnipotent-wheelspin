// Supabase Edge Function: list-generating chatbot backed by Google Gemini.
//
// Deploy:  npx supabase functions deploy chat
// Secret:  npx supabase secrets set GEMINI_API_KEY=your-key
//
// It returns structured JSON: { canCreateWheel, title, items[], message }.
// When the user's prompt cannot become a spinnable list, canCreateWheel is
// false and `message` explains why — the UI shows that message in the chat.

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
// Used to verify Supabase JWTs so rate-limit keys cannot be forged.
const SUPABASE_JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET');

// ---------------------------------------------------------------------------
// In-memory rate limiter — per user (JWT sub) or per IP as fallback.
// This is best-effort: each edge-function instance has its own Map and cold
// starts reset it. For a multi-instance or persistent limit, back this with
// a shared store (e.g. Supabase Postgres or Redis).
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10;           // max requests per window
const rateLimitMap = new Map();      // key → { count, windowStart }

// Verify a Supabase JWT (HS256) and return the `sub` claim, or null if invalid.
async function getVerifiedSub(token) {
  if (!SUPABASE_JWT_SECRET || !token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SUPABASE_JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    // base64url → base64 → ArrayBuffer
    const sig = Uint8Array.from(
      atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0),
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      enc.encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

async function getRateLimitKey(req) {
  // Prefer the verified authenticated user's JWT subject (per account).
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^bearer\s+/i, '').trim();
  if (token) {
    const sub = await getVerifiedSub(token);
    if (sub) return `user:${sub}`;
  }
  // Fall back to client IP for unauthenticated or invalid tokens.
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  return `ip:${ip}`;
}

function isRateLimited(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}
const MODEL = 'gemini-3.6-flash';
const INTERACTIONS_URL =
  'https://generativelanguage.googleapis.com/v1beta/interactions';
const API_REVISION = '2026-05-20';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are "Wheelspin Bot" for an app called Omnipotent Wheelspin.
Your ONLY job is to turn a user's request into a list of concise, spinnable options for a prize wheel.

Rules:
- If the request implies a set of choices (e.g. "dinner ideas", "movies to watch", "team names"), produce a list of short options, each at most about 4 words. Include as many relevant options as make sense for the topic.
- If the request cannot reasonably become a list of options (e.g. "what's the weather?", "who are you?", a factual question, a greeting, or anything with a single answer), set canCreateWheel to false and briefly explain, in a friendly tone, that a wheelspin can't be created from that prompt. Suggest they try a topic like "dinner ideas".
- Never produce unsafe, hateful, or explicit options.
- The "title" should be a short name for the wheel (e.g. "Dinner Ideas").
Return ONLY JSON that matches the provided schema.`;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Pull the model's final text (our JSON string) out of the Interactions API
// `steps` timeline — the Interactions API has no `candidates` array.
function outputTextFromInteraction(payload: {
  steps?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}) {
  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    if (step?.type === 'model_output' && Array.isArray(step.content)) {
      const part = step.content.find(
        (c) => c?.type === 'text' && typeof c.text === 'string',
      );
      if (part?.text) return part.text;
    }
  }
  return '{}';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Per-user / per-IP rate limiting (10 requests per minute).
  const rateLimitKey = await getRateLimitKey(req);
  if (isRateLimited(rateLimitKey)) {
    return jsonResponse(
      {
        canCreateWheel: false,
        title: '',
        items: [],
        message:
          "You're sending messages too quickly — please wait a moment and try again.",
      },
      429,
    );
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

    // The Interactions API is stateless here: fold recent turns into one text
    // input and keep the bot persona in `system_instruction`.
    const transcript = (Array.isArray(history) ? history : [])
      .slice(-8)
      .map((m: { role: string; text: string }) => {
        const speaker = m.role === 'assistant' ? 'Assistant' : 'User';
        return `${speaker}: ${String(m.text ?? '').trim()}`;
      })
      .join('\n');
    const input = transcript ? `${transcript}\nUser: ${prompt}` : prompt;

    const requestBody = {
      model: MODEL,
      system_instruction: SYSTEM_PROMPT,
      input,
      store: false,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: {
            canCreateWheel: { type: 'boolean' },
            title: { type: 'string' },
            items: { type: 'array', items: { type: 'string' } },
            message: { type: 'string' },
          },
          required: ['canCreateWheel', 'title', 'items', 'message'],
        },
      },
    };

    const res = await fetch(INTERACTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
        'Api-Revision': API_REVISION,
      },
      body: JSON.stringify(requestBody),
    });

    if (res.status === 429) {
      return jsonResponse({
        canCreateWheel: false,
        title: '',
        items: [],
        message:
          'The Wheelspin Bot is a little busy right now — please try again in a moment.',
      });
    }
    if (!res.ok) {
      throw new Error(`Gemini request failed with status ${res.status}.`);
    }

    const payload = await res.json();
    const text = outputTextFromInteraction(payload);
    const parsed = JSON.parse(text);

    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((s: unknown) => String(s).trim())
          .filter(Boolean)
      : [];
    const canCreateWheel = Boolean(parsed.canCreateWheel) && items.length >= 2;

    return jsonResponse({
      canCreateWheel,
      title: String(parsed.title ?? '').slice(0, 80),
      items: canCreateWheel ? items : [],
      message: String(
        parsed.message ??
          (canCreateWheel
            ? 'Here is your wheel!'
            : 'I could not build a wheel from that. Try a topic like "dinner ideas".'),
      ),
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
