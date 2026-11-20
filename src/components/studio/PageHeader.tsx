import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  /** Right-aligned actions (circular icon buttons, soft pills, menus). */
  actions?: ReactNode
  /**
   * `row`  — 56px title row (default).
   * `band` — same row; kept for backwards compatibility with earlier templates.
   */
  variant?: 'row' | 'band'
  className?: string
}

/**
 * PageHeader — the single page-title primitive for every dashboard page.
 * Title is always 24px / 700 (`.vdk-title`), vertically centered in a 56px
 * row. On phones the row wraps so a long title and its actions never overlap.
 * Content respects the page gutter; nothing is ever clipped.
 */
export default function PageHeader({ title, actions, variant = 'row', className = '' }: PageHeaderProps) {
  void variant
  return (
    <div className={`vdk-title-row vdk-gutter-x flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 sm:py-0 ${className}`}>
      <h1 className="vdk-title min-w-0 flex-1 break-words line-clamp-2 sm:line-clamp-none sm:truncate" title={title}>{title}</h1>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2 shrink-0 ml-auto">{actions}</div>}
    </div>
  )
}
