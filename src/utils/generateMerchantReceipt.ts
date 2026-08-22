/**
 * Generates an orange-themed "Payment Under Review" receipt image using
 * HTML Canvas. The returned data-URL can be displayed in an <img> tag
 * or saved via a download link.
 */

export interface MerchantReceiptData {
  referenceCode: string;
  origin: string;
  destination: string;
  travelDate: string;
  travelTime: string;
  seats: number;
  totalAmount: number;
  passengerName?: string;
}

const ORANGE = '#D97706';
const ORANGE_DARK = '#B45309';
const ORANGE_LIGHT = '#FEF3C7';
const ORANGE_BG = '#FFFBEB';
const INK = '#111111';
const MUTED = '#78716C';
const WHITE = '#FFFFFF';

function formatDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
  if (!m) return d;
  const mo = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][parseInt(m[2], 10) - 1] || m[2];
  return `${m[3]} ${mo} ${m[1]}`;
}

function formatTime(t: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(t || '');
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${min} ${ap}`;
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export async function generateMerchantReceipt(data: MerchantReceiptData): Promise<string> {
  const W = 1080;
  const H = 1920;
  const PADDING = 80;
  const INNER_W = W - PADDING * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = ORANGE_BG;
  ctx.fillRect(0, 0, W, H);

  // ── ORANGE HEADER ──
  drawRoundRect(ctx, 0, 0, W, 520, 0);
  ctx.fillStyle = ORANGE;
  ctx.fill();

  // KATISHA wordmark
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 56px Inter, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KATISHA', W / 2, 100);

  // Tagline
  ctx.font = '24px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Your trusted travel partner', W / 2, 140);

  // Orange circle badge
  ctx.beginPath();
  ctx.arc(W / 2, 260, 72, 0, Math.PI * 2);
  ctx.fillStyle = WHITE;
  ctx.fill();

  // Clock icon (simple circle + hands)
  ctx.beginPath();
  ctx.arc(W / 2, 260, 56, 0, Math.PI * 2);
  ctx.strokeStyle = ORANGE;
  ctx.lineWidth = 6;
  ctx.stroke();
  // Hour hand
  ctx.beginPath();
  ctx.moveTo(W / 2, 260);
  ctx.lineTo(W / 2, 230);
  ctx.strokeStyle = ORANGE_DARK;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();
  // Minute hand
  ctx.beginPath();
  ctx.moveTo(W / 2, 260);
  ctx.lineTo(W / 2 + 28, 260);
  ctx.stroke();
  // Center dot
  ctx.beginPath();
  ctx.arc(W / 2, 260, 4, 0, Math.PI * 2);
  ctx.fillStyle = ORANGE_DARK;
  ctx.fill();

  // "PAYMENT UNDER REVIEW" title
  ctx.textAlign = 'center';
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 48px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('PAYMENT UNDER REVIEW', W / 2, 400);

  // Subtitle
  ctx.font = '26px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('We are verifying your payment', W / 2, 450);

  // ── WHITE CARD ──
  const cardY = 560;
  const cardH = 820;
  drawRoundRect(ctx, PADDING - 10, cardY, INNER_W + 20, cardH, 28);
  ctx.fillStyle = WHITE;
  ctx.fill();
  // Subtle shadow
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  let y = cardY + 60;

  // Reference code badge
  const refText = data.referenceCode.toUpperCase();
  ctx.font = 'bold 28px "Courier New", monospace';
  const refW = ctx.measureText(refText).width + 60;
  drawRoundRect(ctx, (W - refW) / 2, y - 30, refW, 52, 26);
  ctx.fillStyle = ORANGE_LIGHT;
  ctx.fill();
  ctx.fillStyle = ORANGE_DARK;
  ctx.textAlign = 'center';
  ctx.fillText(refText, W / 2, y + 8);
  y += 80;

  // Divider
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.moveTo(PADDING + 40, y);
  ctx.lineTo(W - PADDING - 40, y);
  ctx.strokeStyle = '#E7E5E4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  y += 40;

  // Route
  const origin = data.origin.toUpperCase().slice(0, 14);
  const destination = data.destination.toUpperCase().slice(0, 14);
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText('ROUTE', PADDING + 50, y);
  ctx.textAlign = 'right';
  ctx.fillText('TRAVEL DATE', W - PADDING - 50, y);
  y += 40;
  ctx.textAlign = 'left';
  ctx.font = 'bold 36px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(`${origin}  →  ${destination}`, PADDING + 50, y);
  ctx.textAlign = 'right';
  ctx.fillText(formatDate(data.travelDate), W - PADDING - 50, y);
  y += 70;

  // Departure + Seats
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText('DEPARTURE', PADDING + 50, y);
  ctx.textAlign = 'right';
  ctx.fillText('SEATS', W - PADDING - 50, y);
  y += 40;
  ctx.textAlign = 'left';
  ctx.font = 'bold 36px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(formatTime(data.travelTime), PADDING + 50, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${data.seats} Seat${data.seats > 1 ? 's' : ''}`, W - PADDING - 50, y);
  y += 70;

  // Divider
  ctx.setLineDash([6, 10]);
  ctx.beginPath();
  ctx.moveTo(PADDING + 40, y);
  ctx.lineTo(W - PADDING - 40, y);
  ctx.strokeStyle = '#E7E5E4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);
  y += 40;

  // Passenger
  if (data.passengerName) {
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px Inter, Helvetica, Arial, sans-serif';
    ctx.fillStyle = MUTED;
    ctx.fillText('PASSENGER', PADDING + 50, y);
    y += 40;
    ctx.font = 'bold 32px Inter, Helvetica, Arial, sans-serif';
    ctx.fillStyle = INK;
    ctx.fillText(data.passengerName.toUpperCase().slice(0, 24), PADDING + 50, y);
    y += 60;
  }

  // Total amount
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText('AMOUNT PAID', PADDING + 50, y);
  y += 45;
  ctx.font = 'bold 44px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = ORANGE_DARK;
  ctx.fillText(`${data.totalAmount.toLocaleString()} RWF`, PADDING + 50, y);
  y += 80;

  // ── MESSAGE BOX ──
  const msgY = cardY + cardH + 40;
  drawRoundRect(ctx, PADDING, msgY, INNER_W, 220, 20);
  ctx.fillStyle = ORANGE_LIGHT;
  ctx.fill();
  // Orange left accent bar
  drawRoundRect(ctx, PADDING, msgY, 8, 220, 4);
  ctx.fillStyle = ORANGE;
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = 'bold 28px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = ORANGE_DARK;
  const msgY2 = wrapText(
    ctx,
    'We are checking your payment. You will receive your ticket once the payment is verified by our team.',
    PADDING + 40,
    msgY + 60,
    INNER_W - 80,
    38,
  );

  // ── CONTACTS FOOTER ──
  const footY = msgY + 260;
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText('NEED HELP? CONTACT US', W / 2, footY);

  ctx.font = '24px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText('+250 793 216 191  ·  +250 722 829 315', W / 2, footY + 40);

  ctx.font = '22px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = MUTED;
  ctx.fillText('support@katisha.today  ·  katisha.today', W / 2, footY + 78);

  // Very bottom: Katisha branding
  ctx.font = 'bold 18px Inter, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#D6D3D1';
  ctx.fillText('KATISHA · Your trusted travel partner', W / 2, H - 50);

  return canvas.toDataURL('image/png');
}
