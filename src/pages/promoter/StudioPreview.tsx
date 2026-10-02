import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import StudioCard from '../../components/studio/StudioCard'
import StatRow from '../../components/studio/StatRow'
import EmptyState from '../../components/studio/EmptyState'
import DataTable, { type Column } from '../../components/studio/DataTable'
import FilterChips from '../../components/studio/FilterChips'
import Tabs from '../../components/studio/Tabs'
import SettingsModal from '../../components/studio/SettingsModal'
import Button from '../../components/ui/Button'
import { Copy, Share2 } from 'lucide-react'

interface Row { id: string; date: string; status: string; amount: number }

const ROWS: Row[] = [
  { id: 'a', date: '2026-03-12', status: 'paid', amount: 1250 },
  { id: 'b', date: '2026-03-11', status: 'pending', amount: 500 },
]

export default function StudioPreview() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('all')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const columns: Column<Row>[] = [
    { key: 'date', header: t('studio.dashboard'), sortable: true },
    { key: 'status', header: t('common.status'), sortable: true },
    { key: 'amount', header: t('promoter.totalEarnings'), sortable: true, align: 'right' },
  ]

  return (
    <StudioShell
      quickActions={[{ key: 'share', label: t('promoter.copyLink'), icon: <Share2 size={15} />, onClick: () => {} }]}
      settingsSections={[
        { id: 'account', label: t('studio.settings'), content: <div className="text-sm text-[var(--studio-text-sub)]">{t('common.email') || 'Account'}</div> },
      ]}
      settingsDirty={false}
    >
      <div className="space-y-6">
        <StudioHeading sparkles>{t('promoter.promoterDashboard')}</StudioHeading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StudioCard>
            <h3 className="font-semibold text-[var(--studio-text)]">{t('promoter.totalEarnings')}</h3>
            <p className="text-4xl font-semibold text-[var(--studio-text)] mt-2">1,250 RWF</p>
            <hr className="my-4 border-[var(--studio-border)]" />
            <p className="text-sm font-semibold text-[var(--studio-text)]">{t('studio.dashboard')}</p>
            <p className="text-xs text-[var(--studio-text-muted)]">{t('studio.dashboard')}</p>
            <StatRow label={t('promoter.referrals')} value="12" trend={8} />
            <StatRow label={t('promoter.earnings')} value="1,250" trend={0} />
            <Button className="mt-4 !rounded-full" size="sm"><Copy size={14} />{t('promoter.copyLink')}</Button>
          </StudioCard>

          <StudioCard>
            <h3 className="font-semibold text-[var(--studio-text)]">{t('promoter.referrals')}</h3>
            <div className="mt-3">
              <EmptyState
                variant="start-searching"
                svgAlt={t('promoter.noReferrals')}
                title={t('promoter.noReferrals')}
                description={t('studio.startSearchingDescription')}
                actionLabel={t('promoter.startSearching')}
                onAction={() => {}}
              />
            </div>
          </StudioCard>

          <StudioCard>
            <EmptyState
              variant="no-content"
              svgAlt={t('promoter.noEarnings')}
              title={t('promoter.noEarnings')}
            />
          </StudioCard>
        </div>

        <Tabs
          tabs={[
            { id: 'all', label: t('studio.dashboard') },
            { id: 'opened', label: t('promoter.referrals') },
            { id: 'purchased', label: t('promoter.earnings') },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />

        <FilterChips
          query=""
          onQueryChange={() => {}}
          queryPlaceholder={t('studio.filter')}
          clearAllLabel={t('studio.discard')}
          onClearAll={() => {}}
          dropdowns={[
            { key: 'status', label: t('common.status'), value: 'all', options: [{ value: 'all', label: t('common.status') }], onChange: () => {} },
          ]}
        />

        <DataTable columns={columns} data={ROWS} selectable emptyState={<EmptyState variant="no-content" title={t('studio.noResultsFound')} />} />
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={t('studio.settings')}
        closeLabel={t('common.close')}
        saveLabel={t('common.save')}
        discardLabel={t('studio.discardChanges')}
        sections={[{ id: 'a', label: t('studio.settings'), content: <p className="text-sm">{t('studio.discardChanges')}</p> }]}
      />
      <button className="mt-6 underline text-sm" onClick={() => setSettingsOpen(true)}>open settings</button>
    </StudioShell>
  )
}
