import React from 'react';
import BusShell from './BusShell';
import './seatMap.css';

const Cell: React.FC = () => (
  <span
    className="skeleton"
    style={{
      width: 'var(--seat-w)',
      height: 'var(--seat-h)',
      borderRadius: 10,
      flex: '0 0 auto',
    }}
  />
);

const Slot: React.FC = () => (
  <span
    className="skeleton"
    style={{
      width: 'var(--seat-w)',
      height: 'var(--seat-h)',
      borderRadius: 10,
      flex: '0 0 auto',
      opacity: 0.5,
    }}
  />
);

/** Placeholder shell shown while the layout loads. */
const SeatMapSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <div className="bus-seatmap">
    <div className="bus-seatmap__viewport">
      <div className="bus-seatmap__inner">
        <BusShell>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 'var(--seat-gap)' }}>
              <Slot />
              <Cell />
              <span className="bus-aisle" />
              <Slot />
              <Cell />
            </div>
          ))}
          <div className="bus-driver" style={{ width: '100%' }}>
            <span className="bus-driver__wheel" />
            <span className="bus-driver__dashboard" />
          </div>
        </BusShell>
      </div>
    </div>
  </div>
);

export default SeatMapSkeleton;
