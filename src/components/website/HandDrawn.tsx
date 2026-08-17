import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/* Shared hand-drawn accent components (Odoo-style doodles)            */
/* Keep the site's blue / white / black palette.                       */
/* ------------------------------------------------------------------ */

export const SCRIPT_FONT = 'var(--font-script)';

/** A loose, asymmetric cluster of hand-drawn sparkle strokes. */
export function Sparkles({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    >
      <path d="M10 40 L22 32" />
      <path d="M30 12 Q34 26 30 40" />
      <path d="M46 6 L50 24" />
      <path d="M46 6 L52 4" />
      <circle cx="64" cy="10" r="1.6" fill={color} stroke="none" />
      <path d="M78 20 L74 34" />
      <path d="M92 14 L88 30" />
    </svg>
  );
}

/** A small comma-shaped squiggle used as a scattered ink accent. */
export function CommaSquiggle({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    >
      <path d="M24 6 Q 34 18 26 30 Q 20 38 12 36" />
      <circle cx="12" cy="36" r="1.6" fill={color} stroke="none" />
    </svg>
  );
}

/** A hand-drawn wavy underline, not perfectly straight. */
export function SquigglyUnderline({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 200 16"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
    >
      <path d="M3 10 Q 50 2, 100 8 T 197 6" />
    </svg>
  );
}

/** A curved, sketchy arrow used to connect a handwritten callout to a control. */
export function CurvedArrow({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 60 90"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M46 4 C 10 14, 6 44, 26 78" />
      <path d="M15 68 L 26 78 L 34 65" />
    </svg>
  );
}

/** A short hand-drawn arrow pointing up (toward a CTA button above). */
export function UpArrow({ className = '', color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 40 50"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 46 C 14 34, 8 26, 4 18" />
      <path d="M20 46 C 24 34, 30 26, 36 18" />
      <path d="M4 18 L 20 4 L 36 18" />
      <path d="M20 4 L 20 16" />
    </svg>
  );
}

/** Highlighter-marker swipe rendered behind a word — two overlapping rounded
 * capsule strokes, mimicking a real marker drawn twice by hand. */
export function HighlightWord({ children, className = 'bg-[var(--blue)]' }: { children: ReactNode; className?: string }) {
  return (
    <span className="relative inline-block px-2">
      <span
        aria-hidden="true"
        className={`absolute -inset-x-3 top-[6%] h-[52%] -z-10 -rotate-1 rounded-full ${className}`}
      />
      <span
        aria-hidden="true"
        className={`absolute -inset-x-2 bottom-[6%] h-[52%] -z-10 rotate-1 rounded-full ${className}`}
      />
      <span className="relative">{children}</span>
    </span>
  );
}

/** Large, soft organic wave divider between page sections. `flip` mirrors the
 * curve so consecutive dividers can alternate; `fill` uses the palette. */
export function WaveDivider({ className = '', flip = false, fill = 'currentColor' }: { className?: string; flip?: boolean; fill?: string }) {
  return (
    <svg
      viewBox="0 0 1440 110"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      fill={fill}
    >
      <path
        d={
          flip
            ? 'M0,110 C180,40 360,20 560,55 C760,90 980,105 1200,80 C1310,67 1390,58 1440,40 L1440,110 Z'
            : 'M0,0 C180,70 360,90 560,55 C760,20 980,5 1200,30 C1310,43 1390,52 1440,70 L1440,0 Z'
        }
      />
    </svg>
  );
}

/** Sticky-note style handwritten callout, connected to a UI element by a
 * curved sketchy arrow. Uses the site's blue palette (light tinted paper). */
export function StickyCallout({
  children,
  className = '',
  arrow = 'left',
  paperClass = 'bg-[rgba(29,78,216,0.08)] text-[var(--blue-dark)]',
  arrowClass = '',
}: {
  children: ReactNode;
  className?: string;
  arrow?: 'left' | 'right' | 'down' | 'none';
  paperClass?: string;
  arrowClass?: string;
}) {
  return (
    <div className={`relative inline-block ${className}`}>
      {arrow !== 'none' && (
        <CurvedArrow
          className={`pointer-events-none absolute -z-10 ${arrowClass} ${
            arrow === 'down'
              ? 'left-1/2 top-[92%] h-12 w-7 -translate-x-[70%] text-[var(--blue)]/50'
              : arrow === 'left'
                ? 'left-[-30px] top-[30%] h-12 w-7 -scale-x-100 text-[var(--blue)]/50'
                : 'right-[-30px] top-[30%] h-12 w-7 text-[var(--blue)]/50'
          }`}
        />
      )}
      <span
        className={`relative inline-block -rotate-[2deg] rounded-[6px] border border-dashed border-[var(--blue)]/40 px-3 py-1 ${paperClass}`}
        style={{ fontFamily: SCRIPT_FONT, fontSize: '1.05rem', lineHeight: 1.25 }}
      >
        {children}
      </span>
    </div>
  );
}

/** Circular profile photo with a small hand-drawn speech-bubble/smiley in the
 * top corner, italicized quote, and name/title attribution below. */
export function TestimonialCard({
  initials,
  quote,
  name,
  title,
  className = '',
}: {
  initials: string;
  quote: string;
  name: string;
  title: string;
  className?: string;
}) {
  return (
    <figure className={`relative rounded-[14px] border border-[var(--border)] bg-white p-5 sm:p-6 ${className}`}>
      <div className="flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--blue)] text-[15px] font-bold text-white">
            {initials}
          </div>
          <svg
            viewBox="0 0 32 32"
            className="absolute -right-1.5 -top-1.5 h-6 w-6 text-[var(--blue)]"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 5 C 8 5 3 10 3 16 C 3 20 5 23 9 25 L 8 29 L 14 26 C 14.6 26 15 26 16 26 C 24 26 29 21 29 16 C 29 10 24 5 16 5 Z" />
            <path d="M11 13 h10 M11 17 h6" />
          </svg>
        </div>
        <div className="min-w-0">
          <blockquote className="text-[13.5px] italic leading-relaxed text-[var(--text-sub)]">
            “{quote}”
          </blockquote>
          <figcaption className="mt-2 text-[13px]">
            <span className="font-bold text-[var(--text)]">{name}</span>
            <span className="text-[var(--text-muted)]"> · {title}</span>
          </figcaption>
        </div>
      </div>
    </figure>
  );
}

/** Trust microcopy shown below a CTA, with a small hand-drawn arrow pointing
 * up toward the button. */
export function CTAMicrocopy({
  children,
  className = '',
  arrowClass = '',
}: {
  children: ReactNode;
  className?: string;
  arrowClass?: string;
}) {
  return (
    <div className={`mt-2 flex flex-col items-center gap-0.5 ${className}`}>
      <UpArrow className={`h-4 w-5 ${arrowClass || 'text-[var(--blue)]/60'}`} />
      <span className="text-[13px] font-medium text-[var(--text-sub)]">{children}</span>
    </div>
  );
}
