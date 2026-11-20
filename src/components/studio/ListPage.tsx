import { ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import PageHeader from './PageHeader'
import StatCards, { StatItem } from './StatCards'
import TabBar from './TabBar'
import FilterBand from './FilterBand'
import type { FilterDef } from './FilterBand'
import type { TabItem } from './Tabs'

interface NoticeConfig {
  /** Stable id — used for the dismissal localStorage key. */
  id: string
  text: string
  learnMoreLabel?: string
  onLearnMore?: () => void
}

interface ListPageProps {
  title: string
  actions?: ReactNode
  stats?: StatItem[]
  notice?: NoticeConfig
  tabs?: TabItem[]
  activeTab?: string
  onTabChange?: (id: string) => void
  filterQuery?: string
  onFilterQueryChange?: (q: string) => void
  filterPlaceholder?: string
  filters?: FilterDef[]
  filterChips?: ReactNode
  onClearFilters?: () => void
  hasClearable?: boolean
  /** Tightens the page top padding and header-to-content spacing. */
  compact?: boolean
  /** Primary content — usually a DataTable. */
  children: ReactNode
  /** Footer content — usually StudioPagination. */
  footer?: ReactNode
}

/**
 * ListPage — the shared Audio-library listing frame used by every list page:
 * 56px title row, optional dismissible notice band, optional stat cards, tab
 * band, 48px filter band, the table, and a 56px pagination footer. All bands
 * are full-bleed; their content respects the page gutter.
 */
export default function ListPage({
  title,
  actions,
  stats,
  notice,
  tabs,
  activeTab,
  onTabChange,
  filterQuery,
  onFilterQueryChange,
  filterPlaceholder,
  filters,
  filterChips,
  onClearFilters,
  hasClearable,
  compact = false,
  children,
  footer,
}: ListPageProps) {
  const { t } = useTranslation()
  const [noticeDismissed, setNoticeDismissed] = useState(false)

  useEffect(() => {
    if (!notice) return
    try {
      setNoticeDismissed(localStorage.getItem(`vdk.notice.${notice.id}`) === '1')
    } catch { /* storage unavailable */ }
  }, [notice])

  const dismissNotice = () => {
    setNoticeDismissed(true)
    try {
      if (notice) localStorage.setItem(`vdk.notice.${notice.id}`, '1')
    } catch { /* storage unavailable */ }
  }

  const hasStats = Boolean(stats && stats.length)

  return (
    <div className={`vdk-page${compact ? ' vdk-page-compact' : ''}`}>
      <PageHeader title={title} actions={actions} className={compact ? 'vdk-title-row-compact' : ''} />

      {notice && !noticeDismissed && (
        <div className={`vdk-notice vdk-gutter-x flex flex-wrap items-center gap-x-4 gap-y-2 min-h-12 py-2 ${compact ? 'mt-2' : 'mt-4'}`}>
          <span
            className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full border"
            style={{ borderColor: 'var(--studio-text-sub)', color: 'var(--studio-text-sub)' }}
            aria-hidden="true"
          >
            <Info size={13} />
          </span>
          <p className="flex-1 min-w-0 text-sm text-[var(--studio-text)] line-clamp-2 sm:truncate">{notice.text}</p>
          <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
            {notice.onLearnMore && (
              <button
                type="button"
                onClick={notice.onLearnMore}
                className="vdk-outlined h-9 px-3 sm:px-4 text-sm font-medium bg-[var(--studio-surface)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
                style={{ borderRadius: 9999 }}
              >
                {notice.learnMoreLabel ?? t('studio.learnMore', 'Learn more')}
              </button>
            )}
            <button
              type="button"
              onClick={dismissNotice}
              className="vdk-outlined h-9 px-3 sm:px-4 text-sm font-medium bg-[var(--studio-surface)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
              style={{ borderRadius: 9999 }}
            >
              {t('studio.gotIt', 'Got it')}
            </button>
          </div>
        </div>
      )}

      {hasStats && <StatCards items={stats!} className="mt-4" />}

      {tabs && tabs.length > 0 && onTabChange && (
        <div className={hasStats ? 'mt-6' : compact ? 'mt-2' : 'mt-4'}>
          <TabBar tabs={tabs} activeTab={activeTab ?? tabs[0].id} onTabChange={onTabChange} />
        </div>
      )}

      {(onFilterQueryChange || filterChips || (filters && filters.length > 0)) && (
        <FilterBand
          query={filterQuery}
          onQueryChange={onFilterQueryChange}
          queryPlaceholder={filterPlaceholder}
          filters={filters}
          onClearAll={onClearFilters}
          hasClearable={hasClearable}
        >
          {filterChips}
        </FilterBand>
      )}

      {children}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
