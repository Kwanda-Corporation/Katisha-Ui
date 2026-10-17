import React, { useState } from 'react'
import {
  Upload, Users, ArrowRight,
  CheckCircle2, AlertCircle, Bus, FileUp, X, Eye,
  TrendingUp, Clock, BookOpen, CreditCard,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { Card, Button, StatCard, Modal } from '../../components/ui'

/* ─── types ─────────────────────────────────────────────── */
type NotificationType = 'booking' | 'journey' | 'incident'
type Notification = { id: number; type: NotificationType; title: string; description: string; time: string }
type Student      = { id: number; name: string; grade: string; parentPhone: string }
type Schedule     = { id: number; date: string; route: string; pickupTime: string; studentCount: number; students: Student[] }

/* ─── static data ────────────────────────────────────────── */
const statsRows = [
  {
    label: 'Registered Students',
    value: '10,500',
    change: '+340 this term',
    positive: true,
    icon: <Users size={14} />,
  },
  {
    label: 'Active Students',
    value: '9,850',
    change: '93.8% attendance rate',
    positive: true,
    icon: <TrendingUp size={14} />,
  },
  {
    label: 'Pending Bookings',
    value: '12',
    change: '3 require immediate action',
    positive: false,
    icon: <BookOpen size={14} />,
  },
  {
    label: 'Pending Payments',
    value: '8',
    change: 'RWF 240,000 outstanding',
    positive: false,
    icon: <CreditCard size={14} />,
  },
]

const notifications: Notification[] = [
  { id: 1, type: 'booking',  title: 'New Booking Confirmed',  description: 'John Doe — Morning Route A has been confirmed',      time: '5 min ago'   },
  { id: 2, type: 'journey',  title: 'Journey Started',        description: 'Bus #12 started Route B — 25 students onboard',     time: '12 min ago'  },
  { id: 3, type: 'incident', title: 'Incident Report',        description: 'Minor delay on Route C due to traffic',             time: '1 hour ago'  },
  { id: 4, type: 'booking',  title: 'Booking Confirmed',      description: 'Sarah Smith — Evening Route D confirmed',           time: '2 hours ago' },
]

const pickupSchedule: Schedule[] = [
  { id: 1, date: 'Mon, Dec 23', route: 'Route A — Kicukiro',    pickupTime: '07:00 AM', studentCount: 25,
    students: [
      { id: 1, name: 'Alice Johnson', grade: 'Grade 10', parentPhone: '+250 788 123 456' },
      { id: 2, name: 'Bob Smith',     grade: 'Grade 10', parentPhone: '+250 788 234 567' },
      { id: 3, name: 'Carol White',   grade: 'Grade 11', parentPhone: '+250 788 345 678' },
    ]},
  { id: 2, date: 'Mon, Dec 23', route: 'Route B — Remera',      pickupTime: '07:15 AM', studentCount: 18,
    students: [
      { id: 4, name: 'Frank Wilson',  grade: 'Grade 12', parentPhone: '+250 788 678 901' },
      { id: 5, name: 'Grace Taylor',  grade: 'Grade 11', parentPhone: '+250 788 789 012' },
    ]},
  { id: 3, date: 'Mon, Dec 23', route: 'Route C — Kimironko',   pickupTime: '07:30 AM', studentCount: 32,
    students: [
      { id: 6, name: 'Iris Anderson', grade: 'Grade 9',  parentPhone: '+250 788 901 234' },
      { id: 7, name: 'Jack Thomas',   grade: 'Grade 11', parentPhone: '+250 788 012 345' },
    ]},
  { id: 4, date: 'Mon, Dec 23', route: 'Route D — Nyarutarama', pickupTime: '07:45 AM', studentCount: 21,
    students: [
      { id: 8, name: 'Liam Garcia',   grade: 'Grade 12', parentPhone: '+250 788 234 567' },
      { id: 9, name: 'Mia Rodriguez', grade: 'Grade 11', parentPhone: '+250 788 345 678' },
    ]},
]

const notifMeta: Record<NotificationType, { icon: React.ReactNode; bg: string; color: string }> = {
  booking:  { icon: <CheckCircle2 size={14} />, bg: '#F4F4F5', color: 'var(--blue)' },
  journey:  { icon: <Bus size={14} />,          bg: '#F4F4F5', color: 'var(--blue)' },
  incident: { icon: <AlertCircle size={14} />,  bg: '#ffedd5', color: 'var(--warning)' },
}

/* ════════════════════════════════════════════════════════════ */
function Home() {
  const navigate = useNavigate()
  const [uploadYear, setUploadYear]             = useState(new Date().getFullYear().toString())
  const [isDragging, setIsDragging]             = useState(false)
  const [uploadedFile, setUploadedFile]         = useState<File | null>(null)
  const [showModal, setShowModal]               = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files[0]; if (f) setUploadedFile(f)
  }
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) setUploadedFile(f)
  }
  const openModal = (s: Student[]) => { setSelectedStudents(s); setShowModal(true) }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* ── Main grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_296px] gap-4 items-start">

        {/* LEFT column */}
        <div className="flex flex-col gap-4">

          {/* ── Stats row ─────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsRows.map((row) => (
              <StatCard
                key={row.label}
                label={row.label}
                value={row.value}
                sub={row.change}
                icon={row.icon}

              />
            ))}
          </div>

          {/* ── Pickup schedule table ────────────────────── */}
          <Card padding="sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-[var(--font-body)] text-lg font-semibold text-[var(--text)]">Pickup Schedule</h3>
                <p className="font-[var(--font-body)] text-xs text-[var(--text-muted)]">Today's transportation routes</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/Dashboard/booking')}>
                View all <ArrowRight size={11} />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Date', 'Route', 'Pickup Time', 'Students', ''].map((h, i) => (
                      <th key={i} className={`px-3.5 py-2 text-left font-[var(--font-body)] text-[10.5px] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)] border-b border-[var(--border)] whitespace-nowrap ${i >= 3 ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pickupSchedule.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[#F9FAFB] transition-colors duration-200">
                      <td className="px-3.5 py-2.5 font-[var(--font-body)] text-xs font-medium text-[var(--text)] whitespace-nowrap">{s.date}</td>
                      <td className="px-3.5 py-2.5 font-[var(--font-body)] text-xs text-[var(--text-sub)]">{s.route}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center gap-1.5 font-[var(--font-body)] text-xs text-[var(--text)]">
                          <Clock size={11} className="text-[var(--text-muted)]" /> {s.pickupTime}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-[var(--font-body)] text-xs font-bold text-[var(--text)]">{s.studentCount}</td>
                      <td className="px-3.5 py-2.5 text-center">
                        <button
                          onClick={() => openModal(s.students)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border-none cursor-pointer font-[var(--font-body)] text-[11px] font-semibold transition-colors duration-200 bg-[var(--blue-light)] text-[var(--blue)] hover:bg-[var(--blue-light)]"
                        >
                          <Eye size={10} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-4">

          {/* Students summary */}
          <div className="rounded-md p-4 bg-gradient-to-br from-[var(--blue)] to-[#053165]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center">
                <Users size={17} className="text-white" />
              </div>
              <div>
                <p className="font-[var(--font-body)] text-[10.5px] text-white/60 font-medium">Total registered</p>
                <p className="font-[var(--font-body)] text-xl font-extrabold text-white leading-none">10,500</p>
              </div>
            </div>

            <div className="border-t border-white/15 pt-3 grid grid-cols-2 gap-2.5">
              {[
                { dot: '#60A5FA', label: 'Active',   val: '9,850' },
                { dot: '#fbbf24', label: 'Pending',  val: '12'    },
                { dot: '#f87171', label: 'Unpaid',   val: '8'     },
                { dot: '#D4D4D8', label: 'New term', val: '340'   },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.dot }} />
                  <div>
                    <p className="font-[var(--font-body)] text-[10px] text-white/50">{item.label}</p>
                    <p className="font-[var(--font-body)] text-xs font-bold text-white">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/Dashboard/students')}
              className="mt-3 w-full py-2 bg-white/15 border border-white/20 rounded-md text-white text-xs font-semibold cursor-pointer font-[var(--font-body)] flex items-center justify-center gap-1.5 transition-colors hover:bg-white/20"
            >
              View all students <ArrowRight size={12} />
            </button>
          </div>

          {/* Upload card */}
          <Card padding="sm">
            <h3 className="font-[var(--font-body)] text-sm font-semibold text-[var(--text)] mb-3">Upload Student List</h3>

            <div className="mb-2.5">
              <label className="font-[var(--font-body)] text-[10.5px] font-bold text-[var(--text-sub)] uppercase tracking-[0.05em] block mb-1">
                Academic Year
              </label>
              <input
                type="text" value={uploadYear}
                onChange={e => setUploadYear(e.target.value)}
                placeholder="2024"
                className="w-full px-3 py-1.5 text-xs rounded-md border border-[var(--border)] outline-none font-[var(--font-body)] text-[var(--text)] box-border transition-[border-color] duration-150 focus:border-[var(--blue)]"
              />
            </div>

            <div
              className={`drop-zone rounded-md p-4 text-center border-2 border-dashed transition-colors duration-200 ${isDragging ? 'border-[var(--blue)] bg-[var(--blue-light)]' : 'border-[var(--border)] hover:border-zinc-300'}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input type="file" id="file-upload" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} />

              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--blue-light)] flex items-center justify-center">
                    <FileUp size={14} style={{ color: 'var(--blue)' }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-[var(--font-body)] text-xs font-medium text-[var(--text)] max-w-[130px] truncate">
                      {uploadedFile.name}
                    </span>
                    <button onClick={() => setUploadedFile(null)} className="bg-none border-none cursor-pointer text-[var(--text-muted)] flex p-0">
                      <X size={12} />
                    </button>
                  </div>
                  <Button variant="primary" size="sm" fullWidth>Upload File</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                    <Upload size={12} className="text-[var(--text-muted)]" />
                  </div>
                  <p className="font-[var(--font-body)] text-xs font-medium text-[var(--text)]">Drop file here</p>
                  <p className="font-[var(--font-body)] text-xs text-[var(--text-muted)]">
                    or <label htmlFor="file-upload" className="font-semibold cursor-pointer" style={{ color: 'var(--blue)' }}>browse</label>
                  </p>
                  <p className="font-[var(--font-body)] text-[11px] text-[var(--border)]">CSV, XLSX, XLS</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Notifications ────────────────────────────────── */}
      <Card padding="sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-[var(--font-body)] text-lg font-semibold text-[var(--text)]">Recent Notifications</h3>
            <p className="font-[var(--font-body)] text-xs text-[var(--text-muted)]">Latest system activity</p>
          </div>
          <Button variant="ghost" size="sm">View all</Button>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {notifications.map(n => {
            const m = notifMeta[n.type]
            return (
              <div key={n.id} className="p-3 bg-white rounded-md cursor-pointer hover:border-zinc-200 border border-transparent transition-colors duration-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: m.bg, color: m.color }}>
                    {m.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-[var(--font-body)] text-xs font-semibold text-[var(--text)] mb-0.5 leading-tight">{n.title}</p>
                    <p className="font-[var(--font-body)] text-[11.5px] text-[var(--text-sub)] mb-1 leading-snug line-clamp-2">{n.description}</p>
                    <p className="font-[var(--font-body)] text-[10.5px] text-[var(--border)] font-medium">{n.time}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Modal ─────────────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Student List"
        subtitle={`${selectedStudents.length} students on this route`}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB]">
              {['Student Name', 'Grade', 'Parent Phone'].map(h => (
                <th key={h} className="px-3.5 py-2 text-left font-[var(--font-body)] text-[10.5px] font-bold uppercase tracking-[0.07em] text-[var(--text-muted)] border-b border-[var(--border)] whitespace-nowrap bg-[#F9FAFB]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedStudents.map(s => (
              <tr key={s.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[#F9FAFB] transition-colors duration-200">
                <td className="px-3.5 py-2.5 font-[var(--font-body)] text-xs font-medium text-[var(--text)]">{s.name}</td>
                <td className="px-3.5 py-2.5">
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-[var(--blue-light)] text-[var(--blue)]">{s.grade}</span>
                </td>
                <td className="px-3.5 py-2.5 font-[var(--font-body)] text-xs text-[var(--text-sub)]">{s.parentPhone}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setShowModal(false)}>Close</Button>
        </div>
      </Modal>
    </div>
  )
}

export default Home
