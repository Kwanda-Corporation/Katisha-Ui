import { useState, useEffect } from 'react';
import { api, resolveImageUrl } from '../../api';
import { MapPin, Download, Loader2, Search, ChevronDown } from 'lucide-react';
import Pagination from '../../components/ui/Pagination';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

interface Booking {
  _id: string;
  referenceCode: string;
  origin: string;
  pickupPoint?: string;
  destination: string;
  travelDate: string;
  travelTime: string;
  seatNumbers: string[];
  passengerDetails: { name: string; phone: string; idNumber?: string }[];
  ticketImage?: string;
  agency: { name: string };
  status: string;
}

export default function PickupAgentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeFilter, setRouteFilter] = useState('');
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, [page]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      const res = await api.getPickupAgentBookings(params);
      const data = res?.data?.bookings || [];
      setAllBookings(data);
      setBookings(data);
      setTotalPages(res?.data?.pages || 1);
      setTotal(res?.data?.total || 0);
    } catch {
      setAllBookings([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  function handleRouteFilter(val: string) {
    setRouteFilter(val);
    if (!val) { setBookings(allBookings); return; }
    const lower = val.toLowerCase();
    setBookings(allBookings.filter(b => b.origin.toLowerCase().includes(lower) || b.destination.toLowerCase().includes(lower)));
  }

  const uniqueRoutes = Array.from(new Set(allBookings.map(b => b.pickupPoint ? `${b.origin} → ${b.pickupPoint} → ${b.destination}` : `${b.origin} → ${b.destination}`))).sort();

  function handleDownloadPdf() {
    const targetBookings = routeFilter ? bookings : allBookings;
    if (targetBookings.length === 0) return;

    const rows = targetBookings.map(b => {
      const routeStr = b.pickupPoint ? `${b.origin} \u2192 ${b.pickupPoint} \u2192 ${b.destination}` : `${b.origin} \u2192 ${b.destination}`;
      const pax = b.passengerDetails.map(p => p.name).join(', ');
      const seats = b.seatNumbers.join(', ');
      const agy = b.agency?.name || '-';
      const date = new Date(b.travelDate).toLocaleDateString();
      return `
      <tr>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(b.referenceCode)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(routeStr)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(date)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(b.travelTime)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(pax)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(seats)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0">${esc(agy)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Pickup Bookings Report</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #fff; color: #333; }
  h1 { color: #0854AE; border-bottom: 3px solid #0854AE; padding-bottom: 10px; font-size: 24px; }
  .meta { margin-bottom: 20px; color: #64748b; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #0854AE; color: #fff; padding: 12px; text-align: left; }
  td { padding: 10px 12px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
</style></head>
<body>
  <h1>Pickup Bookings Report</h1>
  <div class="meta"><strong>Route:</strong> ${esc(routeFilter || 'All routes')} | <strong>Total:</strong> ${targetBookings.length} | <strong>Generated:</strong> ${esc(new Date().toLocaleString())}</div>
  <table><thead><tr><th>Reference</th><th>Route</th><th>Date</th><th>Time</th><th>Passengers</th><th>Seats</th><th>Agency</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="footer">Katisha Transport — Pickup Agent Report</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pickup-bookings-${routeFilter ? routeFilter.replace(/\s→\s/g, '-') : 'all'}-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Pickup Bookings</h1>
          <p className="text-sm text-[var(--text-sub)] mt-1">Confirmed bookings with tickets, within the next 2 hours</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <select value={routeFilter} onChange={(e) => handleRouteFilter(e.target.value)}
              className="h-10 pl-9 pr-8 rounded-md border border-[var(--border)] text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400/40 focus:border-zinc-400"
            >
              <option value="">All routes</option>
              {uniqueRoutes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
          <button onClick={handleDownloadPdf} disabled={allBookings.length === 0}
            className="h-10 px-4 rounded-md bg-[var(--blue)] text-white text-sm font-medium flex items-center gap-2 hover:bg-[var(--blue-dark)] disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed border-none"
          >
            <Download size={14} /> Download HTML
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 size={24} className="animate-spin text-[var(--blue)]" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-md border border-[var(--border)]">
          <MapPin size={40} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-sm font-medium text-[var(--text-sub)]">No upcoming pickup bookings</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Confirmed bookings with tickets within the next 2 hours will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-md border border-[var(--border)] overflow-hidden hover:border-[var(--border)] transition-all">
              <div className="px-5 py-3 bg-[#F9FAFB] border-b border-[var(--border)] flex justify-between items-center">
                <span className="text-xs font-bold text-[var(--blue)] tracking-wide">{booking.referenceCode}</span>
                <span className="text-xs text-[var(--text-sub)]">{booking.agency?.name || '-'}</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <MapPin size={14} className="text-[var(--blue)] shrink-0" />
                  {booking.pickupPoint ? `${booking.origin} → ${booking.pickupPoint}` : booking.origin} → {booking.destination}
                </div>
                <div className="text-sm text-[var(--text-sub)]">
                  {new Date(booking.travelDate).toLocaleDateString()} at {booking.travelTime}
                </div>
                <div className="text-sm text-zinc-700">
                  <span className="font-medium">Passengers:</span> {booking.passengerDetails.map(p => p.name).join(', ')}
                </div>
                <div className="text-sm text-zinc-700">
                  <span className="font-medium">Seats:</span> {booking.seatNumbers.join(', ')}
                </div>
                {booking.ticketImage && (
                  <div className="mt-2">
                    <img src={resolveImageUrl(booking.ticketImage)} alt="Ticket"
                      className="max-w-full max-h-[120px] rounded-md object-contain border border-[var(--border)]"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
    </div>
  );
}
