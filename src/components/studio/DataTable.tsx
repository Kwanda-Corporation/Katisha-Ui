import { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyState?: ReactNode
  className?: string
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyState,
  className = '',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return emptyState || null
  }

  return (
    <div className={overflow-x-auto border border-[var(--studio-border)] rounded-lg bg-[var(--studio-surface)] }>
      <table className="w-full divide-y divide-[var(--studio-border)]">
        <thead className="bg-[var(--studio-surface-sub)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-sub)] }
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--studio-border)] bg-white">
          {data.map((row, index) => (
            <tr key={row.id || index} className="hover:bg-gray-50/50">
              {columns.map((column) => (
                <td key={column.key} className={px-4 py-3 text-sm text-[var(--text)] }>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
