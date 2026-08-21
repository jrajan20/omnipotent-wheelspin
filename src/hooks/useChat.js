import { useCallback, useState } from 'react';
import { sendChatMessage } from '../utils/chat';

// Hook for streaming chat messages to the Wheelspin Bot edge function.
// Returns { send, isPending } where `send` accepts { prompt, history, onToken }.
// `onToken` is called for each text delta so the UI can render incrementally.
export function useChat() {
  const [isPending, setIsPending] = useState(false);

  const send = useCallback(async ({ prompt, history, onToken }) => {
    setIsPending(true);
    try {
      return await sendChatMessage({ prompt, history, onToken });
    } finally {
      setIsPending(false);
    }
  }, []);

  return { send, isPending };
}
