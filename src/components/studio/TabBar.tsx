import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { TabItem } from './Tabs'

interface TabBarProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  /** Optional right-aligned slot (e.g. a date-range picker) inside the gutter. */
  right?: ReactNode
  className?: string
  ariaLabel?: string
}

/**
 * TabBar — full-bleed tab band: 48px tall, 1px bottom hairline, tabs 15px/500
 * with 40px gaps, the first label starting at the page gutter, and a 2px ink
 * underline exactly as wide as the active label. Optional counts render as a
 * 13px/400 muted number 6px after the label.
 */
export default function TabBar({
  tabs,
  activeTab,
  onTabChange,
  right,
  className = '',
  ariaLabel,
}: TabBarProps) {
  const { t } = useTranslation()
  const listLabel = ariaLabel ?? t('studio.tabs')
  return (
    <div className={`vdk-band flex flex-col sm:flex-row sm:items-stretch sm:h-12 pl-4 pr-4 md:pl-6 md:pr-6 xl:pl-8 xl:pr-8 ${className}`}>
      <nav
        role="tablist"
        aria-label={listLabel}
        className="flex h-12 flex-1 min-w-0 items-stretch gap-6 overflow-x-auto no-scrollbar sm:gap-10"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={`h-full inline-flex items-center whitespace-nowrap text-[15px] font-medium bg-transparent cursor-pointer transition-colors ${
                active ? 'text-[var(--studio-text)]' : 'text-[var(--studio-text-sub)] hover:text-[var(--studio-text)]'
              }`}
              style={active ? { boxShadow: 'inset 0 -2px 0 var(--studio-text)' } : undefined}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="ml-1.5 text-[13px] font-normal text-[var(--studio-text-muted)]">{tab.count}</span>
              )}
            </button>
          )
        })}
      </nav>
      {right && (
        <div className="flex max-w-full flex-wrap items-center justify-end gap-3 pb-2 sm:shrink-0 sm:pb-0 sm:pl-3">
          {right}
        </div>
      )}
    </div>
  )
}
