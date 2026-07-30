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
import { useMediaQuery } from '@mantine/hooks';
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
  const isMobile = useMediaQuery('(max-width: 480px)');

  return (
    <Group h="100%" px={{ base: 'xs', sm: 'md' }} justify="space-between" wrap="nowrap">
      <Link to="/" style={{ textDecoration: 'none', minWidth: 0 }}>
        <Group gap={{ base: 4, sm: 'xs' }} wrap="nowrap">
          <IconSparkles size={isMobile ? 18 : 26} color="var(--mantine-color-grape-5)" />
          <Title order={3} fz={{ base: 'sm', xs: 'md', sm: 'xl' }} c="grape.4" style={{ whiteSpace: 'nowrap' }}>
            Omnipotent Wheelspin
          </Title>
        </Group>
      </Link>

      <Group gap={{ base: 4, sm: 'sm' }} wrap="nowrap">
        <ActionIcon
          variant="subtle"
          size={isMobile ? 'sm' : 'lg'}
          onClick={toggleColorScheme}
          aria-label="Toggle color scheme"
        >
          {colorScheme === 'dark'
            ? <IconSun size={isMobile ? 15 : 20} />
            : <IconMoon size={isMobile ? 15 : 20} />}
        </ActionIcon>

        {user ? (
          <Menu shadow="md" width={210} position="bottom-end">
            <Menu.Target>
              <Avatar
                radius="xl"
                size={isMobile ? 'sm' : 'md'}
                color="grape"
                style={{ cursor: 'pointer' }}
              >
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
            size={isMobile ? 'xs' : 'sm'}
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
