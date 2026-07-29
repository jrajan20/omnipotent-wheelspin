import { useState } from 'react';
import {
  Group,
  Title,
  Button,
  Menu,
  Avatar,
  ActionIcon,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconMoon,
  IconSun,
  IconLogout,
  IconLayoutGrid,
  IconSparkles,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const { user, signOut } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <Group h="100%" px="md" justify="space-between">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <Group gap="xs" wrap="nowrap">
          <IconSparkles size={26} color="var(--mantine-color-grape-5)" />
          <Title order={3} c="grape.4">
            Omnipotent Wheelspin
          </Title>
        </Group>
      </Link>

      <Group>
        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={toggleColorScheme}
          aria-label="Toggle color scheme"
        >
          {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>

        {user ? (
          <Menu shadow="md" width={210} position="bottom-end">
            <Menu.Target>
              <Avatar radius="xl" color="grape" style={{ cursor: 'pointer' }}>
                {(user.email ?? '?')[0].toUpperCase()}
              </Avatar>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user.email}</Menu.Label>
              <Menu.Item
                leftSection={<IconLayoutGrid size={16} />}
                onClick={() => navigate('/dashboard')}
              >
                My wheels
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={signOut}
              >
                Sign out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : (
          <Button
            variant="gradient"
            gradient={{ from: 'grape', to: 'indigo' }}
            onClick={() => setAuthOpen(true)}
          >
            Sign in
          </Button>
        )}
      </Group>

      <AuthModal opened={authOpen} onClose={() => setAuthOpen(false)} />
    </Group>
  );
}
