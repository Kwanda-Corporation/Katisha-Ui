import { ReactNode } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

type BannerVariant = 'info' | 'warning' | 'error' | 'success'

interface BannerProps {
  variant?: BannerVariant
  children: ReactNode
  className?: string
}

const config: Record<BannerVariant, { bg: string; border: string; text: string; Icon: typeof Info }> = {
  info:    { bg: '#F4F4F5', border: '#E4E4E7', text: '#064187', Icon: Info },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', Icon: AlertTriangle },
  error:   { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', Icon: AlertCircle },
  success: { bg: '#064187', border: '#E4E4E7', text: '#FFFFFF', Icon: CheckCircle },
}

export default function Banner({ variant = 'info', children, className = '' }: BannerProps) {
  const c = config[variant]
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-md ${className}`}
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <c.Icon size={16} className="flex-shrink-0 mt-0.5" />
      <div className="font-[var(--font-body)] text-sm flex-1">{children}</div>
    </div>
  )
}
