import { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
  className?: string
  headerClass?: string
  widths?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
}

export default function Table<T>({ columns, data, keyExtractor, loading, emptyMessage, onRowClick }: TableProps<T>) {
  if (loading) {
    return (
      <div className="overflow-x-auto rounded-md border border-[var(--border)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#F8FAFB]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-[var(--font-body)] text-xs font-semibold uppercase tracking-[0.5px] text-[#52525B] ${col.headerClass || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-4">
                    <div className="skeleton h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="py-16 text-center rounded-md border border-[var(--border)] bg-white">
        <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)]">
          {emptyMessage || 'No data available'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#F8FAFB]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left font-[var(--font-body)] text-xs font-semibold uppercase tracking-[0.5px] text-[#52525B] border-b border-[var(--border)] ${col.headerClass || ''}`}
                style={col.widths ? { width: col.widths } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`
                border-t border-[var(--border)]
                transition-colors duration-150
                ${onRowClick ? 'cursor-pointer' : ''}
                ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFBFC]'}
                hover:bg-[#F4F4F5]
              `}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3.5 font-[var(--font-body)] text-sm text-[var(--text)] align-middle ${col.className || ''}`}
                >
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
