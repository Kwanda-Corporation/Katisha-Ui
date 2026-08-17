import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export type RevealDirection = 'left' | 'right' | 'up' | 'down' | 'zoom' | 'fade';

const INITIAL: Record<RevealDirection, { x?: number; y?: number; scale?: number }> = {
  left: { x: -56 },
  right: { x: 56 },
  up: { y: 44 },
  down: { y: -44 },
  zoom: { scale: 0.88 },
  fade: {},
};

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Scroll-triggered reveal. Children animate in when they enter the viewport:
// direction controls where they come from, delay staggers a group.
export function Reveal({
  direction = 'up',
  delay = 0,
  duration = 1,
  once = true,
  margin = '-60px 0px -60px 0px',
  className,
  children,
}: {
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  once?: boolean;
  margin?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...INITIAL[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, margin }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
