import { HTMLAttributes } from 'react'

type BadgeColor =
  | 'blue' | 'blueDark' | 'info' | 'warning' | 'error'
  | 'pendingAgent' | 'awaiting' | 'expired' | 'paid'
  | 'uploaded' | 'departed' | 'completed' | 'cancelled'

const colorMap: Record<BadgeColor, { bg: string; text: string }> = {
  blue:         { bg: 'rgba(29, 78, 216,0.12)',  text: '#1D4ED8' },
  blueDark:     { bg: 'rgba(30,64,175,0.12)', text: '#1E40AF' },
  info:         { bg: 'rgba(29,78,216,0.12)', text: '#1D4ED8' },
  warning:      { bg: 'rgba(217,119,6,0.12)',  text: '#D97706' },
  error:        { bg: 'rgba(220,38,38,0.12)',  text: '#DC2626' },
  pendingAgent: { bg: 'rgba(124,58,237,0.12)', text: '#7C3AED' },
  awaiting:     { bg: 'rgba(217,119,6,0.12)',  text: '#D97706' },
  expired:      { bg: 'rgba(220,38,38,0.12)',  text: '#DC2626' },
  paid:         { bg: 'rgba(29,78,216,0.12)',  text: '#1D4ED8' },
  uploaded:     { bg: 'rgba(124,58,237,0.12)', text: '#7C3AED' },
  departed:     { bg: 'rgba(29, 78, 216,0.12)',  text: '#1D4ED8' },
  completed:    { bg: 'rgba(30,64,175,0.12)', text: '#1E40AF' },
  cancelled:    { bg: 'rgba(82,82,91,0.12)',text: '#52525B' },
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
  dot?: boolean
}

export default function Badge({ color = 'blue', dot, children, className = '', ...props }: BadgeProps) {
  const c = colorMap[color]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm font-[var(--font-body)] text-xs font-medium ${className}`}
      style={{ backgroundColor: c.bg, color: c.text }}
      {...props}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: c.text }}
        />
      )}
      {children}
    </span>
  )
}
