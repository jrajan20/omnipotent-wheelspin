import { useEffect } from 'react';
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
import { IconTrash, IconShare, IconMoodEmpty } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../auth/AuthProvider';
import { useMyWheels, useDeleteWheel, useSetWheelPublic } from '../hooks/useWheels';

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  const { data: wheels = [], isLoading, error } = useMyWheels(user?.id);
  const deleteWheel = useDeleteWheel();
  const setPublic = useSetWheelPublic();

  useEffect(() => {
    if (error) notifications.show({ color: 'red', message: error.message });
  }, [error]);

  const remove = (id) => {
    deleteWheel.mutate(id, {
      onSuccess: () =>
        notifications.show({ color: 'green', message: 'Wheel deleted.' }),
      onError: (e) => notifications.show({ color: 'red', message: e.message }),
    });
  };

  // A wheel is only reachable through its share link once it is public, so make
  // sure it is shareable before opening or copying the link.
  const ensureShareable = (wheel) =>
    wheel.is_public
      ? Promise.resolve(wheel)
      : setPublic.mutateAsync({ id: wheel.id, isPublic: true });

  // Open a saved wheel through its public share link.
  const openWheel = async (wheel) => {
    try {
      const shared = await ensureShareable(wheel);
      navigate(`/w/${shared.share_id}`);
    } catch (e) {
      notifications.show({ color: 'red', message: e.message });
    }
  };

  // Make a wheel shareable and copy its share link to the clipboard.
  const copyLink = async (wheel) => {
    try {
      const shared = await ensureShareable(wheel);
      const link = `${window.location.origin}/w/${shared.share_id}`;
      await navigator.clipboard.writeText(link).catch(() => {});
      notifications.show({
        color: 'grape',
        title: 'Share link copied!',
        message: link,
      });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message });
    }
  };

  if (authLoading || isLoading) {
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
            <Card
              key={wheel.id}
              withBorder
              radius="lg"
              shadow="sm"
              onClick={() => openWheel(wheel)}
              style={{ cursor: 'pointer' }}
            >
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
                <Button
                  size="xs"
                  variant="light"
                  color="grape"
                  leftSection={<IconShare size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    copyLink(wheel);
                  }}
                >
                  Copy link
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(wheel.id);
                  }}
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
