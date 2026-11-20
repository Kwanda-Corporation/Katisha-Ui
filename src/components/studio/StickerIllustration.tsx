export type StickerKind =
  | 'students'
  | 'payments'
  | 'bookings'
  | 'arrivals'
  | 'buses'
  | 'drivers'
  | 'journeys'
  | 'organizations'
  | 'schools'
  | 'users'
  | 'tickets'
  | 'notifications'
  | 'generic'

const OUTLINE = '#0f0f0f'

function Glyph({ kind }: { kind: StickerKind }) {
  switch (kind) {
    case 'students':
    case 'users':
      return (
        <>
          <circle cx="88" cy="76" r="20" />
          <path d="M52 132c0-20 16-32 36-32s36 12 36 32" />
        </>
      )
    case 'drivers':
      return (
        <>
          <circle cx="88" cy="74" r="18" />
          <path d="M56 130c0-18 14-28 32-28s32 10 32 28" />
          <circle cx="120" cy="118" r="12" />
        </>
      )
    case 'payments':
      return (
        <>
          <rect x="46" y="66" width="84" height="56" rx="8" />
          <path d="M46 84h84" />
          <path d="M60 106h20" />
        </>
      )
    case 'bookings':
    case 'tickets':
      return (
        <>
          <path d="M50 70h76v18a10 10 0 000 20v18H50V108a10 10 0 000-20z" />
          <path d="M88 70v60" strokeDasharray="6 6" />
        </>
      )
    case 'arrivals':
      return (
        <>
          <rect x="44" y="66" width="60" height="60" rx="8" />
          <path d="M104 96h26M122 86l10 10-10 10" />
        </>
      )
    case 'buses':
      return (
        <>
          <rect x="42" y="58" width="92" height="60" rx="10" />
          <path d="M42 86h92" />
          <circle cx="64" cy="126" r="9" />
          <circle cx="112" cy="126" r="9" />
        </>
      )
    case 'journeys':
      return (
        <>
          <circle cx="58" cy="66" r="10" />
          <circle cx="118" cy="128" r="10" />
          <path d="M64 74c30 8 6 40 46 48" strokeDasharray="2 8" />
        </>
      )
    case 'organizations':
    case 'schools':
      return (
        <>
          <path d="M88 48l44 24v8H44v-8z" />
          <path d="M56 80v44M80 80v44M96 80v44M120 80v44" />
          <path d="M44 132h88" />
        </>
      )
    case 'notifications':
      return (
        <>
          <path d="M88 46c18 0 30 14 30 32v18l8 12H50l8-12V78c0-18 12-32 30-32z" />
          <path d="M78 128a10 10 0 0020 0" />
        </>
      )
    default:
      return (
        <>
          <circle cx="88" cy="80" r="26" />
          <path d="M88 108v28M74 122h28" />
        </>
      )
  }
}

/**
 * StickerIllustration — original flat “sticker” empty-state art: a soft blue
 * halo, a 2px ink outline, flat brand-blue fill. One shape per page family.
 * Purely decorative (aria-hidden); pair with a translated title/description.
 */
export default function StickerIllustration({ kind = 'generic', size = 200 }: { kind?: StickerKind; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 176 176"
      fill="none"
      aria-hidden="true"
      className="select-none"
    >
      <circle cx="88" cy="90" r="72" fill="var(--studio-accent)" opacity="0.08" />
      <circle cx="88" cy="90" r="52" fill="var(--studio-accent)" opacity="0.1" />
      <g
        stroke={OUTLINE}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="var(--studio-accent)"
        opacity="0.95"
      >
        <Glyph kind={kind} />
      </g>
    </svg>
  )
}
