import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Whether the required env vars are present. When false the app renders a
// configuration-error banner instead of crashing the entire module graph.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!supabaseConfigured) {
  console.error(
    '[supabase] Missing environment variables VITE_SUPABASE_URL and/or ' +
      'VITE_SUPABASE_ANON_KEY. Set them in Vercel → Settings → Environment ' +
      'Variables and redeploy.',
  );
}

// Create the client unconditionally so every import resolves; API calls will
// fail gracefully when the placeholder values are used.
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseKey ?? 'placeholder',
);