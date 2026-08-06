import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  decodeWheelFromHash,
  deleteWheel,
  fetchMyWheels,
  fetchSharedWheel,
  incrementSpinCount,
  saveWheel,
  setWheelPublic,
} from '../utils/wheels';
import { queryKeys } from './queryKeys';

// Query: wheels owned by the current user.
export function useMyWheels(userId, options = {}) {
  return useQuery({
    queryKey: queryKeys.wheels.mine(userId),
    queryFn: () => fetchMyWheels(userId),
    enabled: !!userId,
    ...options,
  });
}

// Query: a single public wheel by its share id.
export function useSharedWheel(shareId, options = {}) {
  return useQuery({
    queryKey: queryKeys.wheels.shared(shareId),
    queryFn: () => fetchSharedWheel(shareId),
    enabled: !!shareId,
    ...options,
  });
}

// Mutation: create or update a wheel.
export function useSaveWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveWheel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wheels.all });
    },
  });
}

// Mutation: toggle a wheel's public/shared state.
export function useSetWheelPublic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublic }) => setWheelPublic(id, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wheels.all });
    },
  });
}

// Mutation: delete a wheel.
export function useDeleteWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteWheel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wheels.all });
    },
  });
}

// Mutation: best-effort spin counter increment.
export function useIncrementSpinCount() {
  return useMutation({
    mutationFn: ({ id, current }) => incrementSpinCount(id, current),
  });
}

// Decode a wheel encoded in the URL hash (no Supabase, no auth required).
export function useLocalWheel(hash) {
  return useQuery({
    queryKey: ['wheels', 'local', hash],
    queryFn: () => {
      const wheel = decodeWheelFromHash(hash ?? '');
      if (!wheel) throw new Error('Invalid or missing wheel data in URL.');
      return wheel;
    },
    staleTime: Infinity,
  });
}
