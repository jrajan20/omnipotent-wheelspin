// Supabase Edge Function: list-generating chatbot backed by Google Gemini.
//
// Deploy:  npx supabase functions deploy chat
// Secret:  npx supabase secrets set GEMINI_API_KEY=your-key
//
// It returns structured JSON: { canCreateWheel, title, items[], message }.
// When the user's prompt cannot become a spinnable list, canCreateWheel is
// false and `message` explains why — the UI shows that message in the chat.

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL = 'gemini-2.0-flash';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are "Wheelspin Bot" for an app called Omnipotent Wheelspin.
Your ONLY job is to turn a user's request into a list of concise, spinnable options for a prize wheel.

Rules:
- If the request implies a set of choices (e.g. "dinner ideas", "movies to watch", "team names"), produce 6-12 short options, each at most about 4 words.
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

    const contents = [
      ...history
        .slice(-8)
        .map((m: { role: string; text: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.text ?? '') }],
        })),
      { role: 'user', parts: [{ text: prompt }] },
    ];

    const requestBody = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json',
        responseSchema: {
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

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
    );

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
    const text =
      payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed = JSON.parse(text);

    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((s: unknown) => String(s).trim())
          .filter(Boolean)
          .slice(0, 12)
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
