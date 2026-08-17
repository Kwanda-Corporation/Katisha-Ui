interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export default function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex border-b border-[var(--border)] ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            py-3 mr-6
            font-[var(--font-body)] text-[0.9375rem] font-medium
            border-b-2 transition-colors duration-200
            ${active === tab.id
              ? 'text-[var(--text)] border-b-[var(--blue)]'
              : 'text-[var(--text-sub)] border-b-transparent hover:text-[var(--text)]'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 text-xs text-[var(--text-muted)]">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
