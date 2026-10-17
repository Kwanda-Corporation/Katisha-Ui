import React from 'react';
import BusShell from './BusShell';
import Seat from './Seat';
import './seatMap.css';
import { SeatCell, SeatRow, visualState } from '../../types/seat';

export interface BusSeatMapProps {
  rows: SeatRow[];
  selectedSet?: Set<string>;
  onToggleSeat?: (label: string) => void;
  /** Admin mode: occupied seats become inspectable rather than inert. */
  mode?: 'passenger' | 'admin';
  onInspectSeat?: (cell: SeatCell) => void;
  agencyName?: string;
  logo?: string;
  /** Row (seat label) that should briefly shake after a rejected tap. */
  shakeSeat?: string | null;
  /** Max height of the scrolling seat area. */
  maxHeight?: string;
  ariaBusy?: boolean;
}

const DriverCabin: React.FC<{ logo?: string; agencyName?: string }> = ({ logo, agencyName }) => (
  <div className="bus-driver">
    <div className="bus-driver__unit" aria-hidden>
      <span className="bus-driver__seat" />
      <img src="/steering-wheel.png" alt="" className="bus-driver__wheel" />
    </div>
    {logo ? (
      <img src={logo} alt={agencyName ? `${agencyName} logo` : 'Agency'} className="bus-driver__logo" />
    ) : (
      <span className="bus-driver__label">Driver</span>
    )}
  </div>
);

/**
 * Data-driven, camera-tilted bus seat map. The layout (rows, aisles, labels,
 * statuses) comes entirely from the API — nothing here hard-codes seat numbers
 * or counts. Rows are handed to CSS in ascending order (front row y = 1 first)
 * and the stylesheet flips the axis: below the `sm` breakpoint the bus stands
 * upright with the driver pinned at the bottom; from `sm` up it lies flat
 * (landscape) with the driver on the left, so a full 45-seat layout fits without
 * scrolling.
 */
const BusSeatMap: React.FC<BusSeatMapProps> = ({
  rows,
  selectedSet,
  onToggleSeat,
  mode = 'passenger',
  onInspectSeat,
  agencyName,
  logo,
  shakeSeat,
  maxHeight = 'min(64vh, 620px)',
  ariaBusy,
}) => {
  const admin = mode === 'admin';
  const hasDriverCell = rows.some((r) => r.cells.some((c) => c.type === 'driver'));
  // Front row (y = 1) nearest the driver; CSS column-reverse puts it at the
  // bottom for the upright layout and row keeps it on the left when landscape.
  const ordered = React.useMemo(() => [...rows].sort((a, b) => a.y - b.y), [rows]);

  const viewportRef = React.useRef<HTMLDivElement>(null);

  // The upright (phone) layout stacks the front row — and the driver — at the
  // bottom, so the scroll area would otherwise open on the back seats. Start it
  // at the front instead. A no-op in the flat layout, which doesn't scroll.
  React.useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const raf = requestAnimationFrame(() => {
      vp.scrollTop = vp.scrollHeight;
    });
    return () => cancelAnimationFrame(raf);
  }, [ordered]);

  const renderCell = (cell: SeatCell, key: string) => {
    switch (cell.type) {
      case 'seat': {
        const label = cell.label ?? '';
        const selected = !!label && !!selectedSet?.has(label);
        const occupied =
          cell.status === 'booked_online' || cell.status === 'booked_manual' || cell.status === 'blocked' || cell.status === 'held';
        const handleClick = () => {
          if (!label) return;
          onToggleSeat?.(label);
          if (admin && occupied) onInspectSeat?.(cell);
        };
        return (
          <Seat
            key={key}
            cell={cell}
            state={visualState(cell, selected)}
            onClick={onToggleSeat ? handleClick : undefined}
            forceSelectable={admin}
            admin={admin}
            shake={!!label && label === shakeSeat}
            title={
              admin && cell.passengerName
                ? `Seat ${label} — ${cell.passengerName}${cell.passengerPhone ? ` · ${cell.passengerPhone}` : ''}`
                : undefined
            }
          />
        );
      }
      case 'aisle':
        return <span key={key} className="bus-aisle" aria-hidden />;
      case 'gap':
      case 'door':
      default:
        return <span key={key} className="bus-gap" aria-hidden />;
    }
  };

  return (
    <div className="bus-seatmap" aria-busy={ariaBusy}>
      <BusShell logo={undefined} agencyName={agencyName}>
        <div className="bus-seatmap__viewport" ref={viewportRef} style={{ maxHeight }}>
          <div className="bus-seatmap__inner">
            {!hasDriverCell && <DriverCabin logo={logo} agencyName={agencyName} />}
            {ordered.map((row) => {
              // A driver row replaces the pinned cabin.
              if (row.cells.some((c) => c.type === 'driver')) {
                return <DriverCabin key={`driver-${row.y}`} logo={logo} agencyName={agencyName} />;
              }
              return (
                <div key={row.y} className="bus-seatmap__row">
                  {row.cells.map((cell, i) => renderCell(cell, `${row.y}-${i}`))}
                </div>
              );
            })}
          </div>
        </div>
      </BusShell>
    </div>
  );
};

export default BusSeatMap;
