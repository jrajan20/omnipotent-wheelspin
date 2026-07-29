import { motion } from 'framer-motion';

const COLORS = ['#7048e8', '#f76707', '#0ca678', '#e64980', '#1c7ed6', '#f59f00'];
const COUNT = 26;

// Computed once at module load so render stays pure (no Math.random in render).
const PIECES = Array.from({ length: COUNT }, (_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 280,
  rotate: Math.random() * 540,
  color: COLORS[i % COLORS.length],
  delay: Math.random() * 0.15,
  duration: 1.1 + Math.random() * 0.6,
}));

// Lightweight confetti burst rendered with Framer Motion (no extra deps).
export function Confetti() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {PIECES.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ opacity: 1, x: 0, y: -10, rotate: 0 }}
          animate={{ opacity: 0, x: piece.x, y: 280, rotate: piece.rotate }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: 8,
            height: 14,
            borderRadius: 2,
            background: piece.color,
          }}
        />
      ))}
    </div>
  );
}
