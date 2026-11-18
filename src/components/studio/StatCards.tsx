export interface StatItem {
  label: string
  value: string | number
  caption?: string
  /** 0–100; renders a 4px progress bar under the value. */
  progress?: number
  progressCaption?: string
}

/**
 * StatCards — the single addition to the Audio-library listing design: a row of
 * equal-width stat cards (1px frame, 16px radius, no shadow, not clickable).
 * Collapses to 2 columns below 1000px and 1 column below 600px.
 */
export default function StatCards({ items, className = '' }: { items: StatItem[]; className?: string }) {
  if (!items.length) return null
  return (
    <div className={`vdk-stat-grid vdk-gutter-x ${className}`}>
      {items.map((item, i) => (
        <div className="vdk-stat" key={item.label + i}>
          <span className="text-[13px] leading-4 text-[var(--studio-text-sub)]">{item.label}</span>
          <span className="mt-1 break-words text-[22px] font-bold leading-7 text-[var(--studio-text)] sm:text-[28px] sm:leading-8">{item.value}</span>
          {typeof item.progress === 'number' && (
            <div className="vdk-progress mt-2" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} />
            </div>
          )}
          {item.caption && <span className="mt-1 text-xs leading-4 text-[var(--studio-text-sub)]">{item.caption}</span>}
          {item.progressCaption && <span className="mt-1 text-xs leading-4 text-[var(--studio-text-sub)]">{item.progressCaption}</span>}
        </div>
      ))}
    </div>
  )
}
