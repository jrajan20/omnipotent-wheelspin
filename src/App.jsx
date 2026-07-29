import { AppShell } from '@mantine/core';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Builder } from './pages/Builder';
import { Dashboard } from './pages/Dashboard';
import { SharedWheel } from './pages/SharedWheel';

export default function App() {
  return (
    <AppShell header={{ height: 52 }} padding="md">
      <AppShell.Header>
        <Navbar />
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Builder />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/w/:shareId" element={<SharedWheel />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
