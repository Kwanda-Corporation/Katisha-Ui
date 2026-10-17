import React from 'react';
import { Check, Lock, X } from 'lucide-react';
import { SeatCell, VisualSeatState } from '../../types/seat';

export interface SeatProps {
  cell: SeatCell;
  state: VisualSeatState;
  onClick?: () => void;
  /** Admin mode: called when an occupied/inert seat is tapped to view details. */
  onInspect?: () => void;
  /** Admin mode: makes every seat tappable (for bulk selection), not just free ones. */
  forceSelectable?: boolean;
  /** Admin mode surfaces the manual-booking badge and passenger hint. */
  admin?: boolean;
  /** Brief shake for an attempted interaction with a taken seat. */
  shake?: boolean;
  /** Extra content for the admin side panel to hook into. */
  title?: string;
}

const STATE_LABEL: Record<VisualSeatState, string> = {
  available: 'available',
  selected: 'selected',
  taken: 'taken',
  blocked: 'blocked',
  held: 'taken',
};

/** Layered gradients per state. Colours are functional seat-state only. */
const SKIN: Record<VisualSeatState, { back: string; cushion: string; head: string; border: string; text: string }> = {
  available: {
    back: 'linear-gradient(180deg,#ffffff 0%,#eaf1ff 100%)',
    cushion: 'linear-gradient(180deg,#f8fbff 0%,#dbe7fb 100%)',
    head: 'linear-gradient(180deg,#ffffff 0%,#eef4ff 100%)',
    border: '#c3d4f2',
    text: '#1E3A8A',
  },
  selected: {
    back: 'linear-gradient(180deg,#2563EB 0%,#1D4ED8 100%)',
    cushion: 'linear-gradient(180deg,#1D4ED8 0%,#1E40AF 100%)',
    head: 'linear-gradient(180deg,#3B82F6 0%,#2563EB 100%)',
    border: '#1E40AF',
    text: '#ffffff',
  },
  taken: {
    back: 'linear-gradient(180deg,#B25151 0%,#9B3D3D 100%)',
    cushion: 'linear-gradient(180deg,#A04444 0%,#8A3434 100%)',
    head: 'linear-gradient(180deg,#B85C5C 0%,#A34A4A 100%)',
    border: '#7F3B3B',
    text: 'rgba(255,255,255,0.92)',
  },
  blocked: {
    back: 'repeating-linear-gradient(45deg,#94A3B8 0px,#94A3B8 4px,#CBD5E1 4px,#CBD5E1 8px)',
    cushion: 'repeating-linear-gradient(45deg,#94A3B8 0px,#94A3B8 4px,#CBD5E1 4px,#CBD5E1 8px)',
    head: 'repeating-linear-gradient(45deg,#94A3B8 0px,#94A3B8 4px,#CBD5E1 4px,#CBD5E1 8px)',
    border: '#94A3B8',
    text: '#ffffff',
  },
  held: {
    back: 'linear-gradient(180deg,#B25151 0%,#9B3D3D 100%)',
    cushion: 'linear-gradient(180deg,#A04444 0%,#8A3434 100%)',
    head: 'linear-gradient(180deg,#B85C5C 0%,#A34A4A 100%)',
    border: '#7F3B3B',
    text: 'rgba(255,255,255,0.92)',
  },
};

const Seat: React.FC<SeatProps> = ({ cell, state, onClick, onInspect, forceSelectable, admin, shake, title }) => {
  const skin = SKIN[state];
  const label = cell.label ?? '';
  const interactive = forceSelectable || state === 'available' || state === 'selected';
  const inspectable = !interactive && !!onInspect;
  const clickable = interactive || inspectable;
  const detailHidden = state === 'taken' || state === 'blocked' || state === 'held';

  const className = [
    'bus-seat',
    state === 'selected' ? 'bus-seat--selected' : '',
    state === 'taken' || state === 'held' ? 'bus-seat--taken' : '',
    state === 'blocked' ? 'bus-seat--blocked' : '',
    clickable && !interactive ? 'bus-seat--inspect' : '',
    forceSelectable && state !== 'selected' ? 'bus-seat--inspect' : '',
    shake ? 'bus-seat--shake' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={clickable ? (interactive ? onClick : onInspect) : undefined}
      disabled={!clickable}
      aria-pressed={interactive ? state === 'selected' : undefined}
      aria-label={`Seat ${label}, ${STATE_LABEL[state]}${inspectable ? ' — view details' : ''}`}
      title={title ?? `Seat ${label} — ${STATE_LABEL[state]}`}
    >
      <span className="bus-seat__body" style={{ border: `1px solid ${skin.border}` }}>
        {/* Backrest */}
        <span className="bus-seat__backrest" style={{ background: skin.back, color: skin.text }}>
          {!detailHidden && <span className="bus-seat__seam" style={{ top: '40%' }} />}
          {!detailHidden && <span className="bus-seat__seam" style={{ top: '66%' }} />}
        </span>
        {/* Headrest */}
        <span className="bus-seat__headrest" style={{ background: skin.head }} />
        {/* Cushion */}
        <span className="bus-seat__cushion" style={{ background: skin.cushion }} />
        {/* Armrests */}
        <span className="bus-seat__arm bus-seat__arm--left" />
        <span className="bus-seat__arm bus-seat__arm--right" />
        {/* Seat-belt buckle detail */}
        {!detailHidden && <span className="bus-seat__buckle" />}
      </span>

      <span className="bus-seat__number" style={{ color: skin.text }}>
        {label}
      </span>

      {state === 'selected' && (
        <span
          className="bus-seat__mark"
          style={{ color: '#ffffff', background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: 2 }}
        >
          <Check size={11} strokeWidth={3} />
        </span>
      )}
      {(state === 'taken' || state === 'held') && (
        <span className="bus-seat__mark" style={{ color: 'rgba(255,255,255,0.9)' }}>
          <X size={11} strokeWidth={3} />
        </span>
      )}
      {state === 'blocked' && (
        <span className="bus-seat__mark" style={{ color: '#ffffff' }}>
          <Lock size={11} strokeWidth={3} />
        </span>
      )}

      {/* Admin-only manual-booking badge ("booked at the station"). */}
      {admin && (cell.status === 'booked_manual') && (
        <span className="bus-seat__station">STATION</span>
      )}
    </button>
  );
};

export default Seat;
