import { useMutation } from '@tanstack/react-query';
import { signInWithPassword, signUpWithPassword } from '../utils/auth';

// Mutation: email/password sign in.
export function useSignIn() {
  return useMutation({
    mutationFn: signInWithPassword,
  });
}

// Mutation: email/password sign up.
export function useSignUp() {
  return useMutation({
    mutationFn: signUpWithPassword,
  });
}
