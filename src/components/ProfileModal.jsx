import { useState } from 'react';
import {
  Modal,
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
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconMoodEmpty } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useChangePassword, useDeleteAccount } from '../hooks/useAuthMutations';
import { useMyWheels } from '../hooks/useWheels';

function SavedWheels({ userId }) {
  const navigate = useNavigate();
  const { data: wheels = [], isLoading } = useMyWheels(userId);

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
        </Stack>
      </Center>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
      {wheels.map((wheel) => (
        <Card
          key={wheel.id}
          withBorder
          radius="md"
          shadow="xs"
          style={{ cursor: wheel.share_id ? 'pointer' : 'default' }}
          onClick={() => wheel.share_id && navigate(`/w/${wheel.share_id}`)}
        >
          <Group justify="space-between" wrap="nowrap">
            <Text fw={600} lineClamp={1} size="sm">
              {wheel.title}
            </Text>
            {wheel.is_public && (
              <Badge color="grape" variant="light" size="xs">
                Shared
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt={4}>
            {wheel.options?.length ?? 0} options · {wheel.spin_count ?? 0} spins
          </Text>
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

function DeleteAccountTab({ onClose }) {
  const { signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const deleteAccount = useDeleteAccount();

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync();
      await signOut();
      onClose();
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

export function ProfileModal({ opened, onClose }) {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 480px)');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={4}>Profile</Title>}
      centered
      radius="lg"
      size={isMobile ? '100%' : 'lg'}
    >
      <Text size="xs" c="dimmed" mb="sm">
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
          <DeleteAccountTab onClose={onClose} />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
