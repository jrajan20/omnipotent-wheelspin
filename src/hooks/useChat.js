import { useMutation } from '@tanstack/react-query';
import { sendChatMessage } from '../utils/chat';

// Mutation: send a prompt to the Wheelspin Bot edge function.
export function useChat() {
  return useMutation({
    mutationFn: sendChatMessage,
  });
}
