import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wallet, CheckCircle2, Smartphone, Send, Zap } from 'lucide-react'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import StudioCard from '../../components/studio/StudioCard'
import EmptyState from '../../components/studio/EmptyState'
import DataTable, { type Column } from '../../components/studio/DataTable'
import StudioPagination from '../../components/studio/StudioPagination'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'
import api from '../../api'
import { PAYOUT_TONE, dateTimeFmt, rwf } from './promoterUi'
import { MetricCard, StatusPill, ErrorNote } from './promoterBits'

const PAGE_SIZE = 20

interface PayoutRow {
  id: string
  reference?: string
  amount: number
  currency?: string
  status: string
  phone?: string
  commissionCount?: number
  failureReason?: string
  createdAt: string
  processedAt?: string | null
}

export default function PromoterPayouts() {
  const { t } = useTranslation()
  const toast = useToast()
  const [summary, setSummary] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [rows, setRows] = useState<PayoutRow[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getPromoterPayouts({ page: String(page), limit: String(PAGE_SIZE) })
      const data = res?.data ?? res
      setRows(Array.isArray(data?.payouts) ? data.payouts : [])
      if (data?.pagination) setPagination(data.pagination)
    } catch (e: any) {
      setError(e?.message || t('promoter.noPayoutsDesc'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, t])

  const loadSummary = useCallback(async () => {
    try {
      const [stats, prof] = await Promise.all([api.getPromoterStats(), api.getPromoterProfile()])
      setSummary(stats?.data?.earnings ?? null)
      setProfile(prof?.data ?? null)
    } catch {
      // Balance cards degrade to zeros rather than blocking the history table.
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadSummary() }, [loadSummary])

  const requestPayout = async () => {
    setRequesting(true)
    try {
      const res = await api.requestPromoterPayout()
      const payout = res?.data?.payout ?? res?.payout ?? null
      if (payout?.status === 'paid') {
        toast.success(res?.message || t('promoter.payoutSent'), rwf(payout.amount))
      } else if (payout?.status === 'failed') {
        toast.error(res?.message || t('promoter.payoutFailed'), payout.failureReason || '')
      } else {
        toast.info(res?.message || t('promoter.payoutRequested'))
      }
      await Promise.all([load(), loadSummary()])
    } catch (e: any) {
      toast.error(t('promoter.payoutFailed'), e?.message || '')
    } finally {
      setRequesting(false)
    }
  }

  const columns: Column<PayoutRow>[] = [
    {
      key: 'reference',
      header: t('promoter.reference'),
      sortable: true,
      render: (r) => (
        <span className="font-mono text-xs text-[var(--studio-text)]">{r.reference || '—'}</span>
      ),
    },
    {
      key: 'amount',
      header: t('promoter.amount'),
      align: 'right',
      sortable: true,
      render: (r) => <span className="font-semibold">{rwf(r.amount)}</span>,
    },
    {
      key: 'commissionCount',
      header: t('promoter.commissionCount'),
      align: 'right',
      sortable: true,
      render: (r) => <span className="text-[var(--studio-text-sub)]">{r.commissionCount ?? 0}</span>,
    },
    {
      key: 'phone',
      header: t('promoter.payoutNumber'),
      render: (r) => <span className="font-mono text-xs text-[var(--studio-text-sub)]">{r.phone || '—'}</span>,
    },
    {
      key: 'status',
      header: t('promoter.status'),
      sortable: true,
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill status={r.status} tone={PAYOUT_TONE} />
          {r.status === 'failed' && r.failureReason && (
            <span className="text-xs text-[var(--studio-text-muted)] max-w-[18rem]">
              {r.failureReason}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: t('promoter.date'),
      sortable: true,
      sortValue: (r) => r.createdAt,
      render: (r) => <span className="text-[var(--studio-text)]">{dateTimeFmt(r.createdAt)}</span>,
    },
  ]

  const available = Number(summary?.availableBalance || 0)

  return (
    <StudioShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <StudioHeading>{t('promoter.payouts')}</StudioHeading>
            <p className="mt-2 text-[var(--text-sub)]">{t('promoter.payoutsDescription')}</p>
          </div>
          <Button onClick={requestPayout} disabled={requesting || available <= 0} className="!rounded-full">
            <Send size={15} />
            {requesting ? t('promoter.requestingPayout') : t('promoter.requestPayout')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label={t('promoter.availableBalance')}
            value={rwf(available)}
            icon={<Wallet size={16} className="text-[var(--studio-accent)]" />}
          />
          <MetricCard
            label={t('promoter.paidEarnings')}
            value={rwf(summary?.paidTotal)}
            icon={<CheckCircle2 size={16} className="text-[var(--studio-accent)]" />}
          />
          <MetricCard
            label={t('promoter.totalEarnings')}
            value={rwf(summary?.lifetimeEarned)}
            icon={<Zap size={16} className="text-[var(--studio-accent)]" />}
          />
          <MetricCard
            label={t('promoter.payoutNumber')}
            value={
              <span className="flex items-center gap-2 text-lg">
                <Smartphone size={16} className="text-[var(--studio-accent)]" />
                <span className="font-mono truncate">{profile?.payoutPhone || '—'}</span>
              </span>
            }
            hint={t('promoter.payoutAutomaticHintShort')}
          />
        </div>

        {error && <ErrorNote message={error} />}

        <StudioCard padding="none">
          <div className="px-5 py-4 border-b border-[var(--studio-border)] flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--studio-text)]">{t('promoter.payoutHistory')}</h2>
            {loading && <span className="text-xs text-[var(--studio-text-muted)]">{t('promoter.loading')}</span>}
          </div>
          <div className="p-5">
            <DataTable
              columns={columns}
              data={rows}
              loading={loading}
              className="[&>div]:border-0 [&>div]:rounded-none"
              emptyState={
                <EmptyState
                  svgSrc="/youtube_graphic_no_content_illustration_v4.svg"
                  svgAlt={t('promoter.noPayouts')}
                  title={t('promoter.noPayouts')}
                  description={t('promoter.noPayoutsDesc')}
                />
              }
            />
          </div>
        </StudioCard>

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
