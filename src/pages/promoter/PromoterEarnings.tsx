import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, TrendingUp, CheckCircle2, Percent } from 'lucide-react'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import EmptyState from '../../components/studio/EmptyState'
import DataTable, { type Column } from '../../components/studio/DataTable'
import StudioPagination from '../../components/studio/StudioPagination'
import FilterChips from '../../components/studio/FilterChips'
import api from '../../api'
import { COMMISSION_TONE, dateFmt, rwf } from './promoterUi'
import { MetricCard, StatusPill, ErrorNote } from './promoterBits'

const PAGE_SIZE = 20

interface CommissionRow {
  id: string
  amount: number
  currency?: string
  rate?: number
  baseAmount?: number
  status: string
  earnedAt?: string | null
  paidAt?: string | null
  reversedAt?: string | null
  booking?: { referenceCode?: string; travelDate?: string } | null
}

export default function PromoterEarnings() {
  const { t } = useTranslation()
  const [summary, setSummary] = useState<any>(null)
  const [rate, setRate] = useState<number>(25)
  const [rows, setRows] = useState<CommissionRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) }
      if (status) params.status = status
      const res = await api.getPromoterEarnings(params)
      const data = res?.data ?? res
      setSummary(data?.earnings ?? null)
      setRows(Array.isArray(data?.commissions) ? data.commissions : [])
      if (data?.pagination) setPagination(data.pagination)
    } catch (e: any) {
      setError(e?.message || t('promoter.noEarningsDesc'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, status, t])

  useEffect(() => { load() }, [load])

  // The commission rate lives on the promoter profile, not the ledger summary.
  useEffect(() => {
    let alive = true
    api.getPromoterProfile()
      .then((p: any) => {
        const value = Number(p?.data?.commissionRate)
        if (alive && Number.isFinite(value) && value > 0) setRate(value)
      })
      .catch(() => { /* keep the 25% program default */ })
    return () => { alive = false }
  }, [])

  const changePage = useCallback((next: number) => setPage(next), [])

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('promoter.allStatuses') },
      { value: 'pending', label: t('promoter.statusPending') },
      { value: 'earned', label: t('promoter.statusEarned') },
      { value: 'paid', label: t('promoter.statusPaid') },
      { value: 'reversed', label: t('promoter.statusReversed') },
    ],
    [t]
  )

  const columns = useMemo<Column<CommissionRow>[]>(
    () => [
      {
        key: 'booking',
        header: t('promoter.booking'),
        sortable: true,
        sortValue: (r) => r.booking?.referenceCode || '',
        render: (r) => (
          <div className="min-w-0">
            <p className="font-medium text-[var(--studio-text)] truncate">
              {r.booking?.referenceCode || t('promoter.commission')}
            </p>
            {r.booking?.travelDate && (
              <p className="text-xs text-[var(--studio-text-muted)]">{dateFmt(r.booking.travelDate)}</p>
            )}
          </div>
        ),
      },
      {
        key: 'amount',
        header: t('promoter.commission'),
        align: 'right',
        sortable: true,
        render: (r) => <span className="font-semibold">{rwf(r.amount)}</span>,
      },
      {
        key: 'baseAmount',
        header: t('promoter.commissionBase'),
        align: 'right',
        sortable: true,
        render: (r) => (
          <div className="text-right">
            <p className="text-[var(--studio-text)]">{rwf(r.baseAmount)}</p>
            {typeof r.rate === 'number' && (
              <p className="text-xs text-[var(--studio-text-muted)]">{r.rate}%</p>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: t('promoter.status'),
        sortable: true,
        render: (r) => <StatusPill status={r.status} tone={COMMISSION_TONE} />,
      },
      {
        key: 'earnedAt',
        header: t('promoter.earnedOn'),
        sortable: true,
        sortValue: (r) => r.earnedAt || '',
        render: (r) => (
          <div className="min-w-0">
            <p className="text-[var(--studio-text)]">{dateFmt(r.earnedAt)}</p>
            {r.paidAt && (
              <p className="text-xs text-[var(--studio-text-muted)]">
                {t('promoter.paidOn')}: {dateFmt(r.paidAt)}
              </p>
            )}
          </div>
        ),
      },
    ],
    [t]
  )

  return (
    <StudioShell>
      <div className="space-y-8">
        <div>
          <StudioHeading>{t('promoter.earnings')}</StudioHeading>
          <p className="mt-2 text-[var(--text-sub)]">{t('promoter.earningsDescription')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label={t('promoter.totalEarnings')}
            value={rwf(summary?.lifetimeEarned)}
            icon={<Wallet size={16} className="text-[var(--studio-accent)]" />}
          />
          <MetricCard
            label={t('promoter.availableBalance')}
            value={rwf(summary?.availableBalance)}
            icon={<TrendingUp size={16} className="text-[var(--studio-accent)]" />}
          />
          <MetricCard
            label={t('promoter.paidEarnings')}
            value={rwf(summary?.paidTotal)}
            icon={<CheckCircle2 size={16} className="text-[var(--studio-accent)]" />}
            hint={t('promoter.paidCount', { count: summary?.paidCount ?? 0 })}
          />
          <MetricCard
            label={t('promoter.commissionRate')}
            value={t('promoter.rateValue', { rate })}
            icon={<Percent size={16} className="text-[var(--studio-accent)]" />}
            hint={t('promoter.payoutReady')}
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
              svgSrc="/youtube_graphic_no_content_illustration_v4.svg"
              svgAlt={t('promoter.noEarnings')}
              title={t('promoter.noEarnings')}
              description={t('promoter.noEarningsDesc')}
            />
          }
        />

        <StudioPagination
          page={pagination.page}
          totalPages={pagination.pages}
          total={pagination.total}
          pageSize={pagination.limit}
          onPageChange={changePage}
        />
      </div>
    </StudioShell>
  )
}
