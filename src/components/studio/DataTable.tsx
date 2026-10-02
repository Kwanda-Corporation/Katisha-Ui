import { ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'

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
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  /** Stable row key extractor. Defaults to row.id / row._id / index. */
  getRowId?: (row: T, index: number) => string
  emptyState?: ReactNode
  className?: string
  /** Enables the select-all + per-row checkboxes. */
  selectable?: boolean
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

export default function DataTable<T>({
  columns,
  data,
  getRowId,
  emptyState,
  className = '',
  selectable = false,
  bulkActions,
  onSelectionChange,
  onRowClick,
  loading = false,
  skeletonRows = 5,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
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

  const allIds = useMemo(() => rows.map((r, i) => rowIdOf(r, i, getRowId)), [rows, getRowId])
  const allSelected = allIds.length > 0 && selected.length === allIds.length
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
      setSortDir('asc')
    }
  }

  if (!loading && rows.length === 0) {
    return <>{emptyState || null}</>
  }

  const alignClass = (a?: Column<T>['align']) =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left'

  return (
    <div className={className}>
      {selectable && selected.length > 0 && bulkActions && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 mb-2 rounded-xl bg-[var(--studio-accent-soft)] border border-[var(--studio-border)]">
          {bulkActions(selected)}
        </div>
      )}
      <div className="overflow-x-auto border border-[var(--studio-border)] rounded-2xl bg-[var(--studio-surface)]">
        <table className="w-full divide-y divide-[var(--studio-border)]">
          <thead className="bg-[var(--studio-surface-sub)]">
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={t('studio.selectAllRows')}
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected }}
                    onChange={(e) => emitSelection(e.target.checked ? allIds : [])}
                    className="cursor-pointer accent-[var(--studio-accent)]"
                  />
                </th>
              )}
              {columns.map((column) => {
                const active = sortKey === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-4 py-3 text-xs uppercase tracking-wider text-[var(--studio-text-sub)] ${alignClass(column.align)} ${active ? 'font-bold text-[var(--studio-text)]' : 'font-medium'} ${column.headerClassName || ''}`}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className={`inline-flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 ${alignClass(column.align)}`}
                        aria-label={t('studio.sortBy', { column: column.header })}
                      >
                        {column.header}
                        {active
                          ? (sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)
                          : <ChevronsUpDown size={13} className="opacity-40" />}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--studio-border)] bg-white">
            {loading
              ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`}>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 ${alignClass(column.align)} ${column.className || ''}`}
                      >
                        <span
                          className="block h-4 rounded bg-[var(--studio-muted-fill)] animate-pulse"
                          style={{ width: `${55 + ((rowIndex + column.key.length) % 3) * 15}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, index) => {
                  const id = rowIdOf(row, index, getRowId)
                  const checked = selected.includes(id)
                  return (
                    <tr
                      key={id}
                      className={`hover:bg-[var(--studio-surface-sub)] ${onRowClick ? 'cursor-pointer' : ''} ${checked ? 'bg-[var(--studio-accent-soft)]' : ''}`}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row) } : undefined}
                    >
                      {selectable && (
                        <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={t('studio.selectRow')}
                            checked={checked}
                            onChange={(e) => {
                              emitSelection(e.target.checked ? [...selected, id] : selected.filter((s) => s !== id))
                            }}
                            className="cursor-pointer accent-[var(--studio-accent)]"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-4 py-3 text-sm text-[var(--studio-text)] ${alignClass(column.align)} ${column.className || ''}`}
                        >
                          {column.render ? column.render(row) : ((row as Record<string, unknown>)[column.key] as ReactNode)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
