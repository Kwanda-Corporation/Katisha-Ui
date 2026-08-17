import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Building2, Route, Activity, AlertTriangle,
  CheckCircle, Bus,
  ShieldAlert, RefreshCw, Server, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PageHeader, StatCard, Button } from '../../components/ui';

interface SystemStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalAgencies: number;
  activeRoutes: number;
  activeJourneys: number;
  totalStudents: number;
  totalIncidents: number;
  criticalIncidents: number;
  systemUptime: number;
  totalBookings: number;
}

interface RecentIncident {
  id: string;
  incidentCode: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  district: string;
  reportedAt: string;
  studentsAffected: number;
}

interface AgencyPerf {
  id: string;
  name: string;
  status: string;
  rating: number;
  availableBuses: number;
  driversCount: number;
  completedTrips: number;
  isActive: boolean;
}

const SEVERITY_MAP: Record<string, { className: string; dotClass: string; label: string }> = {
  low:      { className: 'bg-[var(--blue-light)] text-[var(--blue-dark)]', dotClass: 'bg-zinc-1000', label: 'Low' },
  medium:   { className: 'bg-[#F9FAFB] text-[var(--text-sub)]', dotClass: 'bg-zinc-400', label: 'Medium' },
  high:     { className: 'bg-[#F9FAFB] text-[var(--text-sub)]', dotClass: 'bg-zinc-500', label: 'High' },
  critical: { className: 'bg-[#F9FAFB] text-[var(--text-sub)]', dotClass: 'bg-zinc-400', label: 'Critical' },
};

const STATUS_BADGE: Record<string, { className: string }> = {
  available:  { className: 'bg-[var(--blue-light)] text-[var(--blue-dark)]' },
  busy:       { className: 'bg-[var(--blue-light)] text-[var(--blue-dark)]' },
  offline:    { className: 'bg-[#F9FAFB] text-[var(--text-sub)]' },
  suspended:  { className: 'bg-[#F9FAFB] text-[var(--text-sub)]' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SystemHealth({ uptime }: { uptime: number }) {
  const services = [
    { name: 'API Server',   status: true,   latency: '12ms'  },
    { name: 'Database',     status: true,   latency: '4ms'   },
    { name: 'Redis Cache',  status: true,   latency: '1ms'   },
    { name: 'File Storage', status: uptime > 98, latency: '28ms' },
    { name: 'Email Service', status: uptime > 95, latency: '—'  },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-md border border-[var(--border)] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server size={15} className="text-[var(--text-muted)]" />
          <span className="text-sm font-semibold text-[var(--text)]">System Health</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-semibold text-[var(--blue)]">{uptime}% uptime</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {services.map((s) => (
          <div key={s.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${s.status ? 'bg-[var(--blue)]' : 'bg-zinc-400'}`} />
              <span className="text-xs text-[var(--text-sub)]">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] font-mono">{s.latency}</span>
              <span className={`text-xs font-semibold ${s.status ? 'text-[var(--blue)]' : 'text-[var(--text-sub)]'}`}>
                {s.status ? 'Online' : 'Degraded'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)]">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
          <span>Overall health</span>
          <span className="font-semibold text-[var(--text)]">{uptime}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--blue)]"
            initial={{ width: 0 }}
            animate={{ width: `${uptime}%` }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function IncidentsPanel({ incidents }: { incidents: RecentIncident[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white rounded-md border border-[var(--border)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} className="text-[var(--blue)]" />
          <span className="text-sm font-semibold text-[var(--text)]">Recent Incidents</span>
          {incidents.filter(i => i.severity === 'critical').length > 0 && (
            <span className="text-xs font-bold text-white bg-[var(--blue)] px-2 py-0.5 rounded-full">
              {incidents.filter(i => i.severity === 'critical').length} critical
            </span>
          )}
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-[var(--blue)] hover:underline">
          View all <ChevronRight size={12} />
        </button>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {incidents.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle size={28} className="mx-auto mb-2 text-[var(--blue)]" />
            <p className="text-sm text-[var(--text-muted)]">No recent incidents</p>
          </div>
        ) : (
          incidents.slice(0, 6).map((inc, i) => {
            const sev = SEVERITY_MAP[inc.severity] ?? SEVERITY_MAP.low;
            const isOpen = expanded === inc.id;
            return (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * i }}
                className="px-5 py-3 hover:bg-[var(--blue-light)] transition-colors cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : inc.id)}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sev.dotClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--text)] truncate">
                        {inc.title || inc.incidentCode}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sev.className}`}>
                          {sev.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[var(--text-sub)]">{inc.district}</span>
                      <span className="text-xs text-[var(--text-muted)]">·</span>
                      <span className="text-xs text-[var(--text-sub)]">{timeAgo(inc.reportedAt)}</span>
                      {inc.studentsAffected > 0 && (
                        <>
                          <span className="text-xs text-[var(--text-muted)]">·</span>
                          <span className="text-xs text-[var(--text-sub)]">
                            {inc.studentsAffected} student{inc.studentsAffected > 1 ? 's' : ''} affected
                          </span>
                        </>
                      )}
                    </div>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-3">
                            <span className="text-xs text-[var(--text-sub)]">
                              Code: <strong className="font-mono">{inc.incidentCode}</strong>
                            </span>
                            <span className="text-xs text-[var(--text-sub)]">
                              Status: <strong>{inc.status.replace(/_/g, ' ')}</strong>
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

interface BookingByAgency {
  agencyId: string;
  agencyName: string;
  count: number;
}

function BookingsByAgencyCard({ data }: { data: BookingByAgency[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-md border border-[var(--border)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-[var(--blue)]" />
          <span className="text-sm font-semibold text-[var(--text)]">Bookings per Agency</span>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">No booking data found</p>
        ) : (
          data.slice(0, 8).map(item => (
            <div key={item.agencyId} className="flex items-center gap-3">
              <span className="text-xs font-medium text-[var(--text)] truncate min-w-[120px] max-w-[160px]">
                {item.agencyName || 'Unknown Agency'}
              </span>
              <div className="flex-1 h-3 bg-[var(--border)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full bg-[var(--blue)]"
                />
              </div>
              <span className="text-xs font-semibold text-[var(--text)] tabular-nums min-w-[2rem] text-right">
                {item.count}
              </span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function AgencySummary({ agencies }: { agencies: AgencyPerf[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="bg-white rounded-md border border-[var(--border)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Bus size={15} className="text-[var(--blue)]" />
          <span className="text-sm font-semibold text-[var(--text)]">Agency Overview</span>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-[var(--blue)] hover:underline">
          Manage <ChevronRight size={12} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFB]">
              {['Agency', 'Status', 'Buses', 'Drivers', 'Rating', 'Trips'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-[var(--font-body)] text-xs font-semibold uppercase tracking-[0.5px] text-[#475569] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {agencies.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  <p className="text-sm text-[var(--text-muted)]">No agencies yet</p>
                </td>
              </tr>
            ) : (
              agencies.slice(0, 5).map((agency, i) => {
                const badge = STATUS_BADGE[agency.status] ?? STATUS_BADGE.offline;
                return (
                  <motion.tr
                    key={agency.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.06 * i }}
                    className="hover:bg-[var(--blue-light)] transition-colors border-t border-[var(--border)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${agency.isActive ? 'bg-[var(--blue)]' : 'bg-slate-300'}`} />
                        <span className="font-medium text-[var(--text)] truncate max-w-[140px]">{agency.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${badge.className}`}>
                        {agency.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-sub)] tabular-nums">{agency.availableBuses}</td>
                    <td className="px-4 py-3 text-[var(--text-sub)] tabular-nums">{agency.driversCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[var(--blue)] text-xs">★</span>
                        <span className="text-[var(--text)] font-medium tabular-nums">
                          {Number(agency.rating).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-sub)] tabular-nums">{agency.completedTrips}</td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function SystemAdminOverview() {
  const { authFetch } = useAuth();

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0, newUsersThisWeek: 0,
    totalAgencies: 0, activeRoutes: 0, activeJourneys: 0,
    totalStudents: 0, totalIncidents: 0, criticalIncidents: 0, systemUptime: 99.8,
    totalBookings: 0,
  });
  const [incidents, setIncidents] = useState<RecentIncident[]>([]);
  const [agencies, setAgencies] = useState<AgencyPerf[]>([]);
  const [bookingsByAgency, setBookingsByAgency] = useState<BookingByAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const apiFetch = async <T,>(path: string): Promise<T | null> => {
    const json = await authFetch(path);
    if (!json) return null;
    return json?.data ?? json ?? null;
  };

  const fetchAll = async () => {
    setLoading(true);
    const [usersRes, studentsRes, agenciesRes, incidentsRes, dashboardRes] =
      await Promise.all([
        apiFetch<any>('/users?limit=1'),
        apiFetch<any>('/students?limit=1'),
        apiFetch<any>('/agencies'),
        apiFetch<any>('/incidents?limit=10&severity=critical'),
        apiFetch<any>('/dashboard/admin'),
      ]);

    const dashboardStats = dashboardRes?.stats ?? dashboardRes;

    setStats(prev => ({
      ...prev,
      totalUsers:      usersRes?.pagination?.total                            ?? prev.totalUsers,
      totalStudents:   studentsRes?.pagination?.total                         ?? prev.totalStudents,
      totalAgencies:   dashboardStats?.totalAgencies ?? agenciesRes?.agencies?.length ?? prev.totalAgencies,
      activeRoutes:    dashboardStats?.totalRoutes                            ?? prev.activeRoutes,
      activeJourneys:  dashboardStats?.todayBookings                          ?? prev.activeJourneys,
      totalIncidents:  incidentsRes?.pagination?.total                        ?? prev.totalIncidents,
      totalBookings:   dashboardStats?.totalBookings                          ?? prev.totalBookings,
    }));

    if (dashboardRes?.bookingsByAgency) {
      setBookingsByAgency(dashboardRes.bookingsByAgency as BookingByAgency[]);
    } else {
      apiFetch<any>('/bookings/by-agency').then(r => {
        if (r?.bookingsByAgency) setBookingsByAgency(r.bookingsByAgency as BookingByAgency[]);
      }).catch(() => {});
    }
    if (incidentsRes?.data) setIncidents(incidentsRes.data as RecentIncident[]);
    if (agenciesRes?.agencies) {
      const mapped = (agenciesRes.agencies as any[]).map(a => ({
        id: a._id ?? a.id,
        name: a.name,
        status: a.status ?? 'active',
        rating: a.rating ?? 0,
        availableBuses: a.availableBuses ?? 0,
        driversCount: a.driversCount ?? 0,
        completedTrips: a.completedTrips ?? 0,
        isActive: a.isActive ?? a.status === 'active',
      }));
      setAgencies(mapped as AgencyPerf[]);
    } else if (Array.isArray(agenciesRes)) {
      const mapped = agenciesRes.map(a => ({
        id: a._id ?? a.id,
        name: a.name,
        status: a.status ?? 'active',
        rating: a.rating ?? 0,
        availableBuses: a.availableBuses ?? 0,
        driversCount: a.driversCount ?? 0,
        completedTrips: a.completedTrips ?? 0,
        isActive: a.isActive ?? a.status === 'active',
      }));
      setAgencies(mapped as AgencyPerf[]);
    }

    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const statCards = [
    { label: 'Total Users', value: loading ? '—' : stats.totalUsers.toLocaleString(), sub: `+${stats.newUsersThisWeek} this week`, icon: <Users size={18} />, trend: { value: '12%', positive: true } },
    { label: 'Agencies', value: loading ? '—' : stats.totalAgencies, sub: 'Transport operators', icon: <Building2 size={18} /> },
    { label: 'Active Routes', value: loading ? '—' : stats.activeRoutes, sub: 'Running today', icon: <Route size={18} /> },
    { label: 'Live Journeys', value: loading ? '—' : stats.activeJourneys, sub: 'In progress now', icon: <Bus size={18} /> },
    { label: 'Total Students', value: loading ? '—' : stats.totalStudents.toLocaleString(), sub: 'On transport', icon: <Users size={18} /> },
    {
      label: 'Incidents', value: loading ? '—' : stats.totalIncidents,
      sub: stats.criticalIncidents > 0 ? `${stats.criticalIncidents} critical` : 'All clear',
      icon: <AlertTriangle size={18} />,
      trend: stats.criticalIncidents > 0 ? { value: `${stats.criticalIncidents} critical`, positive: false } : undefined,
    },
    { label: 'Total Bookings', value: loading ? '—' : stats.totalBookings.toLocaleString(), sub: 'All time bookings', icon: <Activity size={18} /> },
    { label: 'System Uptime', value: `${stats.systemUptime}%`, sub: 'All services operational', icon: <Activity size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Overview"
        subtitle={`Last updated: ${lastRefresh.toLocaleTimeString()}`}
        actions={
          <Button variant="secondary" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <IncidentsPanel incidents={incidents} />
        </div>
        <div>
          <SystemHealth uptime={stats.systemUptime} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AgencySummary agencies={agencies} />
        <BookingsByAgencyCard data={bookingsByAgency} />
      </div>
    </div>
  );
}
