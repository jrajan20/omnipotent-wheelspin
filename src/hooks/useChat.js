import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '../utils/chat';

// Hook for streaming chat messages to the Wheelspin Bot edge function.
// Returns { send, isPending } where `send` accepts { prompt, history, onToken }.
// `onToken` is called for each text delta so the UI can render incrementally.
export function useChat() {
  const mutation = useMutation({
    mutationFn: sendChatMessage,
  });

  const send = useCallback(
    ({ prompt, history, onToken }) =>
      mutation.mutateAsync({ prompt, history, onToken }),
    [mutation],
  );

  return { send, isPending: mutation.isPending };
}
