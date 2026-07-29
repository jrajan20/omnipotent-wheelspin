import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  SimpleGrid,
  Card,
  Text,
  Group,
  Button,
  Badge,
  Stack,
  Center,
  Loader,
} from '@mantine/core';
import { IconTrash, IconExternalLink, IconMoodEmpty } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../auth/AuthProvider';
import { fetchMyWheels, deleteWheel } from '../utils/wheels';

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [wheels, setWheels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/');
      return;
    }
    fetchMyWheels(user.id)
      .then(setWheels)
      .catch((e) => notifications.show({ color: 'red', message: e.message }))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const remove = async (id) => {
    try {
      await deleteWheel(id);
      setWheels((current) => current.filter((w) => w.id !== id));
      notifications.show({ color: 'green', message: 'Wheel deleted.' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message });
    }
  };

  if (authLoading || loading) {
    return (
      <Center h={300}>
        <Loader color="grape" />
      </Center>
    );
  }

  return (
    <Container size="lg" py="md">
      <Title order={2} mb="md">
        My Wheels
      </Title>

      {wheels.length === 0 ? (
        <Center h={240}>
          <Stack align="center">
            <IconMoodEmpty size={40} />
            <Text c="dimmed">No wheels yet — build your first one!</Text>
            <Button onClick={() => navigate('/')} variant="light" color="grape">
              Build a wheel
            </Button>
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {wheels.map((wheel) => (
            <Card key={wheel.id} withBorder radius="lg" shadow="sm">
              <Group justify="space-between" mb="xs">
                <Text fw={600} lineClamp={1}>
                  {wheel.title}
                </Text>
                {wheel.is_public && (
                  <Badge color="grape" variant="light">
                    Shared
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed">
                {wheel.options?.length ?? 0} options · {wheel.spin_count ?? 0} spins
              </Text>
              <Group mt="md" gap="xs">
                {wheel.is_public && (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconExternalLink size={14} />}
                    onClick={() => window.open(`/w/${wheel.share_id}`, '_blank')}
                  >
                    Open link
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => remove(wheel.id)}
                >
                  Delete
                </Button>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
