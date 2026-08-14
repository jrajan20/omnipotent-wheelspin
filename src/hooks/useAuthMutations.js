import { useMutation } from '@tanstack/react-query';
import { signInWithPassword, signUpWithPassword, changePassword, deleteAccount } from '../utils/auth';

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

// Mutation: change the current user's password.
export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

// Mutation: permanently delete the current user's account.
export function useDeleteAccount() {
  return useMutation({
    mutationFn: deleteAccount,
  });
}
