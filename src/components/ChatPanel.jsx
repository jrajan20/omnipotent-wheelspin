import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  TextInput,
  ActionIcon,
  ScrollArea,
  Loader,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconSend, IconRobot } from '@tabler/icons-react';
import { useChat } from '../hooks/useChat';

function WheelLogo({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

const GREETING = {
  role: 'assistant',
  text:
    "Hi! Tell me a topic and I'll build a spinnable list — try \"dinner ideas\", \"weekend activities\", or \"team names\".",
};

// Unique sentinel id for the streaming placeholder bubble.
const STREAMING_ID = '__streaming__';

export function ChatPanel({ onList }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const { send, isPending } = useChat();
  const viewport = useRef(null);

  useEffect(() => {
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isPending) return;
    setInput('');

    // Snapshot history (excluding the static greeting) before appending the
    // new user message — trimming to last 8 happens in the data layer.
    const history = messages
      .slice(1) // drop GREETING
      .map((m) => ({ role: m.role, text: m.text }));

    // Immediately show the user's message and an empty streaming bubble.
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: prompt },
      { role: 'assistant', text: '', id: STREAMING_ID },
    ]);

    try {
      const data = await send({
        prompt,
        history,
        // Each token delta: append to the streaming bubble in real time.
        onToken: (delta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === STREAMING_ID ? { ...m, text: m.text + delta } : m,
            ),
          );
        },
      });

      // Stream finished — replace the streaming bubble with the final message.
      const botText =
        data?.message ||
        (data?.canCreateWheel
          ? `Here's a wheel for "${data.title}".`
          : "I couldn't make a wheel from that. Try a topic with several choices.");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === STREAMING_ID ? { role: 'assistant', text: botText } : m,
        ),
      );

      if (
        data?.canCreateWheel &&
        Array.isArray(data.items) &&
        data.items.length >= 2
      ) {
        onList({ title: data.title, labels: data.items });
      }
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === STREAMING_ID
            ? {
                role: 'assistant',
                text:
                  '\u26a0\ufe0f ' +
                  (e.message ||
                    'The Wheelspin Bot is unavailable right now. You can still add options manually.'),
              }
            : m,
        ),
      );
    }
  }, [input, isPending, messages, send, onList]);

  return (
    <Paper
      withBorder
      radius="lg"
      p="md"
      shadow="sm"
      h="100%"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Group gap="xs" mb="sm">
        <ThemeIcon variant="light" color="grape" radius="xl">
          <WheelLogo size={18} />
        </ThemeIcon>
        <Title order={4}>Wheelspin Bot</Title>
      </Group>

      <ScrollArea flex={1} viewportRef={viewport} mah={420}>
        <Stack gap="sm" p="xs">
          {messages.map((m, i) => (
            <Group
              key={m.id ?? i}
              align="flex-start"
              wrap="nowrap"
              justify={m.role === 'user' ? 'flex-end' : 'flex-start'}
            >
              {m.role === 'assistant' && (
                <ThemeIcon variant="light" color="grape" radius="xl" size="md">
                  <IconRobot size={16} />
                </ThemeIcon>
              )}
              <Paper
                px="sm"
                py={6}
                radius="lg"
                maw="80%"
                bg={
                  m.role === 'user'
                    ? 'var(--mantine-color-grape-6)'
                    : 'var(--mantine-color-default-hover)'
                }
              >
                <Text size="sm" c={m.role === 'user' ? 'white' : undefined}>
                  {m.text || (m.id === STREAMING_ID ? <Loader size="xs" color="grape" /> : null)}
                </Text>
              </Paper>
            </Group>
          ))}
        </Stack>
      </ScrollArea>

      <Group mt="sm" gap="xs">
        <TextInput
          flex={1}
          placeholder="Ask for a list…"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isPending}
        />
        <ActionIcon
          size={36}
          variant="filled"
          color="grape"
          onClick={handleSend}
          loading={isPending}
          aria-label="Send message"
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
