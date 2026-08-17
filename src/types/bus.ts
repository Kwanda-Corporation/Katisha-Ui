export interface SeatConfig {
  rows: number;
  leftPerRow: number;
  rightPerRow: number;
}

export interface Seat {
  id: string;
  label: string;
  row: number;
  col: number;
  side: 'left' | 'right';
}

export function generateSeats(config: SeatConfig): Seat[] {
  const seats: Seat[] = [];
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.leftPerRow; c++) {
      const num = r * (config.leftPerRow + config.rightPerRow) + c + 1;
      seats.push({ id: `L${r}-${c}`, label: `${num}`, row: r, col: c, side: 'left' });
    }
    for (let c = 0; c < config.rightPerRow; c++) {
      const num = r * (config.leftPerRow + config.rightPerRow) + config.leftPerRow + c + 1;
      seats.push({ id: `R${r}-${c}`, label: `${num}`, row: r, col: c, side: 'right' });
    }
  }
  return seats;
}
