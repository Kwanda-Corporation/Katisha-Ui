import React from 'react';
import { X } from 'lucide-react';

export interface SummaryBarProps {
  selected: string[];
  maxSeats: number;
  price: number;
  currency: string;
  summary: { total: number; available: number; taken: number; blocked: number };
  onClear?: () => void;
  onRemoveSeat?: (label: string) => void;
  /** Slot for the primary CTA (passenger Continue / admin action). */
  action?: React.ReactNode;
}

const money = (value: number, currency: string) =>
  `${currency || 'RWF'} ${Number(value || 0).toLocaleString('en-US')}`;

const SummaryBar: React.FC<SummaryBarProps> = ({
  selected,
  maxSeats,
  price,
  currency,
  summary,
  onClear,
  onRemoveSeat,
  action,
}) => {
  const total = selected.length * price;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        border: '1px solid var(--border)',
        borderRadius: 14,
        background: 'var(--white)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220, flex: '1 1 260px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            {selected.length}/{maxSeats} seats selected
          </span>
          {onClear && selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              style={{
                border: 0,
                background: 'none',
                color: 'var(--blue)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Clear
            </button>
          )}
        </div>

        {selected.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selected.map((label) => (
              <span
                key={label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'var(--blue-bg)',
                  color: 'var(--blue)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {label}
                {onRemoveSeat && (
                  <button
                    type="button"
                    aria-label={`Remove seat ${label}`}
                    onClick={() => onRemoveSeat(label)}
                    style={{ border: 0, background: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {summary.available} of {summary.total} seats available — tap a seat to choose.
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Total
          </div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)' }}>
            {money(total, currency)}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
};

export default SummaryBar;
