import React from 'react'

export type BadgeTone = 'green' | 'amber' | 'red' | 'grey'

const GREEN = ['paid', 'active', 'completed', 'complete', 'arrived', 'confirmed', 'approved', 'verified', 'present', 'success', 'resolved', 'delivered', 'on_time']
const AMBER = ['pending', 'waiting', 'scheduled', 'in_progress', 'ongoing', 'partial', 'processing', 'draft', 'upcoming', 'due']
const RED = ['cancelled', 'canceled', 'failed', 'unpaid', 'rejected', 'absent', 'overdue', 'not_paid', 'error', 'expired']

/** Maps an arbitrary status string to one of the four badge tints. */
export function statusTone(status?: string): BadgeTone {
  const s = String(status ?? '').toLowerCase().replace(/\s+/g, '_')
  if (GREEN.includes(s)) return 'green'
  if (AMBER.includes(s)) return 'amber'
  if (RED.includes(s)) return 'red'
  return 'grey'
}

const toneClass: Record<BadgeTone, string> = {
  green: 'vdk-badge-green',
  amber: 'vdk-badge-amber',
  red: 'vdk-badge-red',
  grey: 'vdk-badge-grey',
}

interface StatusBadgeProps {
  /** Status key; tints are derived automatically unless `tone` is given. */
  status?: string
  tone?: BadgeTone
  children: React.ReactNode
  className?: string
}

export default function StatusBadge({ status, tone, children, className = '' }: StatusBadgeProps) {
  const cls = toneClass[tone ?? statusTone(status)]
  return <span className={`vdk-badge ${cls} ${className}`}>{children}</span>
}
