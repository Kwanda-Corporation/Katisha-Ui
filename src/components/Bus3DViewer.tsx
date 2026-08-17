import { useMemo, useCallback } from 'react';
import { SeatConfig, Seat, generateSeats } from '../types/bus';
import { Bus } from 'lucide-react';

interface Bus3DViewerProps {
  config: SeatConfig;
  selectedSeats: string[];
  takenSeats?: string[];
  onSeatToggle: (seatId: string) => void;
  maxSelectable?: number;
}

export default function Bus3DViewer({ config, selectedSeats, takenSeats = [], onSeatToggle, maxSelectable }: Bus3DViewerProps) {
  const seats = useMemo(() => generateSeats(config), [config]);
  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);
  const takenSet = useMemo(() => new Set(takenSeats), [takenSeats]);
  const maxRow = Math.max(...seats.map(s => s.row), 0);

  const totalSeats = config.rows * (config.leftPerRow + config.rightPerRow);
  const takenCount = takenSeats.length;
  const selectedCount = selectedSeats.length;
  const availableCount = totalSeats - takenCount;

  const groupedByRow = useMemo(() => {
    const rows: { left: Seat[]; right: Seat[] }[] = [];
    for (let r = 0; r <= maxRow; r++) {
      rows.push({
        left: seats.filter(s => s.row === r && s.side === 'left'),
        right: seats.filter(s => s.row === r && s.side === 'right'),
      });
    }
    return rows;
  }, [seats, maxRow]);

  const handleClick = useCallback((id: string) => {
    if (takenSet.has(id)) return;
    if (maxSelectable && selectedSeats.length >= maxSelectable && !selectedSet.has(id)) return;
    onSeatToggle(id);
  }, [takenSet, maxSelectable, selectedSeats.length, selectedSet, onSeatToggle]);

  return (
    <div className="bg-white border border-[var(--border)] rounded-md overflow-hidden">
      <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus size={16} className="text-[var(--text-sub)]" />
          <span className="text-sm font-bold text-zinc-700">Bus Layout</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#1D4ED8]" /> {availableCount} free</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#3B82F6]" /> {selectedCount} selected</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#6B7280]" /> {takenCount} taken</span>
        </div>
      </div>

      {maxSelectable && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] font-semibold text-amber-700 flex items-center gap-1.5">
          <Bus size={13} /> Select up to {maxSelectable} seat{maxSelectable > 1 ? 's' : ''}
          {selectedCount > 0 && <span>({selectedCount} selected)</span>}
        </div>
      )}

      <div className="p-4 overflow-y-auto" style={{ maxHeight: 440 }}>
        <div className="inline-block">
          {/* Front indicator */}
          <div className="text-center mb-3">
            <span className="px-4 py-1 rounded-full bg-[#F9FAFB] text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider">Front</span>
          </div>

          {groupedByRow.map((row, ri) => {
            return (
              <div key={ri} className="flex items-center gap-2 mb-1.5">
                {/* Left side seats */}
                <div className="flex gap-1">
                  {row.left.length === 0 && <div className="w-5" />}
                  {row.left.map(seat => {
                    const isSel = selectedSet.has(seat.id);
                    const isTak = takenSet.has(seat.id);
                    const atMax = maxSelectable && selectedSeats.length >= maxSelectable && !isSel;
                    return (
                      <button key={seat.id}
                        onClick={() => handleClick(seat.id)}
                        disabled={isTak}
                        className={`w-10 h-10 rounded-sm text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer border ${
                          isTak ? 'bg-[#F9FAFB] text-[var(--text-muted)] border-[var(--border)] cursor-not-allowed' :
                          isSel ? 'bg-emerald-500 text-white border-emerald-600' :
                          atMax ? 'bg-[var(--blue-light)] text-blue-300 border-zinc-200 cursor-not-allowed' :
                          'bg-zinc-1000 text-white border-[var(--blue)] hover:bg-blue-400 active:bg-blue-600'
                        }`}
                      >
                        {seat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Aisle */}
                <div className="w-6 flex items-center justify-center">
                  <span className="text-[8px] text-[var(--text-muted)] font-mono">{ri + 1}</span>
                </div>

                {/* Right side seats */}
                <div className="flex gap-1">
                  {row.right.length === 0 && <div className="w-5" />}
                  {row.right.map(seat => {
                    const isSel = selectedSet.has(seat.id);
                    const isTak = takenSet.has(seat.id);
                    const atMax = maxSelectable && selectedSeats.length >= maxSelectable && !isSel;
                    return (
                      <button key={seat.id}
                        onClick={() => handleClick(seat.id)}
                        disabled={isTak}
                        className={`w-10 h-10 rounded-sm text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer border ${
                          isTak ? 'bg-[#F9FAFB] text-[var(--text-muted)] border-[var(--border)] cursor-not-allowed' :
                          isSel ? 'bg-emerald-500 text-white border-emerald-600' :
                          atMax ? 'bg-[var(--blue-light)] text-blue-300 border-zinc-200 cursor-not-allowed' :
                          'bg-zinc-1000 text-white border-[var(--blue)] hover:bg-blue-400 active:bg-blue-600'
                        }`}
                      >
                        {seat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Back indicator */}
          <div className="text-center mt-3">
            <span className="px-4 py-1 rounded-full bg-[#F9FAFB] text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider">Back</span>
          </div>
        </div>
      </div>
    </div>
  );
}
