import { useState } from 'react';
import {
  Modal,
  Tabs,
  TextInput,
  PasswordInput,
  Button,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useSignIn, useSignUp } from '../hooks/useAuthMutations';

export function AuthModal({ opened, onClose }) {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const signIn = useSignIn();
  const signUp = useSignUp();
  const loading = signIn.isPending || signUp.isPending;

  const submit = async () => {
    if (!email || !password) {
      notifications.show({ color: 'yellow', message: 'Email and password are required.' });
      return;
    }
    try {
      if (tab === 'signin') {
        await signIn.mutateAsync({ email, password });
        notifications.show({ color: 'green', message: 'Welcome back!' });
        onClose();
      } else {
        await signUp.mutateAsync({ email, password, username });
        notifications.show({
          color: 'green',
          title: 'Account created',
          message: 'Check your email to confirm, then sign in.',
        });
        setTab('signin');
      }
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Authentication failed',
        message: e.message,
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Welcome to Omnipotent Wheelspin"
      centered
      radius="lg"
    >
      <Tabs value={tab} onChange={setTab} mb="md">
        <Tabs.List grow>
          <Tabs.Tab value="signin">Sign in</Tabs.Tab>
          <Tabs.Tab value="signup">Create account</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <Stack>
        {tab === 'signup' && (
          <TextInput
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            placeholder="spinmaster"
          />
        )}
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="you@example.com"
          required
        />
        <PasswordInput
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          required
        />
        <Button
          fullWidth
          loading={loading}
          onClick={submit}
          variant="gradient"
          gradient={{ from: 'grape', to: 'indigo' }}
        >
          {tab === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </Stack>
    </Modal>
  );
}
