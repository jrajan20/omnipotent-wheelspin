import { useState, useRef, useEffect } from 'react';
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

export function ChatPanel({ onList }) {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const chat = useChat();
  const loading = chat.isPending;
  const viewport = useRef(null);

  useEffect(() => {
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput('');
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: prompt }]);

    try {
      const data = await chat.mutateAsync({ prompt, history });

      const botText =
        data?.message ||
        (data?.canCreateWheel
          ? `Here's a wheel for "${data.title}".`
          : "I couldn't make a wheel from that. Try a topic with several choices.");
      setMessages((m) => [...m, { role: 'assistant', text: botText }]);

      if (
        data?.canCreateWheel &&
        Array.isArray(data.items) &&
        data.items.length >= 2
      ) {
        onList({ title: data.title, labels: data.items });
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `⚠️ ${
            e.message ||
            'The Wheelspin Bot is unavailable right now. You can still add options manually.'
          }`,
        },
      ]);
    }
  };

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
              key={i}
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
                  {m.text}
                </Text>
              </Paper>
            </Group>
          ))}

          {loading && (
            <Group gap="xs">
              <Loader size="sm" color="grape" />
              <Text size="sm" c="dimmed">
                Thinking…
              </Text>
            </Group>
          )}
        </Stack>
      </ScrollArea>

      <Group mt="sm" gap="xs">
        <TextInput
          flex={1}
          placeholder="Ask for a list…"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <ActionIcon
          size={36}
          variant="filled"
          color="grape"
          onClick={send}
          loading={loading}
          aria-label="Send message"
        >
          <IconSend size={18} />
        </ActionIcon>
      </Group>
    </Paper>
  );
}
