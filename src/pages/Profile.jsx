import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Tabs,
  PasswordInput,
  Button,
  Stack,
  Text,
  SimpleGrid,
  Card,
  Group,
  Badge,
  Center,
  Loader,
} from '@mantine/core';
import { IconShare, IconTrash, IconMoodEmpty } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useChangePassword, useDeleteAccount } from '../hooks/useAuthMutations';
import { useMyWheels, useDeleteWheel, useSetWheelPublic } from '../hooks/useWheels';

function SavedWheels({ userId }) {
  const navigate = useNavigate();
  const { data: wheels = [], isLoading } = useMyWheels(userId);
  const deleteWheel = useDeleteWheel();
  const setPublic = useSetWheelPublic();

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader color="grape" />
      </Center>
    );
  }

  if (wheels.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center">
          <IconMoodEmpty size={36} />
          <Text c="dimmed" size="sm">No wheels yet — build your first one!</Text>
          <Button onClick={() => navigate('/')} variant="light" color="grape">
            Build a wheel
          </Button>
        </Stack>
      </Center>
    );
  }

  const ensureShareable = (wheel) =>
    wheel.is_public
      ? Promise.resolve(wheel)
      : setPublic.mutateAsync({ id: wheel.id, isPublic: true });

  const openWheel = async (wheel) => {
    try {
      const shared = await ensureShareable(wheel);
      navigate(`/w/${shared.share_id}`);
    } catch (e) {
      notifications.show({ color: 'red', message: e.message });
    }
  };

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

  const remove = (id) => {
    deleteWheel.mutate(id, {
      onSuccess: () => notifications.show({ color: 'green', message: 'Wheel deleted.' }),
      onError: (e) => notifications.show({ color: 'red', message: e.message }),
    });
  };

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={{ base: 'sm', md: 'md' }}>
      {wheels.map((wheel) => (
        <Card
          key={wheel.id}
          withBorder
          radius="lg"
          shadow="sm"
          onClick={() => openWheel(wheel)}
          style={{ cursor: 'pointer' }}
        >
          <Group justify="space-between" mb="xs" wrap="nowrap">
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
  );
}

function ChangePasswordTab() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const changePassword = useChangePassword();

  const submit = async () => {
    if (!password) {
      notifications.show({ color: 'yellow', message: 'Please enter a new password.' });
      return;
    }
    if (password !== confirm) {
      notifications.show({ color: 'yellow', message: 'Passwords do not match.' });
      return;
    }
    try {
      await changePassword.mutateAsync({ password });
      notifications.show({ color: 'green', message: 'Password updated successfully.' });
      setPassword('');
      setConfirm('');
    } catch (e) {
      notifications.show({ color: 'red', message: e.message });
    }
  };

  return (
    <Stack>
      <PasswordInput
        label="New password"
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        required
      />
      <PasswordInput
        label="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        required
      />
      <Button
        onClick={submit}
        loading={changePassword.isPending}
        variant="gradient"
        gradient={{ from: 'grape', to: 'indigo' }}
      >
        Update password
      </Button>
    </Stack>
  );
}

function DeleteAccountTab() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const deleteAccount = useDeleteAccount();

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
      await signOut();
      navigate('/');
      notifications.show({ color: 'green', message: 'Account deleted.' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message });
    }
  };

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        Permanently deletes your account and all your saved wheels. This cannot be undone.
      </Text>
      {!confirming ? (
        <Button color="red" variant="light" onClick={() => setConfirming(true)}>
          Delete my account
        </Button>
      ) : (
        <Stack>
          <Text size="sm" fw={600}>
            Are you sure? This action is irreversible.
          </Text>
          <Group>
            <Button
              color="red"
              loading={deleteAccount.isPending}
              onClick={handleDelete}
            >
              Yes, delete my account
            </Button>
            <Button variant="subtle" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
}

export function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <Center h={300}>
        <Loader color="grape" />
      </Center>
    );
  }

  return (
    <Container size="lg" py="md">
      <Title order={2} mb={4}>
        Profile
      </Title>
      <Text size="xs" c="dimmed" mb="md">
        {user?.email}
      </Text>
      <Tabs defaultValue="wheels">
        <Tabs.List grow mb="md">
          <Tabs.Tab value="wheels">Saved wheels</Tabs.Tab>
          <Tabs.Tab value="password">Change password</Tabs.Tab>
          <Tabs.Tab value="delete">Delete account</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="wheels">
          <SavedWheels userId={user?.id} />
        </Tabs.Panel>

        <Tabs.Panel value="password">
          <ChangePasswordTab />
        </Tabs.Panel>

        <Tabs.Panel value="delete">
          <DeleteAccountTab />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
