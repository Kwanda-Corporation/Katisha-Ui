import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import Button from '../ui/Button'

export type EmptyStateVariant = 'no-content' | 'start-searching'

const VARIANT_SRC: Record<EmptyStateVariant, string> = {
  'no-content': '/youtube_graphic_no_content_illustration_v4.svg',
  'start-searching': '/youtube_graphic_start_searching_dark.svg',
}

interface EmptyStateProps {
  /** Message shown under the illustration (also the default alt text). */
  title: string
  description?: string
  /** Named illustration variant from the `youtube graphic` assets. */
  variant?: EmptyStateVariant
  /** Override with an explicit SVG path. */
  svgSrc?: string
  /** Translated alt text for the illustration. */
  svgAlt?: string
  icon?: LucideIcon
  /** Solid pill CTA. */
  actionLabel?: string
  onAction?: () => void
  /** Render any custom CTA instead of actionLabel. */
  cta?: ReactNode
  className?: string
}

/**
 * EmptyState — shared empty / not-found state used across admin, agent and
 * promoter dashboards. Illustrations come from the `youtube graphic` assets
 * (served from /public), lazily loaded with translated alt text.
 */
export default function EmptyState({
  title,
  description,
  variant,
  svgSrc,
  svgAlt,
  icon: Icon,
  actionLabel,
  onAction,
  cta,
  className = '',
}: EmptyStateProps) {
  const showIllustration = Boolean(svgSrc || variant)
  const src = svgSrc || (variant ? VARIANT_SRC[variant] : VARIANT_SRC['no-content'])

  return (
    <div className={`flex flex-col items-center justify-center py-14 px-4 text-center ${className}`}>
      {showIllustration ? (
        <img
          src={src}
          alt={svgAlt || title}
          loading="lazy"
          decoding="async"
          width={260}
          height={260}
          className="w-44 h-44 sm:w-60 sm:h-60 object-contain mb-4 select-none"
        />
      ) : (
        Icon && <Icon size={48} className="text-[var(--studio-text-muted)] mb-4" strokeWidth={1.5} aria-hidden="true" />
      )}
      <h3 className="text-lg font-semibold text-[var(--studio-text)]">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--studio-text-sub)] mt-1.5 max-w-md">{description}</p>
      )}
      {cta ? (
        <div className="mt-5">{cta}</div>
      ) : (
        actionLabel && onAction ? (
          <div className="mt-5">
            <Button onClick={onAction} className="!rounded-full">{actionLabel}</Button>
          </div>
        ) : null
      )}
    </div>
  )
}
