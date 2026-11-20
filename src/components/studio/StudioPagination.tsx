import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface StudioPaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

/**
 * StudioPagination — right-aligned list-page footer (56px): “Rows per page 10 ▾
 * 1-10 of 240 ‹ ›”, 13px muted. Kept deliberately plain.
 */
export default function StudioPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className = '',
}: StudioPaginationProps) {
  const { t } = useTranslation()
  const [sizeOpen, setSizeOpen] = useState(false)

  if (totalPages <= 1 && !onPageSizeChange) return null

  const safePage = Math.min(Math.max(page, 1), Math.max(totalPages, 1))
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-end sm:gap-4 min-h-14 py-2 vdk-gutter-x text-[13px] text-[var(--studio-text-sub)] ${className}`}>
      {onPageSizeChange && (
        <div className="relative flex items-center gap-1.5">
          <span className="hidden sm:inline">{t('studio.rowsPerPage', 'Rows per page')}</span>
          <button
            type="button"
            onClick={() => setSizeOpen((v) => !v)}
            className="inline-flex items-center gap-1 cursor-pointer hover:text-[var(--studio-text)]"
            aria-haspopup="listbox"
            aria-expanded={sizeOpen}
            aria-label={t('studio.rowsPerPage', 'Rows per page')}
          >
            {pageSize}
            <ChevronDown size={14} />
          </button>
          {sizeOpen && (
            <div
              role="listbox"
              className="absolute bottom-full right-0 mb-2 py-1 z-[970] bg-[var(--studio-surface)] border border-[var(--studio-border)] rounded-[var(--studio-radius-pop)] shadow-[var(--studio-shadow-pop)] min-w-[80px]"
            >
              {pageSizeOptions.map((opt) => (
                <button
                  key={opt}
                  role="option"
                  aria-selected={opt === pageSize}
                  type="button"
                  onClick={() => { setSizeOpen(false); onPageSizeChange(opt) }}
                  className="block w-full px-3 py-1.5 text-[13px] text-left text-[var(--studio-text)] hover:bg-[var(--studio-muted-fill)] cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <span>{t('studio.rangeOf', '{{from}}-{{to}} of {{total}}', { from, to, total })}</span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label={t('studio.previousPage')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--studio-muted-fill)] disabled:opacity-35 disabled:cursor-default cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(Math.max(totalPages, 1), safePage + 1))}
          disabled={safePage >= Math.max(totalPages, 1)}
          aria-label={t('studio.nextPage')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--studio-muted-fill)] disabled:opacity-35 disabled:cursor-default cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
