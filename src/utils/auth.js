import { supabase } from './supabase';

// Data-access wrappers around Supabase Auth. Components must not call
// `supabase.auth` directly — use the hooks in `hooks/useAuthMutations`.
export async function signInWithPassword({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithPassword({ email, password, username }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) throw error;
  return data;
}
