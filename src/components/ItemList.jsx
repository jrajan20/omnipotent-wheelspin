import { useState } from 'react';
import {
  Paper,
  Stack,
  Group,
  Text,
  TextInput,
  ActionIcon,
  Button,
  ColorSwatch,
  ScrollArea,
  Title,
  Badge,
} from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import { makeItem } from '../utils/wheels';

export function ItemList({ items, onAdd, onRemove, onClear }) {
  const [value, setValue] = useState('');

  const add = () => {
    const label = value.trim();
    if (!label) return;
    onAdd(makeItem(label, items.map((item) => item.color)));
    setValue('');
  };

  return (
    <Paper withBorder radius="lg" p="md" shadow="sm" h="100%">
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <Title order={4}>Options</Title>
          <Badge color="grape" variant="light">
            {items.length}
          </Badge>
        </Group>
        {items.length > 0 && (
          <Button size="xs" variant="subtle" color="red" onClick={onClear}>
            Clear
          </Button>
        )}
      </Group>

      <Group mb="sm" gap="xs">
        <TextInput
          flex={1}
          placeholder="Add an option…"
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <ActionIcon
          size={36}
          variant="filled"
          color="grape"
          onClick={add}
          aria-label="Add option"
        >
          <IconPlus size={18} />
        </ActionIcon>
      </Group>

      <ScrollArea.Autosize mah={360}>
        <Stack gap="xs">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
              >
                <Group
                  justify="space-between"
                  wrap="nowrap"
                  style={{
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 8,
                    padding: '6px 10px',
                  }}
                >
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <ColorSwatch color={item.color} size={18} />
                    <Text lineClamp={1}>{item.label}</Text>
                  </Group>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => onRemove(item.id)}
                    aria-label={`Remove ${item.label}`}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" py="lg">
              No options yet. Ask the bot or add your own.
            </Text>
          )}
        </Stack>
      </ScrollArea.Autosize>
    </Paper>
  );
}
