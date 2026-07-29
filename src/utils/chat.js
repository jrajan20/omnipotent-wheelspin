import { supabase } from './supabase';

// Data-access wrapper around the `chat` Supabase Edge Function. Components must
// not call `supabase.functions.invoke` directly — use the `useChat` hook.
export async function sendChatMessage({ prompt, history }) {
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { prompt, history },
  });
  if (error) throw error;
  return data;
}
