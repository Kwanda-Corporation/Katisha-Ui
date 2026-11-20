import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import PillButton from './PillButton'
import StickerIllustration, { StickerKind } from './StickerIllustration'

export type EmptyStateVariant = 'no-content' | 'start-searching'

interface EmptyStateProps {
  /** Message shown under the illustration (also the default alt text). */
  title: string
  description?: string
  /** Named illustration variant (legacy). */
  variant?: EmptyStateVariant
  /** Original flat sticker illustration for this page family. */
  illustration?: StickerKind
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
  /** Center within a list-page empty area (min-height 360px). */
  fill?: boolean
  className?: string
}

/** Original STRS empty-state illustration (~180px). */
function EmptyIllustration({ searching }: { searching?: boolean }) {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden="true"
      className="mb-4 select-none"
    >
      <circle cx="90" cy="90" r="72" fill="var(--studio-muted-fill)" />
      <rect x="52" y="58" width="76" height="52" rx="8" stroke="var(--studio-text-muted)" strokeWidth="3" fill="var(--studio-surface)" />
      <path d="M52 74h76" stroke="var(--studio-text-muted)" strokeWidth="3" />
      <circle cx="62" cy="66" r="3" fill="var(--studio-accent)" />
      <circle cx="72" cy="66" r="3" fill="var(--studio-text-muted)" opacity="0.5" />
      {searching ? (
        <>
          <circle cx="112" cy="104" r="18" stroke="var(--studio-accent)" strokeWidth="4" fill="var(--studio-surface)" />
          <path d="M124 116l12 12" stroke="var(--studio-accent)" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M70 92h14M94 92h16" stroke="var(--studio-text-muted)" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          <path d="M70 102h24" stroke="var(--studio-text-muted)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        </>
      )}
    </svg>
  )
}

/**
 * EmptyState — shared empty / not-found state used across admin, agent and
 * promoter dashboards. Uses an original illustration (no YouTube assets).
 */
export default function EmptyState({
  title,
  description,
  variant,
  illustration,
  svgSrc,
  svgAlt,
  icon: Icon,
  actionLabel,
  onAction,
  cta,
  fill = false,
  className = '',
}: EmptyStateProps) {
  const showIllustration = Boolean(svgSrc || variant || illustration)

  return (
    <div
      className={`flex flex-col items-center justify-center py-14 px-4 text-center ${fill ? 'min-h-[360px]' : ''} ${className}`}
    >
      {showIllustration ? (
        svgSrc ? (
          <img
            src={svgSrc}
            alt={svgAlt || title}
            loading="lazy"
            decoding="async"
            width={200}
            height={200}
            className="w-[200px] h-[200px] object-contain mb-4 select-none"
          />
        ) : illustration ? (
          <div className="mb-2">
            <StickerIllustration kind={illustration} />
          </div>
        ) : (
          <EmptyIllustration searching={variant === 'start-searching'} />
        )
      ) : (
        Icon && <Icon size={48} className="text-[var(--studio-text-muted)] mb-4" strokeWidth={1.5} aria-hidden="true" />
      )}
      <p className="text-sm font-medium leading-5 text-[var(--studio-text)] max-w-md">{title}</p>
      {description && (
        <p className="text-sm leading-5 text-[var(--studio-text-sub)] mt-1.5 max-w-md">{description}</p>
      )}
      {cta ? (
        <div className="mt-5">{cta}</div>
      ) : (
        actionLabel && onAction ? (
          <div className="mt-5">
            <PillButton variant="soft" size="md" onClick={onAction}>
              {actionLabel}
            </PillButton>
          </div>
        ) : null
      )}
    </div>
  )
}
