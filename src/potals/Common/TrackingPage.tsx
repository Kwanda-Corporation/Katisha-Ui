import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Bus, MapPin, Navigation, Clock, Users, Route as RouteIcon,
  CheckCircle, XCircle, AlertTriangle, PlayCircle, RefreshCw,
   Activity, Layers, Search, Shield, Gauge, Wifi, WifiOff,
  ArrowRight, Circle, X, Map as MapIcon, List, Fuel, Thermometer,
  Maximize2, Minimize2,
  ArrowUpRight, Radio, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/ui/StatCard';
import { viaLabel } from '../../utils/via';

mapboxgl.accessToken = import.meta.env?.VITE_MAPBOX_TOKEN ?? 'pk.eyJ1IjoiYWxwZS0wMSIsImEiOiJjbWU1eXJsMG0wYjJ0MmxyMXozdGh2ZDQ4In0.zMIyCFmNk8F8JhGx4G9jSA';

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRole = 'system_admin' | 'nesa_admin' | 'atpr_officer' | 'agency_admin' | 'driver';

interface User {
  id: string; name: string; email: string;
  role: UserRole; organization?: string;
}

interface Journey {
  id: string; journeyCode: string; type: 'bulk' | 'single';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  routeId?: string; route?: Route; bookingId?: string;
  busId?: string; bus?: Bus; driverId?: string; driver?: Driver;
  departureTime?: string; arrivalTime?: string;
  scheduledDeparture: string; scheduledArrival?: string;
  progress: number; passengersCount: number;
  currentLocation?: { lat: number; lng: number };
  locationHistory?: Array<{ lat: number; lng: number; timestamp: string }>;
  fromCoords?: { lat: number; lng: number };
  destinationCoords?: { lat: number; lng: number };
  currentSpeed?: number; currentHeading?: number; lastUpdate?: string;
  busMetrics?: { temperature?: number; battery?: number; fuelLevel?: number; connectivity?: boolean };
  createdAt: string;
}

interface Route {
  id: string; code: string; name: string;
  origin: string; destination: string;
  via?: string;
  direction: 'returning_home';
  date: string; scheduledDeparture?: string; estimatedArrival?: string;
  delayMinutes: number; status: string; agencyId?: string;
  agency?: { id: string; name: string };
  studentsCount: number; distance?: string; estimatedTravelTime?: string;
  createdAt: string;
}

interface Bus { id: string; plateNumber: string; capacity: number; model?: string; make?: string; year?: number; }
interface Driver { id: string; name: string; phone?: string; licenseNumber?: string; }

const SYSTEM_ROLES: UserRole[] = ['system_admin', 'nesa_admin', 'atpr_officer'];
const isSystemRole = (role: UserRole) => SYSTEM_ROLES.includes(role);

// ── Status config ─────────────────────────────────────────────────────────────
// Each entry pairs an `ink` with a `fill` rather than a translucent rgba, so
// the badge follows the scheme instead of keeping a light-mode wash.
const STATUS_CONFIG = {
  pending:     { color: 'var(--tone-warning-ink)',  bg: 'var(--tone-warning-fill)',  label: 'Pending',     icon: Clock,         dot: 'var(--tone-warning-dot)' },
  in_progress: { color: 'var(--tone-info-ink)',     bg: 'var(--tone-info-fill)',     label: 'Live',        icon: PlayCircle,    dot: 'var(--tone-info-dot)' },
  completed:   { color: 'var(--tone-success-ink)',  bg: 'var(--tone-success-fill)',  label: 'Completed',   icon: CheckCircle,   dot: 'var(--tone-success-dot)' },
  cancelled:   { color: 'var(--tone-danger-ink)',   bg: 'var(--tone-danger-fill)',   label: 'Cancelled',   icon: XCircle,       dot: 'var(--tone-danger-dot)' },
  delayed:     { color: 'var(--tone-accent-ink)',   bg: 'var(--tone-accent-fill)',   label: 'Delayed',     icon: AlertTriangle, dot: 'var(--tone-accent-dot)' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function fmtShort(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? { color: 'var(--tone-neutral-ink)', bg: 'var(--tone-neutral-fill)', label: status, icon: Circle, dot: 'var(--tone-neutral-dot)' };
  const Icon = cfg.icon;
  const pad = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2.5 py-1';
  const fs  = size === 'xs' ? 'text-[10px]' : 'text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 ${pad} rounded-full ${fs} font-semibold whitespace-nowrap font-[var(--font-body)]`}
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={size === 'xs' ? 9 : 10} /> {cfg.label}
    </span>
  );
}

// ── Pulse dot ─────────────────────────────────────────────────────────────────
function LiveDot({ color = 'var(--blue)' }: { color?: string }) {
  return (
    <span className="relative inline-flex w-2 h-2 flex-shrink-0">
      <span className="absolute inset-0 rounded-full" style={{ background: color, opacity: 0.4, animation: 'liveRing 1.8s ease-out infinite' }} />
      <span className="w-2 h-2 rounded-full block" style={{ background: color }} />
    </span>
  );
}

// ── Journey List Item ─────────────────────────────────────────────────────────
function JourneyItem({ journey, selected, onClick }: { journey: Journey; selected: boolean; onClick: () => void }) {
  const isLive = journey.status === 'in_progress';
  const cfg = STATUS_CONFIG[journey.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-md cursor-pointer mb-1.5 transition-all block font-[var(--font-body)]"
      style={{
        border: `1.5px solid ${selected ? 'var(--blue)' : 'var(--border)'}`,
        background: selected ? 'var(--studio-accent-soft)' : 'var(--studio-surface)',
        boxShadow: selected ? '0 0 0 3px rgba(8, 84, 174,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {isLive && <LiveDot />}
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: 'var(--studio-accent)', background: 'var(--studio-accent-soft)' }}>
            {journey.journeyCode}
          </span>
          <span className="text-[10px] font-semibold text-[var(--studio-text-muted)] bg-[var(--fill-subtle)] px-1.5 py-0.5 rounded uppercase tracking-[0.04em]">
            {journey.type}
          </span>
        </div>
        <StatusBadge status={journey.status} size="xs" />
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <MapPin size={10} color="var(--text-muted)" />
        <span className="text-xs font-semibold text-[var(--studio-text)]">{journey.route?.origin ?? '—'}</span>
        <ArrowRight size={10} style={{ color: cfg.color }} />
        <span className="text-xs font-semibold text-[var(--studio-text)]">{journey.route?.destination ?? '—'}</span>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[11px] text-[var(--studio-text-sub)] flex items-center gap-1"><Users size={10} />{journey.passengersCount} pax</span>
        {journey.bus && <span className="text-[11px] text-[var(--studio-text-sub)] flex items-center gap-1"><Bus size={10} />{journey.bus.plateNumber}</span>}
        {journey.currentSpeed != null && <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--studio-accent)' }}><Gauge size={10} />{journey.currentSpeed} km/h</span>}
        {journey.lastUpdate && <span className="text-[10px] text-[var(--studio-text-muted)] ml-auto">{fmtShort(journey.lastUpdate)}</span>}
      </div>

      {isLive && (
        <div className="mt-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${journey.progress}%` }}
              className="h-full rounded-full" style={{ background: `linear-gradient(90deg, var(--studio-accent), var(--tone-success-dot))` }} />
          </div>
          <span className="text-[10px] text-[var(--studio-text-muted)] block mt-0.5 font-[var(--font-body)]">{journey.progress}% complete</span>
        </div>
      )}
    </motion.button>
  );
}

// ── Route Item ────────────────────────────────────────────────────────────────
function RouteItem({ route, selected, onClick }: { route: Route; selected: boolean; onClick: () => void }) {
  const STATUS_COLORS: Record<string, string> = { active: 'var(--tone-info-dot)', planned: 'var(--tone-info-dot)', completed: 'var(--tone-success-dot)', delayed: 'var(--tone-accent-dot)', cancelled: 'var(--tone-danger-dot)' };
  const color = STATUS_COLORS[route.status] ?? 'var(--tone-neutral-dot)';
  return (
    <motion.button
      layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-md cursor-pointer mb-1.5 transition-all block font-[var(--font-body)]"
      style={{
        border: `1.5px solid ${selected ? 'var(--info)' : 'var(--border)'}`,
        background: selected ? 'var(--studio-accent-soft)' : 'var(--studio-surface)',
        boxShadow: selected ? '0 0 0 3px rgba(8, 84, 174,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      whileHover={{ scale: 1.005 }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded" style={{ color: 'var(--studio-accent)', background: 'var(--studio-accent-soft)' }}>{route.code}</span>
          <span className="text-[10px] text-[var(--studio-text-muted)] bg-[var(--fill-subtle)] px-1.5 py-0.5 rounded">← Home</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color, background: `${color}12` }}>{route.status}</span>
      </div>
      <p className="text-[13px] font-bold text-[var(--studio-text)] m-0 mb-1.5">{route.name}</p>
      <div className="flex items-center gap-1.5 mb-1.5">
        <MapPin size={10} color="var(--text-muted)" />
        <span className="text-xs text-[var(--studio-text)] font-medium">{route.origin}</span>
        <ArrowRight size={10} color="var(--info)" />
        <span className="text-xs text-[var(--studio-text)] font-medium">{route.destination}</span>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        {route.agency && <span className="text-[11px] text-[var(--studio-text-sub)] flex items-center gap-1"><Shield size={10} />{route.agency.name}</span>}
        <span className="text-[11px] text-[var(--studio-text-sub)] flex items-center gap-1"><Users size={10} />{route.studentsCount}</span>
        {route.distance && <span className="text-[11px] text-[var(--studio-text-sub)] flex items-center gap-1"><RouteIcon size={10} />{route.distance}</span>}
        {route.scheduledDeparture && <span className="text-[11px] text-[var(--studio-text-sub)] flex items-center gap-1"><Clock size={10} />{route.scheduledDeparture}</span>}
      </div>
    </motion.button>
  );
}

// ── Journey Detail Drawer ─────────────────────────────────────────────────────
function JourneyDetail({ journey, onClose, fullscreen }: { journey: Journey; onClose: () => void; fullscreen: boolean }) {
  const metrics = journey.busMetrics;
  const wrapClass = fullscreen
    ? "absolute bottom-4 left-4 w-[340px] z-30 rounded-md overflow-hidden border border-[var(--studio-border)] bg-white"
    : "bg-white rounded-md border border-[var(--studio-border)] overflow-hidden";

  return (
    <motion.div
      initial={{ opacity: 0, y: fullscreen ? 20 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: fullscreen ? 20 : 12 }}
      className={wrapClass}
      style={{ boxShadow: fullscreen ? '0 16px 48px rgba(0,0,0,0.18)' : '0 4px 20px rgba(0,0,0,0.07)' }}
    >
      <div className="px-4 py-3.5 border-b border-[var(--studio-border)] flex items-center justify-between" style={{ background: 'var(--studio-accent-soft)' }}>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            {journey.status === 'in_progress' && <LiveDot />}
            <span className="font-mono text-xs font-bold" style={{ color: 'var(--studio-accent)' }}>{journey.journeyCode}</span>
            <StatusBadge status={journey.status} size="xs" />
          </div>
          <p className="text-xs text-[var(--studio-text-sub)] font-[var(--font-body)] m-0">{journey.route ? `${journey.route.origin} → ${journey.route.destination}${viaLabel(journey.route.via)}` : 'No route'}</p>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-md border border-[var(--studio-border)] bg-white cursor-pointer flex items-center justify-center flex-shrink-0">
          <X size={12} color="var(--text-sub)" />
        </button>
      </div>

      <div className="p-3.5 flex flex-col gap-3 font-[var(--font-body)]" style={fullscreen ? { maxHeight: 480, overflowY: 'auto' } : {}}>
        {journey.status === 'in_progress' && (
          <div className="bg-[var(--fill-subtle)] rounded-md p-2.5">
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[var(--studio-text-sub)]">Journey Progress</span>
              <span className="text-xs font-extrabold" style={{ color: 'var(--studio-accent)' }}>{journey.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${journey.progress}%` }}
                className="h-full rounded-full" style={{ background: `linear-gradient(90deg, var(--studio-accent), var(--tone-success-dot))` }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Vehicle', content: journey.bus ? (<><p className="text-[13px] font-bold text-[var(--studio-text)] m-0">{journey.bus.plateNumber}</p><p className="text-[11px] text-[var(--studio-text-sub)] m-0.5">{journey.bus.make} {journey.bus.model}</p><p className="text-[10px] text-[var(--studio-text-muted)] m-0">Cap: {journey.bus.capacity}</p></>) : <p className="text-xs text-[var(--studio-text-muted)] m-0">Not assigned</p> },
            { label: 'Driver',  content: journey.driver ? (<><p className="text-[13px] font-bold text-[var(--studio-text)] m-0">{journey.driver.name}</p>{journey.driver.phone && <p className="text-[11px] text-[var(--studio-text-sub)] m-0.5">{journey.driver.phone}</p>}</>) : <p className="text-xs text-[var(--studio-text-muted)] m-0">Not assigned</p> },
          ].map(({ label, content }) => (
            <div key={label} className="bg-[var(--fill-subtle)] rounded-md p-2.5">
              <p className="text-[10px] font-bold text-[var(--studio-text-muted)] uppercase tracking-[0.06em] m-0 mb-1">{label}</p>
              {content}
            </div>
          ))}
        </div>

        <div className="rounded-md p-2.5 flex items-center justify-between" style={{ background: 'var(--studio-accent-soft)' }}>
          <div className="flex items-center gap-1.5"><Users size={14} style={{ color: 'var(--studio-accent)' }} /><span className="text-[13px] font-semibold text-[var(--studio-text)]">Passengers on board</span></div>
          <span className="text-xl font-extrabold" style={{ color: 'var(--studio-accent)' }}>{journey.passengersCount}</span>
        </div>

        <div className="bg-[var(--fill-subtle)] rounded-md p-2.5">
          <p className="text-[10px] font-bold text-[var(--studio-text-muted)] uppercase tracking-[0.06em] m-0 mb-2">Timing</p>
          <div className="flex flex-col gap-1">
            {[
              { label: 'Scheduled Departure', value: journey.scheduledDeparture },
              { label: 'Actual Departure',    value: journey.departureTime },
              { label: 'Est. Arrival',        value: journey.scheduledArrival },
              { label: 'Actual Arrival',      value: journey.arrivalTime },
            ].map(({ label, value }) => value && (
              <div key={label} className="flex justify-between">
                <span className="text-[11px] text-[var(--studio-text-sub)]">{label}</span>
                <span className="text-xs font-semibold text-[var(--studio-text)]">{fmtTime(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {(journey.currentSpeed != null || metrics) && (
          <div>
            <p className="text-[10px] font-bold text-[var(--studio-text-muted)] uppercase tracking-[0.06em] m-0 mb-2">Live Telemetry</p>
            <div className="grid grid-cols-2 gap-1.5">
              {journey.currentSpeed != null && (
                <div className="bg-[var(--fill-subtle)] rounded-md p-2 flex items-center gap-1.5">
                  <Gauge size={13} style={{ color: 'var(--studio-accent)' }} />
                  <div><p className="text-[15px] font-bold text-[var(--studio-text)] m-0">{journey.currentSpeed}</p><p className="text-[10px] text-[var(--studio-text-sub)] m-0">km/h</p></div>
                </div>
              )}
              {metrics?.fuelLevel != null && (
                <div className="bg-[var(--fill-subtle)] rounded-md p-2 flex items-center gap-1.5">
                  <Fuel size={13} style={{ color: 'var(--tone-warning-dot)' }} />
                  <div><p className="text-[15px] font-bold text-[var(--studio-text)] m-0">{metrics.fuelLevel}%</p><p className="text-[10px] text-[var(--studio-text-sub)] m-0">Fuel</p></div>
                </div>
              )}
              {metrics?.temperature != null && (
                <div className="bg-[var(--fill-subtle)] rounded-md p-2 flex items-center gap-1.5">
                  <Thermometer size={13} style={{ color: 'var(--tone-danger-dot)' }} />
                  <div><p className="text-[15px] font-bold text-[var(--studio-text)] m-0">{metrics.temperature}°C</p><p className="text-[10px] text-[var(--studio-text-sub)] m-0">Temp</p></div>
                </div>
              )}
              {metrics?.connectivity != null && (
                <div className="bg-[var(--fill-subtle)] rounded-md p-2 flex items-center gap-1.5">
                  {metrics.connectivity ? <Wifi size={13} style={{ color: 'var(--studio-accent)' }} /> : <WifiOff size={13} style={{ color: 'var(--tone-danger-dot)' }} />}
                  <div><p className="text-xs font-bold text-[var(--studio-text)] m-0">{metrics.connectivity ? 'Online' : 'Offline'}</p><p className="text-[10px] text-[var(--studio-text-sub)] m-0">Signal</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {journey.currentLocation && (
          <div className="bg-[var(--fill-subtle)] rounded-md p-2 flex items-center gap-1.5">
            <MapPin size={12} style={{ color: 'var(--studio-accent)' }} />
            <span className="text-[11px] text-[var(--studio-text-sub)] font-mono">
              {journey.currentLocation.lat.toFixed(5)}, {journey.currentLocation.lng.toFixed(5)}
            </span>
            {journey.lastUpdate && <span className="ml-auto text-[10px] text-[var(--studio-text-muted)]">{fmtShort(journey.lastUpdate)}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Floating map controls (fullscreen) ────────────────────────────────────────
function MapControls({ onExit, liveCount, onToggleList, listVisible }: {
  onExit: () => void; liveCount: number; onToggleList: () => void; listVisible: boolean;
}) {
  return (
    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
      <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-[var(--studio-border)]" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
        <LiveDot />
        <span className="text-xs font-bold text-[var(--studio-text)]">{liveCount} live</span>
        <div className="w-px h-3" style={{ background: 'var(--border)' }} />
        <Radio size={12} style={{ color: 'var(--studio-accent)' }} />
        <span className="text-[11px] text-[var(--studio-text-sub)]">Real-time</span>
      </div>

      <div className="flex gap-1.5">
        <button onClick={onToggleList}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border cursor-pointer text-xs font-semibold font-[var(--font-body)]"
          style={{
            background: listVisible ? 'var(--studio-accent)' : 'var(--studio-surface)',
            borderColor: listVisible ? 'var(--blue)' : 'var(--border)',
            color: listVisible ? 'white' : 'var(--studio-text)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          }}>
          {listVisible ? <EyeOff size={13} /> : <Eye size={13} />}
          {listVisible ? 'Hide' : 'Show'} panel
        </button>
        <button onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[var(--studio-border)] bg-white cursor-pointer text-xs font-semibold text-[var(--studio-text)] font-[var(--font-body)]"
          style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <Minimize2 size={13} />Exit fullscreen
        </button>
      </div>
    </div>
  );
}

// ── Mapbox Component ──────────────────────────────────────────────────────────
function TrackingMap({ journeys, selectedJourneyId, onSelectJourney, fullscreen }: {
  journeys: Journey[]; selectedJourneyId: string | null;
  onSelectJourney: (id: string) => void; fullscreen: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const markersRef   = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [30.0588, -1.9441],
      zoom: 10,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    journeys.forEach(journey => {
      if (!journey.currentLocation) return;
      const { lat, lng } = journey.currentLocation;
      const isSelected = journey.id === selectedJourneyId;
      const isLive     = journey.status === 'in_progress';
      const markerColor = isLive ? 'var(--tone-info-dot)' : 'var(--tone-neutral-dot)';

      const el = document.createElement('div');
      el.style.cssText = `
        width: ${isSelected ? 44 : 36}px; height: ${isSelected ? 44 : 36}px;
        border-radius: 50%; background: ${markerColor}; border: 3px solid var(--studio-surface);
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        transition: all 0.2s; position: relative;
      `;
      el.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;

      if (isLive) {
        const pulse = document.createElement('div');
        // Appending an alpha suffix to a `var()` reference would be invalid CSS,
        // so the translucent live colour comes from a token instead.
        pulse.style.cssText = `position:absolute;inset:-7px;border-radius:50%;background:var(--tone-info-fill);animation:mapPulse 2s ease-out infinite;`;
        el.appendChild(pulse);
      }
      el.addEventListener('click', () => onSelectJourney(journey.id));

      // Mapbox renders this outside the React tree, but it is still a DOM
      // descendant of `.studio-shell`, so the theme tokens resolve here too.
      const popup = new mapboxgl.Popup({ offset: 28, closeButton: false, maxWidth: '220px' }).setHTML(`
        <div style="font-family: system-ui; padding: 4px 2px;">
          <div style="font-size:10px;font-weight:700;color:var(--tone-info-ink);margin-bottom:3px;font-family:monospace">${journey.journeyCode}</div>
          <div style="font-size:12px;font-weight:600;color:var(--studio-text)">${journey.bus?.plateNumber ?? 'No bus assigned'}</div>
          <div style="font-size:11px;color:var(--studio-text-muted);margin-top:2px">${journey.passengersCount} pax · ${journey.status.replace('_', ' ')}</div>
          ${journey.currentSpeed != null ? `<div style="font-size:11px;color:var(--tone-info-ink);margin-top:2px">${journey.currentSpeed} km/h</div>` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).setPopup(popup).addTo(map);
      markersRef.current.set(journey.id, marker);
    });
  }, [journeys, selectedJourneyId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedJourneyId) return;
    const j = journeys.find(j => j.id === selectedJourneyId);
    if (j?.currentLocation) {
      map.flyTo({ center: [j.currentLocation.lng, j.currentLocation.lat], zoom: 14, duration: 1100, essential: true });
    }
  }, [selectedJourneyId, journeys]);

  useEffect(() => {
    setTimeout(() => mapRef.current?.resize(), 120);
  }, [fullscreen]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <style>{`
        @keyframes mapPulse { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.4);opacity:0} }
        .mapboxgl-popup-content { border-radius: 10px; padding: 11px 14px; border: 1px solid var(--tone-neutral-line); }
        .mapboxgl-popup-tip { border-top-color: white !important; }
      `}</style>
    </div>
  );
}

// ── Route Detail ──────────────────────────────────────────────────────────────
function RouteDetail({ route, journeys, onClose, onNavigateToJourney }: {
  route: Route; journeys: Journey[]; onClose: () => void;
  onNavigateToJourney: (id: string) => void;
}) {
  const linked = journeys.filter(j => j.routeId === route.id);
  const STATUS_COLORS: Record<string, string> = { active: 'var(--tone-info-dot)', planned: 'var(--tone-info-dot)', completed: 'var(--tone-success-dot)', delayed: 'var(--tone-accent-dot)', cancelled: 'var(--tone-danger-dot)' };
  const color = STATUS_COLORS[route.status] ?? 'var(--tone-neutral-dot)';

  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
      className="bg-white rounded-md border border-[var(--studio-border)] overflow-hidden font-[var(--font-body)]" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>

      <div className="px-4 py-4 border-b border-[var(--studio-border)] flex justify-between items-start" style={{ background: 'var(--studio-accent-soft)' }}>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ color: 'var(--studio-accent)', background: 'var(--studio-accent-soft)' }}>{route.code}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color, background: `${color}12` }}>{route.status}</span>
          </div>
          <p className="text-[15px] font-bold text-[var(--studio-text)] m-0 mb-1">{route.name}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--studio-text)]">{route.origin}</span>
            <ArrowRight size={11} color="var(--info)" />
            <span className="text-xs text-[var(--studio-text)]">{route.destination}</span>
          </div>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-md border border-[var(--studio-border)] bg-white cursor-pointer flex items-center justify-center flex-shrink-0">
          <X size={12} color="var(--text-sub)" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3.5">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Students', value: route.studentsCount, Icon: Users },
            { label: 'Distance', value: route.distance ?? '—', Icon: RouteIcon },
            { label: 'Est. Time', value: route.estimatedTravelTime ?? '—', Icon: Clock },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="bg-[var(--fill-subtle)] rounded-md p-2.5 text-center">
              <Icon size={15} style={{ color: 'var(--info)', display: 'block', margin: '0 auto 5px' }} />
              <p className="text-[15px] font-bold text-[var(--studio-text)] m-0">{value}</p>
              <p className="text-[11px] text-[var(--studio-text-sub)] m-0">{label}</p>
            </div>
          ))}
        </div>

        {(route.scheduledDeparture || route.estimatedArrival) && (
          <div className="bg-[var(--fill-subtle)] rounded-md p-2.5">
            <p className="text-[10px] font-bold text-[var(--studio-text-muted)] uppercase tracking-[0.06em] m-0 mb-2">Schedule</p>
            <div className="flex justify-between">
              {route.scheduledDeparture && <div><p className="text-[11px] text-[var(--studio-text-sub)] m-0">Departure</p><p className="text-sm font-bold text-[var(--studio-text)] m-0.5">{route.scheduledDeparture}</p></div>}
              {route.estimatedArrival && <div className="text-right"><p className="text-[11px] text-[var(--studio-text-sub)] m-0">Est. Arrival</p><p className="text-sm font-bold text-[var(--studio-text)] m-0.5">{route.estimatedArrival}</p></div>}
            </div>
            {route.delayMinutes > 0 && (
              <div className="mt-2 px-2 py-1 rounded-md flex items-center gap-1.5" style={{ background: 'var(--tone-warning-fill)' }}>
                <AlertTriangle size={11} style={{ color: 'var(--tone-warning-ink)' }} />
                <span className="text-[11px] font-semibold" style={{ color: 'var(--tone-warning-ink)' }}>Delayed by {route.delayMinutes} min</span>
              </div>
            )}
          </div>
        )}

        {route.agency && (
          <div className="rounded-md p-2.5 flex items-center gap-2" style={{ background: 'var(--studio-accent-soft)' }}>
            <Shield size={13} color="var(--info)" />
            <div>
              <p className="text-[11px] text-[var(--studio-text-sub)] m-0">Transport Agency</p>
              <p className="text-[13px] font-semibold text-[var(--studio-text)] m-0.5">{route.agency.name}</p>
            </div>
          </div>
        )}

        {linked.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[var(--studio-text-muted)] uppercase tracking-[0.06em] m-0 mb-2">Journeys ({linked.length})</p>
            <div className="flex flex-col gap-1">
              {linked.slice(0, 5).map(j => (
                <button key={j.id}
                  onClick={() => onNavigateToJourney(j.id)}
                  className="flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer border border-[var(--studio-border)] font-[var(--font-body)] bg-[var(--fill-subtle)] hover:bg-[var(--studio-muted-fill)]/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--studio-accent)' }}>{j.journeyCode}</span>
                    <StatusBadge status={j.status} size="xs" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--studio-text-sub)]">{j.passengersCount} pax</span>
                    <ArrowUpRight size={11} color="var(--text-muted)" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Filter Chip ────────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-full border text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-all font-[var(--font-body)]`}
      style={{
        borderColor: active ? 'var(--blue)' : 'var(--border)',
        background: active ? 'var(--studio-accent-soft)' : 'var(--studio-surface)',
        color: active ? 'var(--blue)' : 'var(--text-sub)',
      }}>
      {label}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrackingPage() {
  const { authFetch } = useAuth();
  const user: User = {
    id: '1', name: 'Admin User', email: 'admin@example.com',
    role: 'system_admin', organization: 'agency-uuid-here',
  };

  const [activeTab, setActiveTab]         = useState<'journeys' | 'routes'>('journeys');
  const [viewMode, setViewMode]           = useState<'split' | 'map' | 'list'>('split');
  const [fullscreenMap, setFullscreenMap] = useState(false);
  const [panelVisible, setPanelVisible]   = useState(true);

  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [routes, setRoutes]     = useState<Route[]>([]);
  const [loading, setLoading]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isAdmin = isSystemRole(user.role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [jRes, rRes] = await Promise.all([
        authFetch('/tracking/journeys?limit=100'),
        authFetch('/routes?limit=100'),
      ]);
      const jData = jRes?.data?.data ?? jRes?.data ?? [];
      const rData = rRes?.data?.data ?? rRes?.data ?? [];
      setJourneys(Array.isArray(jData) ? jData : []);
      setRoutes(Array.isArray(rData) ? rData : []);
      setLastRefresh(new Date());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);
  useEffect(() => { const id = setInterval(() => void fetchData(), 30_000); return () => clearInterval(id); }, [fetchData]);

  const filteredJourneys = useMemo(() => {
    let list = journeys;
    if (!isAdmin && user.organization) list = list.filter(j => (j.route as any)?.agencyId === user.organization);
    if (statusFilter) list = list.filter(j => j.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j =>
        j.journeyCode.toLowerCase().includes(q) ||
        j.route?.origin?.toLowerCase().includes(q) ||
        j.route?.destination?.toLowerCase().includes(q) ||
        j.bus?.plateNumber?.toLowerCase().includes(q) ||
        j.driver?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [journeys, statusFilter, searchQuery, isAdmin, user.organization]);

  const filteredRoutes = useMemo(() => {
    let list = routes;
    if (!isAdmin && user.organization) list = list.filter(r => (r as any).agencyId === user.organization);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.origin.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    return list;
  }, [routes, searchQuery, isAdmin, user.organization]);

  const liveJourneys      = filteredJourneys.filter(j => j.status === 'in_progress');
  const selectedJourney   = journeys.find(j => j.id === selectedJourneyId) ?? null;
  const selectedRoute     = routes.find(r => r.id === selectedRouteId) ?? null;

  const stats = useMemo(() => ({
    live:      liveJourneys.length,
    pending:   filteredJourneys.filter(j => j.status === 'pending').length,
    completed: filteredJourneys.filter(j => j.status === 'completed').length,
    totalPax:  liveJourneys.reduce((s, j) => s + j.passengersCount, 0),
    routes:    filteredRoutes.length,
    active:    filteredRoutes.filter(r => r.status === 'active').length,
  }), [filteredJourneys, filteredRoutes, liveJourneys]);

  const STATUS_FILTERS = [
    { key: '',            label: 'All' },
    { key: 'in_progress', label: 'Live' },
    { key: 'pending',     label: 'Pending' },
    { key: 'completed',   label: 'Completed' },
    { key: 'delayed',     label: 'Delayed' },
    { key: 'cancelled',   label: 'Cancelled' },
  ];

  // ── Fullscreen Map Overlay ──────────────────────────────────────────────────
  if (fullscreenMap) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 z-[200]" style={{ background: '#1a1a2e' }}
      >
        <TrackingMap
          journeys={filteredJourneys}
          selectedJourneyId={selectedJourneyId}
          onSelectJourney={id => setSelectedJourneyId(id === selectedJourneyId ? null : id)}
          fullscreen
        />

        <MapControls
          onExit={() => setFullscreenMap(false)}
          liveCount={liveJourneys.length}
          onToggleList={() => setPanelVisible(v => !v)}
          listVisible={panelVisible}
        />

        <AnimatePresence>
          {panelVisible && (
            <motion.div
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute top-[100px] left-4 w-[300px] z-30 flex flex-col overflow-hidden rounded-md font-[var(--font-body)]"
              style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.25)', maxHeight: 'calc(100vh - 220px)' }}
            >
              <div className="bg-white rounded-t-md px-3.5 py-2.5 border-b border-[var(--studio-border)]">
                <div className="flex items-center gap-2 bg-[var(--fill-subtle)] rounded-md px-2.5 py-1.5">
                  <Search size={12} color="var(--text-muted)" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search journeys\u2026"
                    className="border-none bg-none text-xs text-[var(--studio-text)] outline-none font-[var(--font-body)] w-full"
                  />
                </div>
              </div>
              <div className="bg-white flex-1 overflow-y-auto px-2.5 py-2 rounded-b-md">
                {filteredJourneys.slice(0, 20).map(j => (
                  <JourneyItem key={j.id} journey={j} selected={selectedJourneyId === j.id}
                    onClick={() => setSelectedJourneyId(j.id === selectedJourneyId ? null : j.id)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedJourney && (
            <JourneyDetail key={selectedJourney.id} journey={selectedJourney}
              onClose={() => setSelectedJourneyId(null)} fullscreen />
          )}
        </AnimatePresence>

        <style>{`@keyframes liveRing{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.4);opacity:0}}`}</style>
      </motion.div>
    );
  }

  // ── Normal Layout ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-0 font-[var(--font-body)]">

      {/* ── Header ── */}
      <div className="mb-4">
        <div className="flex items-start justify-between flex-wrap gap-2.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--studio-accent-soft)' }}>
              <Navigation size={15} style={{ color: 'var(--studio-accent)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--studio-text)] m-0 font-[var(--font-body)]">{isAdmin ? 'Tracking' : 'Fleet'}</h2>
              <p className="text-xs text-[var(--studio-text-muted)] m-0">{isAdmin ? 'All agencies · Real-time monitoring' : 'Your agency · Live fleet'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--studio-text-muted)]">
              {liveJourneys.length > 0 && <LiveDot />}
              <span>{liveJourneys.length} live · {lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button onClick={() => void fetchData()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-[var(--studio-border)] bg-white text-[var(--studio-text-sub)] text-xs font-semibold cursor-pointer font-[var(--font-body)]">
              <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-2.5">
          <StatCard label="Live" value={stats.live} sub={`${stats.totalPax} passengers`} accent="var(--studio-accent)" icon={<Activity size={17} color="#fff" />} />
          <StatCard label="Pending" value={stats.pending} accent="var(--solid-warning)" icon={<Clock size={17} color="#fff" />} />
          <StatCard label="Completed Today" value={stats.completed} accent="var(--studio-accent)" icon={<CheckCircle size={17} color="#fff" />} />
          <StatCard label="Active Routes" value={stats.routes} sub={`${stats.active} active`} accent="var(--studio-accent)" icon={<RouteIcon size={17} color="#fff" />} />
          {isAdmin && <StatCard label="Agencies" value="All" accent="var(--tone-accent-dot)" icon={<Shield size={17} color="#fff" />} />}
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
        {/* Tabs */}
        <div className="flex bg-[var(--fill-subtle)] rounded-md p-0.5 border border-[var(--studio-border)]">
          {([['journeys', 'Journeys', Bus], ['routes', 'Routes', RouteIcon]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm border-none cursor-pointer text-[13px] font-semibold font-[var(--font-body)] transition-all`}
              style={{
                background: activeTab === id ? 'var(--studio-surface)' : 'transparent',
                color: activeTab === id ? 'var(--text)' : 'var(--text-sub)',
                boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[190px] flex items-center gap-1.5 bg-white border border-[var(--studio-border)] rounded-md px-3 py-1.5">
          <Search size={12} color="var(--text-muted)" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'journeys' ? 'Search journeys, plates, drivers\u2026' : 'Search routes\u2026'}
            className="border-none bg-none text-[13px] text-[var(--studio-text)] outline-none font-[var(--font-body)] w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="bg-none border-none cursor-pointer p-0 flex">
              <X size={11} color="var(--text-muted)" />
            </button>
          )}
        </div>

        {/* Status filters */}
        {activeTab === 'journeys' && (
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <FilterChip key={f.key} label={f.label} active={statusFilter === f.key} onClick={() => setStatusFilter(f.key)} />
            ))}
          </div>
        )}

        {/* View mode */}
        {activeTab === 'journeys' && (
          <div className="flex items-center gap-1">
            <div className="flex bg-[var(--fill-subtle)] rounded-md p-0.5 border border-[var(--studio-border)] gap-px">
              {([['split', Layers, 'Split'], ['map', MapIcon, 'Map'], ['list', List, 'List']] as const).map(([id, Icon, tip]) => (
                <button key={id} title={tip} onClick={() => setViewMode(id as any)}
                  className="w-7 h-7 rounded-sm border-none cursor-pointer flex items-center justify-center transition-all"
                  style={{
                    background: viewMode === id ? 'var(--studio-accent)' : 'transparent',
                    color: viewMode === id ? 'white' : 'var(--studio-text-sub)',
                  }}>
                  <Icon size={12} />
                </button>
              ))}
            </div>

            <button
              onClick={() => setFullscreenMap(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-[var(--studio-border)] bg-white text-[var(--studio-text-sub)] text-xs font-semibold cursor-pointer font-[var(--font-body)] transition-all hover:border-[var(--studio-accent)] hover:text-[var(--studio-accent)]"
            >
              <Maximize2 size={12} />Fullscreen
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── JOURNEYS TAB ── */}
          {activeTab === 'journeys' && (
            <motion.div key="journeys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex gap-3.5">

              {/* Left list */}
              {viewMode !== 'map' && (
                <div className={`flex flex-col overflow-hidden ${viewMode === 'list' ? 'w-full' : 'w-[320px]'} flex-shrink-0`}>
                  <div className="text-[11px] font-bold text-[var(--studio-text-muted)] uppercase tracking-[0.07em] mb-2 font-[var(--font-body)]">
                    {filteredJourneys.length} journey{filteredJourneys.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex-1 overflow-y-auto pr-1">
                    {filteredJourneys.length === 0
                      ? <div className="text-center py-12">
                          <Bus size={30} color="var(--tone-neutral-dot)" className="block mx-auto mb-2.5" />
                          <p className="text-[13px] text-[var(--studio-text-sub)] font-[var(--font-body)]">No journeys found</p>
                        </div>
                      : filteredJourneys.map(j => (
                          <JourneyItem key={j.id} journey={j} selected={selectedJourneyId === j.id}
                            onClick={() => setSelectedJourneyId(j.id === selectedJourneyId ? null : j.id)} />
                        ))
                    }
                  </div>
                </div>
              )}

              {/* Right: map + detail */}
              {viewMode !== 'list' && (
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="flex-1 min-h-[260px] rounded-md overflow-hidden border border-[var(--studio-border)] relative" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
                    <TrackingMap
                      journeys={filteredJourneys}
                      selectedJourneyId={selectedJourneyId}
                      onSelectJourney={id => setSelectedJourneyId(id === selectedJourneyId ? null : id)}
                      fullscreen={false}
                    />

                    <div className="absolute top-3 right-3 z-10">
                      <button
                        onClick={() => setFullscreenMap(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-[var(--studio-border)] text-[11px] font-semibold cursor-pointer font-[var(--font-body)]"
                        style={{ background: 'var(--studio-surface)', color: 'var(--studio-text)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <Maximize2 size={11} />Fullscreen map
                      </button>
                    </div>

                    {liveJourneys.length > 0 && (
                      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 border border-[var(--studio-border)]" style={{ background: 'var(--studio-surface)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <LiveDot />
                        <span className="text-[11px] font-bold text-[var(--studio-text)]">{liveJourneys.length} active</span>
                      </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {selectedJourney && (
                      <JourneyDetail key={selectedJourney.id} journey={selectedJourney}
                        onClose={() => setSelectedJourneyId(null)} fullscreen={false} />
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ROUTES TAB ── */}
          {activeTab === 'routes' && (
            <motion.div key="routes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex gap-3.5">

              <div className="w-[360px] flex-shrink-0 flex flex-col overflow-hidden">
                <div className="text-[11px] font-bold text-[var(--studio-text-muted)] uppercase tracking-[0.07em] mb-2 font-[var(--font-body)]">
                  {filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''}
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  {filteredRoutes.length === 0
                    ? <div className="text-center py-12">
                        <RouteIcon size={30} color="var(--tone-neutral-dot)" className="block mx-auto mb-2.5" />
                        <p className="text-[13px] text-[var(--studio-text-sub)] font-[var(--font-body)]">No routes found</p>
                      </div>
                    : filteredRoutes.map(r => (
                        <RouteItem key={r.id} route={r} selected={selectedRouteId === r.id}
                          onClick={() => setSelectedRouteId(r.id === selectedRouteId ? null : r.id)} />
                      ))
                  }
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {selectedRoute
                    ? <RouteDetail key={selectedRoute.id} route={selectedRoute} journeys={journeys}
                        onClose={() => setSelectedRouteId(null)}
                        onNavigateToJourney={id => { setActiveTab('journeys'); setSelectedJourneyId(id); }} />
                    : <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="h-full flex flex-col items-center justify-center rounded-md border-2 border-dashed" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                        <RouteIcon size={36} color="var(--tone-neutral-dot)" className="mb-2.5" />
                        <p className="text-sm font-semibold text-[var(--studio-text-sub)] m-0 mb-1 font-[var(--font-body)]">Select a route</p>
                        <p className="text-xs text-[var(--studio-text-muted)] m-0">Click any route on the left to view details</p>
                      </motion.div>
                  }
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes liveRing{ 0%{transform:scale(1);opacity:0.8} 100%{transform:scale(2.4);opacity:0} }
        ::-webkit-scrollbar       { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--tone-neutral-line); border-radius: 4px; }
      `}</style>
    </div>
  );
}
