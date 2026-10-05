import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface StudioPaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * StudioPagination — the shared pager for Studio tables.
 *
 * Replaces the legacy `ui/Pagination`, which rendered hardcoded English
 * ("N records", "Showing 1–20") and depended on the retired
 * `--border` / `--text-sub` tokens.
 */
export default function StudioPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className = '',
}: StudioPaginationProps) {
  const { t } = useTranslation()

  if (totalPages <= 1) return null

  const safePage = Math.min(Math.max(page, 1), totalPages)
  const from = (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  const pages: number[] = []
  const start = Math.max(1, Math.min(safePage - 2, totalPages - 4))
  for (let i = start; i <= Math.min(start + 4, totalPages); i++) pages.push(i)

  const pill =
    'h-8 min-w-[32px] px-2 inline-flex items-center justify-center text-xs font-semibold border cursor-pointer transition-colors disabled:opacity-35 disabled:cursor-default'
  const activePill = `${pill} bg-[var(--studio-accent)] text-white border-[var(--studio-accent)]`
  const idlePill = `${pill} bg-[var(--studio-surface)] text-[var(--studio-text-sub)] border-[var(--studio-border)] hover:bg-[var(--studio-muted-fill)]`

  return (
    <div
      className={`flex items-center justify-between flex-wrap gap-3 pt-4 mt-1 border-t border-[var(--studio-border)] ${className}`}
    >
      <p className="text-xs text-[var(--studio-text-muted)]">
        {t('studio.showingOf', { from, to, total })}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label={t('studio.previousPage')}
          className={idlePill}
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === safePage ? 'page' : undefined}
            className={p === safePage ? activePill : idlePill}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          aria-label={t('studio.nextPage')}
          className={idlePill}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
