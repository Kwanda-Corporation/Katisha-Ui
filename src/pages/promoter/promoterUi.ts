/**
 * Shared formatting + status colour maps for the promoter pages (earnings,
 * referrals, payouts). Kept in one place so the three tables stay consistent.
 * Components live in promoterBits.tsx (this file must export no components so
 * Fast Refresh keeps working).
 */

/** Promoter money is always RWF and always whole numbers. */
export const rwf = (n: unknown) => `${Number(n || 0).toLocaleString('en-RW')} RWF`

export const dateFmt = (v?: string | null) => (v ? new Date(v).toLocaleDateString() : '—')

export const dateTimeFmt = (v?: string | null) =>
  v ? new Date(v).toLocaleString() : '—'

export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'grey'

export const TONE_CLASS: Record<Tone, { className: string; dot: string }> = {
  green: { className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  amber: { className: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  red: { className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  blue: { className: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  grey: { className: 'bg-[var(--studio-muted-fill)] text-[var(--studio-text-sub)]', dot: 'bg-[var(--studio-text-muted)]' },
}

/** Commission ledger states. */
export const COMMISSION_TONE: Record<string, Tone> = {
  pending: 'amber',
  earned: 'blue',
  paid: 'green',
  reversed: 'red',
}

/** Payout processing states. */
export const PAYOUT_TONE: Record<string, Tone> = {
  pending: 'amber',
  processing: 'amber',
  paid: 'green',
  failed: 'red',
}

/** Referral conversion states. */
export const REFERRAL_TONE: Record<string, Tone> = {
  pending: 'amber',
  converted: 'green',
  rejected: 'red',
}

/** i18n key for a status, e.g. `paid` -> `promoter.statusPaid`. */
export const statusKey = (status?: string | null) => {
  const key = String(status || '').toLowerCase()
  return `promoter.status${key.charAt(0).toUpperCase()}${key.slice(1)}`
}
