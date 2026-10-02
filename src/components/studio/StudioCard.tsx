import { ReactNode } from 'react'

interface StudioCardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'section' | 'article'
}

const paddingClasses: Record<NonNullable<StudioCardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

export default function StudioCard({
  children,
  className = '',
  padding = 'md',
  as: Tag = 'div',
}: StudioCardProps) {
  return (
    <Tag
      className={`bg-[var(--studio-surface)] border border-[var(--studio-border)] rounded-2xl ${paddingClasses[padding]} ${className}`}
      style={{ borderRadius: 'var(--studio-radius-card)' }}
    >
      {children}
    </Tag>
  )
}
