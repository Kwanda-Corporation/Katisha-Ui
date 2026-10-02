import { ReactNode } from 'react'

interface StudioCardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export default function StudioCard({ children, className = '', padding = 'md' }: StudioCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  return (
    <div
      className={g-[var(--studio-surface)] border border-[var(--studio-border)] rounded-lg shadow-sm  }
    >
      {children}
    </div>
  )
}
