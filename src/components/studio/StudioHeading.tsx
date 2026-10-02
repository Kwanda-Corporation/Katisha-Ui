import { ReactNode } from 'react'

export type StudioHeadingSize = 'page' | 'section' | 'card'

interface StudioHeadingProps {
  children: ReactNode
  className?: string
  /** Center the heading (default true, matching the booking page). */
  centered?: boolean
  size?: StudioHeadingSize
  /** Render the hand-drawn highlighter marker behind the text. */
  marker?: boolean
  /** Show the sparkle accent (page-level headings only). */
  sparkles?: boolean
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div'
}

/**
 * StudioHeading — the shared dashboard heading.
 *
 * Reproduces the booking page's highlighter-marker capsule + dot texture
 * (see BookingWizard's HighlightWord) so every dashboard title shares the
 * exact same look, without modifying the booking page itself.
 */
export default function StudioHeading({
  children,
  className = '',
  centered = true,
  size = 'page',
  marker = true,
  sparkles = false,
  as: Tag = 'h2',
}: StudioHeadingProps) {
  const sizeClasses: Record<StudioHeadingSize, string> = {
    page: 'font-semibold text-2xl sm:text-3xl lg:text-4xl text-[var(--studio-text)]',
    section: 'font-semibold text-xl sm:text-2xl text-[var(--studio-text)]',
    card: 'font-semibold text-base sm:text-lg text-[var(--studio-text)]',
  }

  const dot = 'absolute rounded-full bg-sky-400/70'
  const wrapClass = centered ? 'flex justify-center items-center' : 'flex items-center'

  return (
    <div className={`${wrapClass} ${className}`}>
      <div className="relative isolate inline-block">
        {sparkles && (
          <Sparkles className="pointer-events-none absolute -top-6 -left-9 h-8 w-16 text-[var(--studio-accent)]" />
        )}
        <Tag className={`${sizeClasses[size]} text-center`}>
          {marker ? (
            <span className="relative inline-block px-2">
              <span
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 top-[6%] h-[52%] w-[85%] sm:w-[105%] -z-10 -rotate-1 rounded-full overflow-hidden bg-blue-100"
              >
                <span className={`${dot} w-1 h-1 left-[12%] top-[30%]`} />
                <span className={`${dot} w-1.5 h-1.5 left-[42%] top-[55%]`} />
                <span className={`${dot} w-1 h-1 left-[68%] top-[20%]`} />
                <span className={`${dot} w-1 h-1 left-[86%] top-[60%]`} />
              </span>
              <span
                aria-hidden="true"
                className="absolute left-1/2 -translate-x-1/2 bottom-[6%] h-[40%] w-[55%] sm:w-[70%] -z-10 rotate-2 rounded-full overflow-hidden bg-blue-100"
              >
                <span className={`${dot} w-1 h-1 left-[20%] top-[35%]`} />
                <span className={`${dot} w-1.5 h-1.5 left-[62%] top-[50%]`} />
              </span>
              <span className="relative">{children}</span>
            </span>
          ) : (
            children
          )}
        </Tag>
      </div>
    </div>
  )
}

function Sparkles({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 60" fill="none" aria-hidden="true">
      <path d="M18 30 L22 18 L26 30 L38 34 L26 38 L22 50 L18 38 L6 34 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M78 14 L81 6 L84 14 L92 17 L84 20 L81 28 L78 20 L70 17 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M96 40 L98 34 L100 40 L106 42 L100 44 L98 50 L96 44 L90 42 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="12" r="2" fill="currentColor" />
    </svg>
  )
}
