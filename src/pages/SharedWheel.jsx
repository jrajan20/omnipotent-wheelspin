import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Center,
  Loader,
  Text,
  Stack,
  Paper,
  Badge,
} from '@mantine/core';
import { useParams } from 'react-router-dom';
import { WheelCanvas } from '../components/WheelCanvas';
import { fetchSharedWheel, incrementSpinCount } from '../utils/wheels';

export function SharedWheel() {
  const { shareId } = useParams();
  const [wheel, setWheel] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetchSharedWheel(shareId)
      .then((data) => {
        setWheel(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [shareId]);

  if (status === 'loading') {
    return (
      <Center h={300}>
        <Loader color="grape" />
      </Center>
    );
  }

  if (status === 'error') {
    return (
      <Center h={300}>
        <Text c="dimmed">This wheel doesn&apos;t exist or isn&apos;t shared.</Text>
      </Center>
    );
  }

  return (
    <Container size="sm" py="lg">
      <Stack align="center" gap="xs" mb="md">
        <Badge color="grape" variant="light">
          Shared wheel
        </Badge>
        <Title order={2} ta="center">
          {wheel.title}
        </Title>
      </Stack>
      <Paper withBorder radius="lg" p="lg">
        <WheelCanvas
          items={wheel.options ?? []}
          onSpinEnd={() => incrementSpinCount(wheel.id, wheel.spin_count)}
        />
      </Paper>
    </Container>
  );
}
