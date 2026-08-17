import { LucideIcon } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <Icon size={48} color="var(--text-muted)" strokeWidth={1.5} />
      )}
      <h3 className="font-[var(--font-body)] font-medium text-[1.3125rem] text-[var(--text)] text-center mt-6">
        {title}
      </h3>
      {description && (
        <p className="font-[var(--font-body)] text-base text-[var(--text-sub)] text-center mt-2 max-w-md">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
