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
import { useParams, useLocation } from 'react-router-dom';
import { WheelCanvas } from '../components/WheelCanvas';
import { useSharedWheel, useIncrementSpinCount, useLocalWheel } from '../hooks/useWheels';

function LocalSharedWheel({ hash }) {
  const { data: wheel, isLoading, isError } = useLocalWheel(hash);

  if (isLoading) {
    return (
      <Center h={300}>
        <Loader color="grape" />
      </Center>
    );
  }

  if (isError || !wheel) {
    return (
      <Center h={300}>
        <Text c="dimmed">This wheel link is invalid or has expired.</Text>
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
        <WheelCanvas items={wheel.options ?? []} />
      </Paper>
    </Container>
  );
}

export function SharedWheel() {
  const { shareId } = useParams();
  const { hash } = useLocation();
  const isLocal = shareId === 'local';

  if (isLocal) {
    return <LocalSharedWheel hash={hash} />;
  }

  return <RemoteSharedWheel shareId={shareId} />;
}

function RemoteSharedWheel({ shareId }) {
  const { data: wheel, isLoading, isError } = useSharedWheel(shareId);
  const incrementSpin = useIncrementSpinCount();

  if (isLoading) {
    return (
      <Center h={300}>
        <Loader color="grape" />
      </Center>
    );
  }

  if (isError || !wheel) {
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
          onSpinEnd={() =>
            incrementSpin.mutate({ id: wheel.id, current: wheel.spin_count })
          }
        />
      </Paper>
    </Container>
  );
}
