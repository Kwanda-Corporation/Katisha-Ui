import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, CheckCircle2, Percent } from 'lucide-react'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import EmptyState from '../../components/studio/EmptyState'
import DataTable, { type Column } from '../../components/studio/DataTable'
import StudioPagination from '../../components/studio/StudioPagination'
import FilterChips from '../../components/studio/FilterChips'
import api from '../../api'
import { REFERRAL_TONE, dateFmt, rwf } from './promoterUi'
import { MetricCard, StatusPill, ErrorNote } from './promoterBits'

const PAGE_SIZE = 20

interface ReferralRow {
  id: string
  customer?: { name?: string; phone?: string } | null
  status: string
  lifetimeValue: number
  createdAt: string
}

export default function PromoterReferrals() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<ReferralRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) }
      if (status) params.status = status
      const res = await api.getPromoterReferrals(params)
      const data = res?.data ?? res
      setRows(Array.isArray(data?.referrals) ? data.referrals : [])
      if (data?.pagination) setPagination(data.pagination)
    } catch (e: any) {
      setError(e?.message || t('promoter.noReferralsDesc'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, status, t])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    let alive = true
    api.getPromoterStats()
      .then((s: any) => { if (alive) setStats(s?.data?.referrals ?? null) })
      .catch(() => { /* stats are decorative here — the table is the source of truth */ })
    return () => { alive = false }
  }, [])

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('promoter.allStatuses') },
      { value: 'pending', label: t('promoter.statusPending') },
      { value: 'converted', label: t('promoter.statusConverted') },
      { value: 'rejected', label: t('promoter.statusRejected') },
    ],
    [t]
  )

  const columns = useMemo<Column<ReferralRow>[]>(
    () => [
      {
        key: 'customer',
        header: t('promoter.customer'),
        sortable: true,
        sortValue: (r) => r.customer?.name || '',
        render: (r) => (
          <div className="min-w-0">
            <p className="font-medium text-[var(--studio-text)] truncate">{r.customer?.name || '—'}</p>
            {r.customer?.phone && (
              <p className="text-xs font-mono text-[var(--studio-text-muted)]">{r.customer.phone}</p>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: t('promoter.status'),
        sortable: true,
        render: (r) => <StatusPill status={r.status} tone={REFERRAL_TONE} />,
      },
      {
        key: 'lifetimeValue',
        header: t('promoter.referredValue'),
        align: 'right',
        sortable: true,
        render: (r) => <span className="font-semibold">{rwf(r.lifetimeValue)}</span>,
      },
      {
        key: 'createdAt',
        header: t('promoter.joined'),
        sortable: true,
        sortValue: (r) => r.createdAt,
        render: (r) => <span className="text-[var(--studio-text)]">{dateFmt(r.createdAt)}</span>,
      },
    ],
    [t]
  )

  return (
    <StudioShell>
      <div className="space-y-8">
        <div>
          <StudioHeading>{t('promoter.referrals')}</StudioHeading>
          <p className="mt-2 text-[var(--text-sub)]">{t('promoter.referralsDescription')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <MetricCard
            label={t('promoter.totalReferrals')}
            value={stats?.total ?? pagination.total ?? 0}
            icon={<Users size={16} className="text-[var(--studio-accent)]" />}
          />
          <MetricCard
            label={t('promoter.convertedBookings')}
            value={stats?.converted ?? 0}
            icon={<CheckCircle2 size={16} className="text-[var(--studio-accent)]" />}
          />
          <MetricCard
            label={t('promoter.conversionRate')}
            value={`${stats?.conversionRate ?? 0}%`}
            icon={<Percent size={16} className="text-[var(--studio-accent)]" />}
          />
        </div>

        {error && <ErrorNote message={error} />}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterChips
            dropdowns={[
              {
                key: 'status',
                label: t('promoter.status'),
                value: status,
                options: statusOptions,
                onChange: (v) => { setStatus(v); setPage(1) },
              },
            ]}
          />
          {loading && <span className="text-xs text-[var(--studio-text-muted)]">{t('promoter.loading')}</span>}
        </div>

        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyState={
            <EmptyState
              svgSrc="/youtube_graphic_start_searching_dark.svg"
              svgAlt={t('promoter.noReferrals')}
              title={t('promoter.noReferrals')}
              description={t('promoter.noReferralsDesc')}
            />
          }
        />

        <StudioPagination
          page={pagination.page}
          totalPages={pagination.pages}
          total={pagination.total}
          pageSize={pagination.limit}
          onPageChange={setPage}
        />
      </div>
    </StudioShell>
  )
}
