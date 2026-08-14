// Supabase Edge Function: list-generating chatbot backed by Google Gemini.
//
// Deploy:  npx supabase functions deploy chat
// Secret:  npx supabase secrets set GEMINI_API_KEY=your-key
//
// It returns structured JSON: { canCreateWheel, title, items[], message }.
// When the user's prompt cannot become a spinnable list, canCreateWheel is
// false and `message` explains why — the UI shows that message in the chat.

// Ambient typings for the Deno runtime so this function type-checks in a plain
// (non-Deno) editor. Deno provides these globals natively at runtime.
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
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

const SYSTEM_PROMPT = `You are "Wheelspin Bot" for an app called Omnipotent Wheelspin.
Your ONLY job is to turn a user's request into a list of concise, spinnable options for a prize wheel.

Rules:
- If the request implies a set of choices (e.g. "dinner ideas", "movies to watch", "team names"), produce a list of options. Include as many relevant options as make sense for the topic.
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

// Marks this file as a module (not a global script) for the type-checker.
export {};
