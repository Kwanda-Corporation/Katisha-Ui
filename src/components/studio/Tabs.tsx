import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export default function Tabs({ tabs, activeTab, onTabChange, className = '' }: TabsProps) {
  return (
    <div className={className}>
      <div className="border-b border-[var(--studio-border)]">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
