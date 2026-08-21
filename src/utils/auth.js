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
  // Supabase does not throw when signing up with an already-registered email
  // (to prevent enumeration). Instead it returns a user with an empty
  // `identities` array for a confirmed existing account.
  const alreadyExists =
    data?.user != null && Array.isArray(data.user.identities) && data.user.identities.length === 0;
  return { ...data, alreadyExists };
}

export async function changePassword({ password }) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
}
