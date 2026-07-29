import { useState } from 'react';
import {
  Container,
  Grid,
  Group,
  TextInput,
  Button,
} from '@mantine/core';
import { IconDeviceFloppy, IconShare } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ChatPanel } from '../components/ChatPanel';
import { ItemList } from '../components/ItemList';
import { WheelCanvas } from '../components/WheelCanvas';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../auth/AuthProvider';
import { itemsFromLabels, saveWheel, setWheelPublic } from '../utils/wheels';

export function Builder() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState([]);
  const [wheelId, setWheelId] = useState(null);
  const [shareId, setShareId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleList = ({ title: nextTitle, labels }) => {
    if (nextTitle && !title.trim()) setTitle(nextTitle);
    setItems(itemsFromLabels(labels));
    setWheelId(null);
    setShareId(null);
  };

  const addItem = (item) => setItems((current) => [...current, item]);
  const removeItem = (id) =>
    setItems((current) => current.filter((item) => item.id !== id));
  const clear = () => setItems([]);

  const requireReady = () => {
    if (!title.trim()) {
      notifications.show({ color: 'yellow', message: 'Give your wheel a title first.' });
      return false;
    }
    if (items.length < 2) {
      notifications.show({ color: 'yellow', message: 'Add at least 2 options.' });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!user) return setAuthOpen(true);
    if (!requireReady()) return;
    setSaving(true);
    try {
      const saved = await saveWheel({
        id: wheelId,
        title: title.trim(),
        options: items,
        isPublic: !!shareId,
        userId: user.id,
      });
      setWheelId(saved.id);
      notifications.show({ color: 'green', message: 'Wheel saved to your profile.' });
    } catch (e) {
      notifications.show({ color: 'red', title: 'Save failed', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!user) return setAuthOpen(true);
    if (!requireReady()) return;
    setSaving(true);
    try {
      let saved;
      if (!wheelId) {
        saved = await saveWheel({
          title: title.trim(),
          options: items,
          isPublic: true,
          userId: user.id,
        });
        setWheelId(saved.id);
      } else {
        saved = await setWheelPublic(wheelId, true);
      }
      setShareId(saved.share_id);
      const link = `${window.location.origin}/w/${saved.share_id}`;
      await navigator.clipboard.writeText(link).catch(() => {});
      notifications.show({
        color: 'grape',
        title: 'Share link copied!',
        message: link,
      });
    } catch (e) {
      notifications.show({ color: 'red', title: 'Share failed', message: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container size="xl" py="md">
      <Group mb="md" justify="space-between">
        <TextInput
          size="md"
          placeholder="Name your wheel…"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          style={{ flex: 1, maxWidth: 480 }}
        />
        <Group>
          <Button
            variant="light"
            color="grape"
            leftSection={<IconShare size={18} />}
            onClick={handleShare}
            loading={saving}
          >
            Share
          </Button>
          <Button
            variant="gradient"
            gradient={{ from: 'grape', to: 'indigo' }}
            leftSection={<IconDeviceFloppy size={18} />}
            onClick={handleSave}
            loading={saving}
          >
            Save
          </Button>
        </Group>
      </Group>

      <Grid gutter="md" align="stretch">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ChatPanel onList={handleList} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <ItemList
            items={items}
            onAdd={addItem}
            onRemove={removeItem}
            onClear={clear}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <WheelCanvas items={items} />
        </Grid.Col>
      </Grid>

      <AuthModal opened={authOpen} onClose={() => setAuthOpen(false)} />
    </Container>
  );
}
