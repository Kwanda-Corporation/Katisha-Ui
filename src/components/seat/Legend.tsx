import React from 'react';
import { Check, Lock, X } from 'lucide-react';

interface ItemProps {
  label: string;
  swatch: React.ReactNode;
}

const Item: React.FC<ItemProps> = ({ label, swatch }) => (
  <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    {swatch}
    <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 500 }}>{label}</span>
  </li>
);

/** Swatch matching the Seat component's layered look, in miniature. */
const Swatch: React.FC<{ bg: string; border: string; icon?: React.ReactNode; hatch?: boolean }> = ({
  bg,
  border,
  icon,
  hatch,
}) => (
  <span
    aria-hidden
    style={{
      width: 18,
      height: 18,
      borderRadius: 5,
      background: hatch ? 'repeating-linear-gradient(45deg,#94A3B8 0px,#94A3B8 3px,#CBD5E1 3px,#CBD5E1 6px)' : bg,
      border: `1px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    {icon}
  </span>
);

/**
 * Legend for seat states. Colour is never the only signal — selected seats
 * carry a check, taken an X, blocked a lock, so the map stays readable for
 * colour-blind users and in greyscale.
 */
const Legend: React.FC = () => (
  <ul
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '12px 16px',
      listStyle: 'none',
      margin: 0,
      padding: 0,
    }}
  >
    <Item label="Available" swatch={<Swatch bg="linear-gradient(180deg,#ffffff,#eef1f6)" border="#cfd6e2" />} />
    <Item label="Selected" swatch={<Swatch bg="linear-gradient(180deg,#2563EB,#1D4ED8)" border="#1E40AF" icon={<Check size={10} color="#fff" strokeWidth={3} />} />} />
    <Item label="Taken" swatch={<Swatch bg="linear-gradient(180deg,#B25151,#9B3D3D)" border="#7F3B3B" icon={<X size={10} color="#fff" strokeWidth={3} />} />} />
    <Item label="Blocked" swatch={<Swatch bg="" border="#94A3B8" hatch icon={<Lock size={10} color="#fff" strokeWidth={3} />} />} />
  </ul>
);

export default Legend;
