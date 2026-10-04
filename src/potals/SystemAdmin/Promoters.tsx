import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  UserCheck, UserX, RotateCcw, Search, Loader2, HandCoins, Clock, ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../api'
import { useToast } from '../../components/ui/Toast'
import StudioCard from '../../components/studio/StudioCard'
import StudioHeading from '../../components/studio/StudioHeading'
import DataTable, { type Column } from '../../components/studio/DataTable'
import StudioPagination from '../../components/studio/StudioPagination'
import EmptyState from '../../components/studio/EmptyState'

type ApplicationStatus = 'pending' | 'active' | 'suspended'

interface PromoterApplication {
  id: string
  name: string
  phone: string
  promoterCode: string
  status: ApplicationStatus
  termsAcceptedAt: string | null
  createdAt: string
}

interface ReviewPayload {
  id: string
  status: ApplicationStatus
  name: string
}

const PAGE_SIZE = 10

const STATUS_META: Record<string, { className: string; dot: string }> = {
  pending: { className: 'bg-[var(--tone-warning-fill)] text-[var(--tone-warning-ink)]', dot: 'bg-[var(--tone-warning-fill)]0' },
  active: { className: 'bg-[var(--tone-success-fill)] text-[var(--tone-success-ink)]', dot: 'bg-[var(--tone-success-fill)]0' },
  suspended: { className: 'bg-[var(--tone-danger-fill)] text-[var(--tone-danger-ink)]', dot: 'bg-[var(--tone-danger-fill)]0' },
}

export default function Promoters() {
  const { t } = useTranslation()
  const toast = useToast()

  const [status, setStatus] = useState<'all' | ApplicationStatus>('pending')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<PromoterApplication[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (page: number) => {
    setLoading(true)
    try {
      const res: any = await api.getPromoterApplications({
        page: String(page),
        limit: String(PAGE_SIZE),
        status,
      })
      const data = res?.data ?? res
      setRows(Array.isArray(data?.applications) ? data.applications : [])
      const p = data?.pagination
      setPagination({
        page: p?.page ?? page,
        total: p?.total ?? 0,
        pages: p?.pages ?? 1,
      })
    } catch (err: any) {
      toast.error(t('promoterAdmin.loadFailed'), err?.message || '')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [status, t, toast])

  useEffect(() => {
    load(1)
  }, [load])

  const review = useCallback(async ({ id, status: next, name }: ReviewPayload) => {
    let reason: string | undefined
    if (next === 'suspended') {
      reason = window.prompt(t('promoterAdmin.suspendPrompt', { name })) ?? undefined
      if (reason === undefined) return
      if (!reason.trim()) {
        toast.error(t('promoterAdmin.reasonRequired'))
        return
      }
    } else if (!window.confirm(t('promoterAdmin.confirmApprove', { name }))) {
      return
    }

    setBusyId(id)
    try {
      await api.reviewPromoterApplication(id, next, reason)
      toast.success(
        next === 'active'
          ? t('promoterAdmin.approved', { name })
          : next === 'suspended'
            ? t('promoterAdmin.suspended', { name })
            : t('promoterAdmin.movedToPending', { name }),
      )
      await load(pagination.page)
    } catch (err: any) {
      toast.error(t('promoterAdmin.reviewFailed'), err?.message || '')
    } finally {
      setBusyId(null)
    }
  }, [t, toast, load, pagination.page])

  const statusOptions = useMemo(
    () => [
      { value: 'pending', label: t('promoterAdmin.statusPending') },
      { value: 'active', label: t('promoterAdmin.statusActive') },
      { value: 'suspended', label: t('promoterAdmin.statusSuspended') },
      { value: 'all', label: t('promoterAdmin.statusAll') },
    ],
    [t],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.phone || '').toLowerCase().includes(q) ||
        (r.promoterCode || '').toLowerCase().includes(q),
    )
  }, [rows, search])

  const columns: Column<PromoterApplication>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('promoterAdmin.promoter'),
        sortable: true,
        sortValue: (r) => r.name,
        render: (r) => (
          <div className="flex flex-col">
            <span className="font-semibold text-[var(--studio-text)]">{r.name}</span>
            <span className="text-xs text-[var(--studio-text-muted)]">{r.phone}</span>
          </div>
        ),
      },
      {
        key: 'promoterCode',
        header: t('promoter.referralCode'),
        sortable: true,
        sortValue: (r) => r.promoterCode || '',
        render: (r) => (
          <span className="font-mono text-xs font-semibold text-[var(--studio-accent)]">
            {r.promoterCode || '—'}
          </span>
        ),
      },
      {
        key: 'termsAcceptedAt',
        header: t('promoterAdmin.terms'),
        sortValue: (r) => r.termsAcceptedAt || '',
        render: (r) => (
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--studio-text-sub)]">
            {r.termsAcceptedAt ? (
              <>
                <ShieldCheck size={13} className="text-[var(--tone-success-ink)]" aria-hidden="true" />
                {new Date(r.termsAcceptedAt).toLocaleDateString()}
              </>
            ) : (
              <>
                <Clock size={13} className="text-[var(--tone-warning-ink)]" aria-hidden="true" />
                {t('promoterAdmin.termsPending')}
              </>
            )}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        sortable: true,
        sortValue: (r) => r.status,
        render: (r) => {
          const meta = STATUS_META[r.status] ?? STATUS_META.pending
          const label = t(`promoterAdmin.status${r.status.charAt(0).toUpperCase()}${r.status.slice(1)}`)
          return (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {label}
            </span>
          )
        },
      },
      {
        key: 'createdAt',
        header: t('promoterAdmin.applied'),
        sortable: true,
        sortValue: (r) => r.createdAt || '',
        render: (r) => (
          <span className="text-xs text-[var(--studio-text-sub)]">
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        key: 'actions',
        header: t('promoterAdmin.actions'),
        align: 'right',
        render: (r) => {
          const busy = busyId === r.id
          return (
            <div className="inline-flex items-center gap-2">
              {r.status !== 'active' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => review({ id: r.id, status: 'active', name: r.name })}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border-none bg-[var(--solid-success)] hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : <UserCheck size={12} aria-hidden="true" />}
                  {t('promoterAdmin.approve')}
                </button>
              )}
              {r.status !== 'suspended' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => review({ id: r.id, status: 'suspended', name: r.name })}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border border-[var(--tone-danger-line)] bg-[var(--tone-danger-fill)] hover:bg-[var(--tone-danger-fill)] text-[var(--tone-danger-ink)] cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors"
                >
                  <UserX size={12} aria-hidden="true" />
                  {t('promoterAdmin.suspend')}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => review({ id: r.id, status: 'pending', name: r.name })}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold border border-[var(--studio-border)] bg-white hover:bg-[var(--studio-muted-fill)] text-[var(--studio-text)] cursor-pointer disabled:opacity-50 disabled:cursor-default transition-colors"
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  {t('promoterAdmin.reinstate')}
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [busyId, t, review],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <StudioHeading sparkles>{t('promoterAdmin.title')}</StudioHeading>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--studio-text-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('promoterAdmin.searchPlaceholder')}
            aria-label={t('promoterAdmin.searchPlaceholder')}
            className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-[var(--studio-border)] text-[var(--studio-text)] outline-none focus:border-[var(--studio-accent)]"
            style={{ borderRadius: 'var(--studio-radius-pill)' }}
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value as typeof status)}
            aria-pressed={status === opt.value}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
              status === opt.value
                ? 'bg-[var(--studio-text)] text-[var(--studio-bg)]'
                : 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)] hover:text-[var(--studio-text)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <StudioCard padding="none" as="section" className="overflow-hidden">
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--studio-text-muted)]">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              {t('common.loading')}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={visible}
              getRowId={(r) => r.id}
              emptyState={
                <EmptyState
                  icon={HandCoins}
                  title={t('promoterAdmin.empty')}
                  description={t('promoterAdmin.emptyDesc')}
                  svgAlt={t('promoterAdmin.empty')}
                />
              }
            />
          )}
        </div>
      </StudioCard>

      <StudioPagination
        page={pagination.page}
        totalPages={pagination.pages}
        total={pagination.total}
        pageSize={PAGE_SIZE}
        onPageChange={(p) => load(p)}
      />
    </div>
  )
}