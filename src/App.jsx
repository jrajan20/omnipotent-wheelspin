import { AppShell, Alert, Text, Code } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Builder } from './pages/Builder';
import { Dashboard } from './pages/Dashboard';
import { SharedWheel } from './pages/SharedWheel';
import { supabaseConfigured } from './utils/supabase';

export default function App() {
  return (
    <AppShell header={{ height: { base: 48, sm: 52 } }} padding="md">
      <AppShell.Header>
        <Navbar />
      </AppShell.Header>
      <AppShell.Main>
        {!supabaseConfigured && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            title="Configuration required"
            color="red"
            mb="md"
          >
            <Text size="sm">
              The app is missing its Supabase credentials. Add{' '}
              <Code>VITE_SUPABASE_URL</Code> and <Code>VITE_SUPABASE_ANON_KEY</Code> to
              your Vercel project (Settings → Environment Variables) and redeploy.
            </Text>
          </Alert>
        )}
        <Routes>
          <Route path="/" element={<Builder />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/w/:shareId" element={<SharedWheel />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
