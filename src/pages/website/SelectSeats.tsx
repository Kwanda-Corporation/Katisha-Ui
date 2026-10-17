import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { AlertCircle, ArrowLeft, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TopNav from '../../components/website/TopNav';
import SiteFooter from '../../components/website/SiteFooter';
import SEO from '../../components/seo/SEO';
import BusSeatMap from '../../components/seat/BusSeatMap';
import Legend from '../../components/seat/Legend';
import SummaryBar from '../../components/seat/SummaryBar';
import SeatMapSkeleton from '../../components/seat/SeatMapSkeleton';
import { useTripSeats } from '../../Hooks/useTripSeats';

const toDateStr = (value: string | Date | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};

/**
 * Standalone passenger seat-selection page. Reached from a trip link
 * (`/seats/:tripId`). Picks seats, places a short hold, then hands the trip +
 * seats to the booking wizard via query params so the checkout resolves the
 * exact same trip.
 */
export default function SelectSeats() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const seats = useTripSeats({ tripId: tripId || null });
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trip = seats.data?.trip;

  const heading = useMemo(() => {
    if (!trip) return 'Select your seats';
    return `${trip.route.origin} → ${trip.route.destination}`;
  }, [trip]);

  const handleContinue = async () => {
    if (!trip || !seats.selected.length) return;
    setReserving(true);
    setError(null);
    try {
      await seats.reserve();
      const params = new URLSearchParams({
        to: trip.route.destination,
        agency: trip.agency.id,
        date: toDateStr(trip.travelDate),
        time: trip.travelTime,
        seats: seats.selected.join(','),
      });
      if (searchParams.get('ref')) params.set('ref', searchParams.get('ref') as string);
      navigate(`/book?${params.toString()}`);
    } catch (err: any) {
      setError(err?.status === 409 ? 'Some seats were just taken. Please choose again.' : String(err?.message || 'Could not hold seats.'));
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SEO title="Select seats" description="Choose your seats on the 3D bus seat map." noindex />
      <TopNav />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link
          to="/book"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-sub)] hover:text-[var(--blue-dark)] mb-4 no-underline"
        >
          <ArrowLeft size={15} /> Back to search
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mb-1">{heading}</h1>
        {trip && (
          <p className="text-sm text-[var(--text-sub)] mb-6">
            {trip.agency.name} · {toDateStr(trip.travelDate)} · {trip.travelTime} · from{' '}
            {trip.currency} {trip.price.toLocaleString()}
            {trip.route.via ? ` · via ${trip.route.via}` : ''}
          </p>
        )}

        {seats.loading && !seats.data ? (
          <SeatMapSkeleton rows={7} />
        ) : seats.error || !tripId ? (
          <div className="flex items-start gap-2 text-sm text-[var(--tone-danger-ink)] bg-[var(--tone-danger-fill)] border border-[var(--tone-danger-line)] rounded-md px-3 py-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{seats.error || 'This trip could not be found.'}</span>
          </div>
        ) : (
          <>
            <BusSeatMap
              rows={seats.rows}
              selectedSet={seats.selectedSet}
              onToggleSeat={seats.toggleSeat}
              agencyName={trip?.agency.name}
              logo={trip?.agency.logo}
              ariaBusy={seats.loading}
            />
            <div className="mt-4">
              <Legend />
            </div>

            {seats.notice && (
              <div className="mt-3 flex items-center gap-2 text-[13px] text-[var(--tone-warning-ink)] bg-[var(--tone-warning-fill)] border border-[var(--tone-warning-line)] rounded-md px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{seats.notice}</span>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-center gap-2 text-[13px] text-[var(--tone-danger-ink)] bg-[var(--tone-danger-fill)] border border-[var(--tone-danger-line)] rounded-md px-3 py-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4">
              <SummaryBar
                selected={seats.selected}
                maxSeats={seats.maxSeats}
                price={trip?.price || 0}
                currency={trip?.currency || 'RWF'}
                summary={seats.data?.summary || { total: 0, available: 0, taken: 0, blocked: 0 }}
                onClear={seats.clearSelection}
                onRemoveSeat={seats.toggleSeat}
                action={
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={reserving || seats.selected.length === 0}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-[var(--blue)] text-white text-sm font-semibold hover:bg-[var(--blue-dark)] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                  >
                    {reserving ? <Loader size={15} className="animate-spin" /> : null}
                    {t('booking.continue') || 'Continue'}
                  </button>
                }
              />
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
