import { ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  content?: ReactNode
  count?: number
}

interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
  /** Optional aria label for the tablist. */
  ariaLabel?: string
  /** Render the active tab's content below the tab bar. */
  renderContent?: boolean
}

/**
 * Tabs — horizontal tabs with an underline on the active tab
 * (YouTube Studio "Content" tab pattern).
 */
export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  ariaLabel = 'Tabs',
  renderContent = false,
}: TabsProps) {
  return (
    <div className={className}>
      <div className="border-b border-[var(--studio-border)]">
        <nav className="-mb-px flex gap-6 overflow-x-auto no-scrollbar" aria-label={ariaLabel} role="tablist">
          {tabs.map((tab) => {
            const active = tab.id === activeTab
            const tabClass = active
              ? 'border-[var(--studio-accent)] font-semibold text-[var(--studio-text)]'
              : 'border-transparent font-medium text-[var(--studio-text-sub)] hover:text-[var(--studio-text)]'
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTabChange(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm transition-colors cursor-pointer bg-transparent ${tabClass}`}
              >
                {tab.label}
                {typeof tab.count === 'number' && (
                  <span className="ml-1.5 text-xs text-[var(--studio-text-muted)]">{tab.count}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
      {renderContent && (
        <div className="pt-4">
          {tabs.find((t) => t.id === activeTab)?.content}
        </div>
      )}
    </div>
  )
}
