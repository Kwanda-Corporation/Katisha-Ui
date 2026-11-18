import { ReactNode, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, X } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  /** Enables client-side sorting for this column. */
  sortable?: boolean
  /** Optional value extractor used for sorting (defaults to row[key]). */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  className?: string
  headerClassName?: string
  /** Hides this column below the md breakpoint (list-page mobile rule). */
  hideOnMobile?: boolean
  /** Initial sort direction when this is the default sorted column. */
  defaultSort?: 'asc' | 'desc'
  /** Suppress the automatic title tooltip for plain-text cells. */
  noTooltip?: boolean
  /**
   * Wrap long values across lines instead of clipping them with an ellipsis.
   * Use for crucial columns (names, routes) that must always be fully visible.
   */
  wrap?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  /** Stable row key extractor. Defaults to row.id / row._id / index. */
  getRowId?: (row: T, index: number) => string
  emptyState?: ReactNode
  className?: string
  /** Enables the select-all + per-row checkboxes (only where bulk actions exist). */
  selectable?: boolean
  /** Disable selection for rows that are already completed/final. */
  isRowSelectable?: (row: T) => boolean
  /** Renders bulk actions when one or more rows are selected. */
  bulkActions?: (selectedIds: string[]) => ReactNode
  onSelectionChange?: (selectedIds: string[]) => void
  /** Row click handler; if provided the row is keyboard-focusable. */
  onRowClick?: (row: T) => void
  loading?: boolean
  /** Placeholder rows rendered while `loading` is true. */
  skeletonRows?: number
}

function rowIdOf<T>(row: T, index: number, getRowId?: (row: T, index: number) => string): string {
  if (getRowId) return getRowId(row, index)
  const r = row as Record<string, unknown>
  return String(r.id ?? r._id ?? index)
}

/** Leading list cell: 32px avatar / icon tile + primary text (500). */
export function EntityCell({
  avatar,
  icon,
  title,
  subtitle,
  round = false,
  wrap = false,
}: {
  avatar?: ReactNode
  icon?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  /** Round avatar (people) vs 8px rounded square (things). */
  round?: boolean
  /** Wrap the title/subtitle instead of clipping with an ellipsis. */
  wrap?: boolean
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {(avatar || icon) && (
        <span
          className={`w-8 h-8 shrink-0 flex items-center justify-center overflow-hidden text-[var(--studio-text)] ${
            round ? 'rounded-full text-white' : 'rounded-lg bg-[var(--studio-muted-fill)]'
          }`}
          style={round ? { background: 'var(--studio-accent)' } : undefined}
        >
          {avatar || icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-medium text-[var(--studio-text)] ${wrap ? 'whitespace-normal break-words' : 'truncate'}`}
          title={!wrap && typeof title === 'string' ? title : undefined}
        >
          {title}
        </span>
        {subtitle !== undefined && (
          <span className={`block text-xs text-[var(--studio-text-muted)] ${wrap ? 'whitespace-normal break-words' : 'truncate'}`}>
            {subtitle}
          </span>
        )}
      </span>
    </div>
  )
}

export default function DataTable<T>({
  columns,
  data,
  getRowId,
  emptyState,
  className = '',
  selectable = false,
  isRowSelectable,
  bulkActions,
  onSelectionChange,
  onRowClick,
  loading = false,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const defaultCol = columns.find((c) => c.defaultSort)
  const [sortKey, setSortKey] = useState<string | null>(defaultCol?.key ?? null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultCol?.defaultSort ?? 'asc')
  const [selected, setSelected] = useState<string[]>([])

  const rows = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find((c) => c.key === sortKey)
    if (!col) return data
    const valueOf = (row: T) => {
      if (col.sortValue) return col.sortValue(row)
      return (row as Record<string, unknown>)[col.key] as string | number
    }
    return [...data].sort((a, b) => {
      const av = valueOf(a)
      const bv = valueOf(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
  }, [data, columns, sortKey, sortDir])

  const selectableIds = useMemo(
    () =>
      rows.reduce<string[]>((ids, row, index) => {
        if (!isRowSelectable || isRowSelectable(row)) {
          ids.push(rowIdOf(row, index, getRowId))
        }
        return ids;
      }, []),
    [rows, getRowId, isRowSelectable],
  )
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.includes(id))
  const someSelected = selected.length > 0 && !allSelected

  const emitSelection = (next: string[]) => {
    setSelected(next)
    onSelectionChange?.(next)
  }

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortKey(null); setSortDir('asc') }
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (!loading && rows.length === 0) {
    return <>{emptyState || null}</>
  }

  const alignClass = (a?: Column<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

  const hideCls = (c: Column<T>) => (c.hideOnMobile ? 'hidden md:table-cell' : '')

  /** Horizontal padding — 16px between cells, page gutter on the outer edges. */
  const edgePad = (index: number) => {
    const isFirstData = index === 0
    const isLast = index === columns.length - 1
    // Phones get slightly tighter cell padding so more of the row is readable.
    const left = isFirstData ? (selectable ? 'pl-2 md:pl-4' : 'vdk-pl') : 'pl-3 md:pl-4'
    const right = isLast ? 'vdk-pr' : 'pr-3 md:pr-4'
    return `${left} ${right}`
  }

  // On phones the table keeps a readable minimum width and scrolls sideways
  // (keeping every column at a legible size) instead of squeezing the text.
  // From `md` up the CSS drops the minimum and it fills the page again.
  const visibleColumnCount = columns.filter((c) => !c.hideOnMobile).length + (selectable ? 1 : 0)
  const tableMinWidth = Math.max(380, Math.min(1120, visibleColumnCount * 136))

  return (
    <div className={className}>
      {selectable && selected.length > 0 && bulkActions && (
        <div className="flex flex-wrap items-center gap-3 min-h-12 py-2 vdk-gutter-x vdk-band">
          <span className="text-sm font-medium text-[var(--studio-text)]">{t('studio.nSelected', { count: selected.length })}</span>
          {bulkActions(selected)}
          <button
            type="button"
            onClick={() => emitSelection([])}
            aria-label={t('studio.clearSelection')}
            className="ml-auto w-10 h-10 flex items-center justify-center rounded-full text-[var(--studio-text-sub)] hover:bg-[var(--studio-hover)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="vdk-table-scroll no-scrollbar">
        <table
          className="vdk-table w-full table-fixed border-collapse"
          style={{ '--vdk-table-min': `${tableMinWidth}px` } as CSSProperties}
        >
          <thead>
            <tr className="vdk-band h-10">
              {selectable && (
                <th className="vdk-cell-check vdk-pl w-[52px] md:w-[56px] pr-0 text-left">
                  <input
                    type="checkbox"
                    aria-label={t('studio.selectAllRows')}
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                    onChange={(e) => emitSelection(e.target.checked ? selectableIds : [])}
                    className="cursor-pointer accent-[var(--studio-accent)]"
                    style={{ width: 16, height: 16 }}
                  />
                </th>
              )}
              {columns.map((column, index) => {
                const active = sortKey === column.key
                const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : column.sortable ? 'none' : undefined
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={`h-10 text-[12px] md:text-[13px] ${active ? 'font-semibold text-[var(--studio-text)]' : 'font-medium text-[var(--studio-text-sub)]'} ${alignClass(column.align)} ${edgePad(index)} ${hideCls(column)} ${column.headerClassName || ''}`}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={`inline-flex max-w-full items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-[12px] md:text-[13px] ${alignClass(column.align)} ${active ? 'font-semibold text-[var(--studio-text)]' : 'text-[var(--studio-text-sub)]'}`}
                        aria-label={t('studio.sortBy', { column: column.header })}
                      >
                        <span className="truncate">{column.header}</span>
                        {active && (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                      </button>
                    ) : (
                      <span className={`block ${column.wrap ? 'whitespace-normal' : 'truncate'}`}>{column.header}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} className="h-[52px] vdk-row">
                    {selectable && <td className="vdk-cell-check vdk-pl w-[52px] md:w-[56px] pr-0" />}
                    {columns.map((column, index) => (
                      <td
                        key={column.key}
                        className={`${edgePad(index)} ${hideCls(column)} ${column.className || ''}`}
                      >
                        <span
                          className="vdk-skel"
                          style={{ width: `${55 + ((rowIndex + column.key.length) % 3) * 15}%`, height: 14 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, index) => {
                  const id = rowIdOf(row, index, getRowId)
                  const canSelect = isRowSelectable ? isRowSelectable(row) : true
                  const checked = canSelect && selected.includes(id)
                  return (
                    <tr
                      key={id}
                      className={`h-[52px] vdk-row ${onRowClick ? 'cursor-pointer' : ''} ${checked ? 'bg-[var(--studio-accent-soft)]' : ''}`}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row) } : undefined}
                    >
                      {selectable && (
                        <td className="vdk-cell-check vdk-pl w-[52px] md:w-[56px] pr-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={t('studio.selectRow')}
                            checked={checked}
                            disabled={!canSelect}
                            onChange={(e) => {
                              emitSelection(e.target.checked ? [...selected, id] : selected.filter((s) => s !== id))
                            }}
                            className="cursor-pointer accent-[var(--studio-accent)] disabled:cursor-not-allowed disabled:opacity-35"
                            style={{ width: 16, height: 16 }}
                          />
                        </td>
                      )}
                      {columns.map((column, index) => {
                        const raw = (row as Record<string, unknown>)[column.key]
                        const isText = column.render == null && (raw == null || typeof raw === 'string' || typeof raw === 'number')
                        return (
                          <td
                            key={column.key}
                            className={`text-[13px] md:text-sm text-[var(--studio-text)] align-middle ${alignClass(column.align)} ${edgePad(index)} ${hideCls(column)} ${column.className || ''}`}
                          >
                            {column.render ? (
                              column.render(row)
                            ) : column.noTooltip ? (
                              <span className={`block ${column.wrap ? 'whitespace-normal break-words' : 'truncate'}`}>{raw as ReactNode}</span>
                            ) : isText ? (
                              <span className={`block ${column.wrap ? 'whitespace-normal break-words' : 'truncate'}`} title={column.wrap || raw == null ? undefined : String(raw)}>
                                {raw == null || raw === '' ? '—' : (raw as ReactNode)}
                              </span>
                            ) : (
                              (raw as ReactNode)
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
