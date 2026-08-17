import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
}

export default function Pagination({ page, totalPages, total = 0, onPageChange, pageSize: pageSizeProp }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  const maxVisible = 5;
  const start = Math.max(1, Math.min(page - 2, totalPages - maxVisible + 1));
  for (let i = start; i <= Math.min(start + maxVisible - 1, totalPages); i++) {
    pages.push(i);
  }

  const pageSize = pageSizeProp || 20;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
      <p className="text-sm text-[var(--text-sub)]">
        {total.toLocaleString()} record{total !== 1 ? 's' : ''}
        <span className="text-[var(--text-muted)] ml-2">(Showing {from}–{to})</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-8 px-3 rounded-sm border border-[var(--border)] text-sm font-medium disabled:opacity-40 bg-white cursor-pointer disabled:cursor-default hover:bg-[#F9FAFB] transition-colors"
        >
          Previous
        </button>
        {pages.map((p, i) => (
          <button
            key={`${p}-${i}`}
            onClick={() => typeof p === 'number' ? onPageChange(p) : undefined}
            disabled={p === '...'}
            className={`h-8 min-w-[2rem] px-2 rounded-sm text-sm font-medium cursor-pointer border transition-colors ${
              p === page
                ? 'bg-[var(--blue)] text-white border-[var(--blue)]'
                : p === '...'
                ? 'bg-white text-[var(--text-muted)] border-transparent cursor-default'
                : 'bg-white text-[var(--text)] border-[var(--border)] hover:border-[var(--blue)]'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="h-8 px-3 rounded-sm border border-[var(--border)] text-sm font-medium disabled:opacity-40 bg-white cursor-pointer disabled:cursor-default hover:bg-[#F9FAFB] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
