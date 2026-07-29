import { useState } from 'react';
import { Wheel } from 'react-custom-roulette';
import { Stack, Button, Center, Text, Modal, Title } from '@mantine/core';
import { IconRotateClockwise2 } from '@tabler/icons-react';
import { Confetti } from './Confetti';

// Trim long labels so slices stay readable on the wheel.
function slice(label) {
  return label.length > 16 ? `${label.slice(0, 15)}…` : label;
}

export function WheelCanvas({ items, onSpinEnd }) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [winner, setWinner] = useState(null);

  const data = items.map((item) => ({
    option: slice(item.label),
    style: { backgroundColor: item.color, textColor: '#ffffff' },
  }));

  const canSpin = items.length >= 2 && !mustSpin;

  const handleSpin = () => {
    if (!canSpin) return;
    setWinner(null);
    setPrizeNumber(Math.floor(Math.random() * items.length));
    setMustSpin(true);
  };

  const handleStop = () => {
    setMustSpin(false);
    const result = items[prizeNumber];
    setWinner(result);
    onSpinEnd?.(result);
  };

  return (
    <Stack align="center" gap="md">
      {items.length >= 2 ? (
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={data}
          onStopSpinning={handleStop}
          spinDuration={0.6}
          outerBorderColor="#2b2b3a"
          outerBorderWidth={6}
          innerBorderColor="#2b2b3a"
          radiusLineColor="#2b2b3a"
          radiusLineWidth={1}
          fontSize={14}
          textDistance={62}
        />
      ) : (
        <Center
          h={300}
          w={300}
          style={{
            border: '2px dashed var(--mantine-color-default-border)',
            borderRadius: '50%',
          }}
        >
          <Text c="dimmed" ta="center" px="md">
            Add at least 2 options to spin the wheel
          </Text>
        </Center>
      )}

      <Button
        size="lg"
        radius="xl"
        disabled={!canSpin}
        onClick={handleSpin}
        leftSection={<IconRotateClockwise2 size={22} />}
        variant="gradient"
        gradient={{ from: 'grape', to: 'indigo' }}
      >
        Spin the wheel
      </Button>

      <Modal
        opened={!!winner}
        onClose={() => setWinner(null)}
        centered
        withCloseButton={false}
        radius="lg"
        size="sm"
      >
        {winner && (
          <Stack align="center" gap="xs" py="md" style={{ position: 'relative' }}>
            <Confetti />
            <Text size="sm" c="dimmed">
              The wheel has spoken
            </Text>
            <Title order={2} ta="center" c="grape.4">
              {winner.label}
            </Title>
            <Button
              mt="sm"
              onClick={() => setWinner(null)}
              variant="light"
              color="grape"
            >
              Spin again
            </Button>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
