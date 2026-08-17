import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, DownloadCloud, RefreshCw, AlertCircle,
  FileSpreadsheet, CheckCircle2, Lock, Info,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// ── Constants ──────────────────────────────────────────────────────────────────
const GREEN = "#1D4ED8";
const BLUE  = "#1D4ED8";
const API_BASE = import.meta.env?.VITE_API_URL ?? "http://localhost:5001/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type ExportType = "bookings" | "journeys";

interface BookingExportParams {
  from: string;
  to: string;
  status: string;
  district: string;
}

interface JourneyExportParams {
  days: string;
  status: string;
  district: string;
  routeId: string;
  busPlate: string;
}

interface ExportModalProps {
  type: ExportType;
  open: boolean;
  onClose: () => void;
  defaultBookingParams?: Partial<BookingExportParams>;
  defaultJourneyParams?: Partial<JourneyExportParams>;
}

// ── Status options ─────────────────────────────────────────────────────────────

const BOOKING_STATUSES = [
  { value: "",           label: "All statuses" },
  { value: "confirmed",  label: "Confirmed"    },
  { value: "pending",    label: "Pending"      },
  { value: "cancelled",  label: "Cancelled"    },
  { value: "rejected",   label: "Rejected"     },
];

const JOURNEY_STATUSES = [
  { value: "",            label: "All statuses" },
  { value: "pending",     label: "Pending"      },
  { value: "in_progress", label: "In Progress"  },
  { value: "completed",   label: "Completed"    },
  { value: "cancelled",   label: "Cancelled"    },
  { value: "delayed",     label: "Delayed"      },
];

const DAY_PRESETS = [
  { value: "7",   label: "7d"   },
  { value: "14",  label: "14d"  },
  { value: "30",  label: "30d"  },
  { value: "60",  label: "60d"  },
  { value: "90",  label: "90d"  },
  { value: "180", label: "6mo"  },
];

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #e2e8f0",
  borderRadius: 7,
  fontSize: 13,
  color: "#0f172a",
  fontFamily: "inherit",
  background: "#fff",
  outline: "none",
  appearance: "none" as const,
  lineHeight: "1.4",
};

const labelCls: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  marginBottom: 5,
};

// ── Field ──────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelCls}>{label}</label>
      {children}
    </div>
  );
}

// ── Chip button ────────────────────────────────────────────────────────────────

function Chip({
  label, active, accent, onClick,
}: { label: string; active?: boolean; accent: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        border: `1px solid ${active ? accent : "#e2e8f0"}`,
        background: active ? `${accent}14` : "#f8fafc",
        color: active ? accent : "#64748b",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.12s",
        lineHeight: "1.5",
      }}
    >
      {label}
    </button>
  );
}

// ── Sheet preview row ──────────────────────────────────────────────────────────

function SheetRow({ icon, name, desc }: { icon: string; name: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
      <span style={{ fontSize: 13, width: 18, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#334155", flexShrink: 0 }}>{name}</span>
      <span style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        — {desc}
      </span>
    </div>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────

function Divider({ label, accent }: { label: string; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
      <FileSpreadsheet size={12} color={accent} />
      <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
    </div>
  );
}

// ── Booking export form ────────────────────────────────────────────────────────

function BookingForm({
  params, onChange, accent,
}: { params: BookingExportParams; onChange: (p: BookingExportParams) => void; accent: string }) {
  const set = (k: keyof BookingExportParams) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...params, [k]: e.target.value });

  const applyPreset = (days: number) => {
    const from = new Date();
    const to   = new Date();
    to.setDate(to.getDate() + days);
    onChange({ ...params, from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Date range */}
      <Field label="Travel Date Range">
        <div style={{ display: "flex", gap: 5, marginBottom: 7, flexWrap: "wrap" }}>
          {[7, 30, 90].map((d) => (
            <Chip key={d} label={`Next ${d}d`} accent={accent} onClick={() => applyPreset(d)} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, alignItems: "center" }}>
          <input type="date" value={params.from} onChange={set("from")} style={inputCls} />
          <span style={{ color: "#94a3b8", fontSize: 11 }}>to</span>
          <input type="date" value={params.to}   onChange={set("to")}   style={inputCls} />
        </div>
      </Field>

      {/* Status + District */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Status">
          <select value={params.status} onChange={set("status")} style={inputCls}>
            {BOOKING_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="District">
          <input
            type="text"
            value={params.district}
            onChange={set("district")}
            placeholder="e.g. Kigali"
            style={inputCls}
          />
        </Field>
      </div>

      {/* Sheet preview */}
      <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8, padding: "10px 12px" }}>
        <Divider label="7 sheets included" accent={accent} />
        {[
          { icon: "📊", name: "Summary Dashboard",      desc: "KPI counters & date range overview"    },
          { icon: "📋", name: "All Bookings",            desc: "Full detail for every booking"          },
          { icon: "👤", name: "Student Details",         desc: "One row per student across bookings"    },
          { icon: "🎫", name: "Route Booking Codes",     desc: "All issued route-level codes"           },
          { icon: "📍", name: "District Distribution",   desc: "Booking & student counts by district"   },
          { icon: "📅", name: "Travel Date Schedule",    desc: "Bookings sorted by travel date"         },
          { icon: "💳", name: "Payment Summary",         desc: "Per-booking payment breakdown"          },
        ].map((s) => <SheetRow key={s.name} {...s} />)}
      </div>
    </div>
  );
}

// ── Journey export form ────────────────────────────────────────────────────────

function JourneyForm({
  params, onChange, accent,
}: { params: JourneyExportParams; onChange: (p: JourneyExportParams) => void; accent: string }) {
  const set = (k: keyof JourneyExportParams) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...params, [k]: e.target.value });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Period chips */}
      <Field label="Period">
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {DAY_PRESETS.map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              active={params.days === p.value}
              accent={accent}
              onClick={() => onChange({ ...params, days: p.value })}
            />
          ))}
        </div>
      </Field>

      {/* Filters grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Status">
          <select value={params.status} onChange={set("status")} style={inputCls}>
            {JOURNEY_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="District">
          <input type="text" value={params.district} onChange={set("district")} placeholder="e.g. Kigali" style={inputCls} />
        </Field>
        <Field label="Bus Plate">
          <input type="text" value={params.busPlate} onChange={set("busPlate")} placeholder="e.g. RAB 123A" style={inputCls} />
        </Field>
        <Field label="Route ID">
          <input type="text" value={params.routeId}  onChange={set("routeId")}  placeholder="Route UUID" style={inputCls} />
        </Field>
      </div>

      {/* Sheet preview */}
      <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8, padding: "10px 12px" }}>
        <Divider label="6 sheets included" accent={accent} />
        {[
          { icon: "📊", name: "Summary Dashboard",    desc: "KPI counters & period overview"            },
          { icon: "🗺️", name: "Route Analysis",        desc: "Per-route journey & passenger breakdown"   },
          { icon: "🚌", name: "Journey Details",       desc: "Every journey with full status & timing"   },
          { icon: "🎒", name: "Student Boarding Log",  desc: "Boarded/alighted per student per journey"  },
          { icon: "📍", name: "District Distribution", desc: "Journey & passenger counts by district"    },
          { icon: "👨‍✈️", name: "Driver Performance",   desc: "Per-driver journey counts & duration"      },
        ].map((s) => <SheetRow key={s.name} {...s} />)}
      </div>
    </div>
  );
}

// ── Error Banner ───────────────────────────────────────────────────────────────

function ErrorBanner({ code, onDismiss }: { code: number | string; onDismiss: () => void }) {
  const messages: Record<string | number, { title: string; detail: string; icon: React.ReactNode }> = {
    401: {
      title:  "Session expired",
      detail: "Your session has expired. Please log in again.",
      icon:   <Lock size={14} color="#b91c1c" />,
    },
    403: {
      title:  "Access denied",
      detail: "You don't have permission to export this data.",
      icon:   <Lock size={14} color="#b91c1c" />,
    },
    404: {
      title:  "No data found",
      detail: "No records match your filters. Try broadening the range.",
      icon:   <Info size={14} color="#a16207" />,
    },
    network: {
      title:  "Network error",
      detail: "Could not reach the server. Check your connection.",
      icon:   <AlertCircle size={14} color="#b91c1c" />,
    },
    unknown: {
      title:  "Export failed",
      detail: "Something went wrong. Please try again.",
      icon:   <AlertCircle size={14} color="#b91c1c" />,
    },
  };

  const isWarning = code === 404;
  const msg = messages[code] ?? messages.unknown;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 9,
        padding: "10px 12px", borderRadius: 8, marginBottom: 12,
        background: isWarning ? "#fefce8" : "#fef2f2",
        border: `1px solid ${isWarning ? "#fde047" : "#fecaca"}`,
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 1 }}>{msg.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 700, color: isWarning ? "#a16207" : "#b91c1c" }}>
          {msg.title}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: isWarning ? "#92400e" : "#991b1b" }}>{msg.detail}</p>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0, lineHeight: 1 }}>
        <X size={12} color="#94a3b8" />
      </button>
    </motion.div>
  );
}

// ── Success Banner ─────────────────────────────────────────────────────────────

function SuccessBanner({ filename }: { filename: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "10px 12px", borderRadius: 8, marginBottom: 12,
        background: "#F4F4F5", border: "1px solid #D4D4D8",
      }}
    >
      <CheckCircle2 size={14} color="#1E40AF" />
      <div>
        <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 700, color: "#1E40AF" }}>Export ready</p>
        <p style={{ margin: 0, fontSize: 11, color: "#166534" }}>{filename} downloaded.</p>
      </div>
    </motion.div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────

export function ExportModal({
  type,
  open,
  onClose,
  defaultBookingParams,
  defaultJourneyParams,
}: ExportModalProps) {
  const { authFetchBlob } = useAuth();

  const today  = new Date().toISOString().slice(0, 10);
  const plus30 = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })();

  const [bookingParams, setBookingParams] = useState<BookingExportParams>({
    from:     defaultBookingParams?.from     ?? today,
    to:       defaultBookingParams?.to       ?? plus30,
    status:   defaultBookingParams?.status   ?? "",
    district: defaultBookingParams?.district ?? "",
  });

  const [journeyParams, setJourneyParams] = useState<JourneyExportParams>({
    days:     defaultJourneyParams?.days     ?? "30",
    status:   defaultJourneyParams?.status   ?? "",
    district: defaultJourneyParams?.district ?? "",
    routeId:  defaultJourneyParams?.routeId  ?? "",
    busPlate: defaultJourneyParams?.busPlate ?? "",
  });

  const [exporting, setExporting] = useState(false);
  const [error,     setError]     = useState<number | string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  useEffect(() => {
    if (open) { setError(null); setSuccess(null); }
  }, [open]);

  // ── Download handler ─────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      let path: string;
      let filename: string;

      if (type === "bookings") {
        const p = new URLSearchParams();
        if (bookingParams.from)     p.set("from",     bookingParams.from);
        if (bookingParams.to)       p.set("to",       bookingParams.to);
        if (bookingParams.status)   p.set("status",   bookingParams.status);
        if (bookingParams.district) p.set("district", bookingParams.district);
        path     = `/bookings/export?${p}`;
        filename = `bookings-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      } else {
        const p = new URLSearchParams({ days: journeyParams.days });
        if (journeyParams.status)   p.set("status",   journeyParams.status);
        if (journeyParams.district) p.set("district", journeyParams.district);
        if (journeyParams.routeId)  p.set("routeId",  journeyParams.routeId);
        if (journeyParams.busPlate) p.set("busPlate", journeyParams.busPlate);
        path     = `/journeys/export?${p}`;
        filename = `journey-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      }

      const accessToken =
        localStorage.getItem("vdk_access_token") ||
        sessionStorage.getItem("vdk_access_token");

      let res: Response;
      try {
        res = await fetch(`${API_BASE}${path}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        setError("network");
        return;
      }

      if (res.status === 401) {
        const blob = await authFetchBlob(path);
        if (!blob) { setError(401); return; }
        triggerDownload(blob, filename);
        setSuccess(filename);
        return;
      }

      if (res.status === 403) { setError(403); return; }
      if (res.status === 404) { setError(404); return; }
      if (!res.ok)            { setError("unknown"); return; }

      const blob = await res.blob();
      triggerDownload(blob, filename);
      setSuccess(filename);
    } finally {
      setExporting(false);
    }
  };

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const accent = type === "bookings" ? GREEN : BLUE;
  const title  = type === "bookings" ? "Export Bookings Report" : "Export Journey Report";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          {/* ── Modal — nested inside backdrop so flex centering works ── */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{   opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(600px, calc(100vw - 32px))",
              maxHeight: "calc(100vh - 48px)",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              boxShadow: "0 32px 80px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.10)",
              overflow: "hidden",
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${accent}16`,
                  border: `1px solid ${accent}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <DownloadCloud size={16} color={accent} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
                    {title}
                  </h2>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                    Filter & download as .xlsx
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <X size={13} color="#64748b" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 20px",
              minHeight: 0,
            }}>
              <AnimatePresence mode="wait">
                {error && (
                  <ErrorBanner key="error" code={error} onDismiss={() => setError(null)} />
                )}
                {success && (
                  <SuccessBanner key="success" filename={success} />
                )}
              </AnimatePresence>

              {type === "bookings" ? (
                <BookingForm params={bookingParams} onChange={setBookingParams} accent={accent} />
              ) : (
                <JourneyForm params={journeyParams} onChange={setJourneyParams} accent={accent} />
              )}
            </div>

            {/* ── Footer ── */}
            <div style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              padding: "12px 20px",
              borderTop: "1px solid #f1f5f9",
              flexShrink: 0,
              background: "#fafafa",
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                  borderRadius: 7,
                  border: `1px solid ${accent}`,
                  background: accent,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: exporting ? "wait" : "pointer",
                  fontFamily: "inherit",
                  opacity: exporting ? 0.75 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {exporting ? (
                  <>
                    <RefreshCw size={13} style={{ animation: "spin 0.8s linear infinite" }} />
                    Generating…
                  </>
                ) : (
                  <>
                    <DownloadCloud size={13} />
                    Download .xlsx
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Convenience hook ───────────────────────────────────────────────────────────

export function useExportModal(type: ExportType) {
  const [open, setOpen] = useState(false);
  return {
    open,
    openModal:  () => setOpen(true),
    closeModal: () => setOpen(false),
    modalProps: { type, open, onClose: () => setOpen(false) } as const,
  };
}