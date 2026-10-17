import React from 'react'
import {
  AppWindow, Users, Building2, Route, Clock, DollarSign,
  Bell, Megaphone, Ticket, UserPlus, ListChecks,
  LayoutDashboard, Share2, Wallet, HandCoins, Settings, ShieldCheck,
  BadgePercent,
} from 'lucide-react'

export interface StudioNavItem {
  id: string
  /** i18n key resolved at render time via t(labelKey). */
  labelKey: string
  path: string
  icon: React.ReactNode
}

export interface StudioNavConfig {
  /** Primary scrolling nav. */
  nav: StudioNavItem[]
  /** Secondary "System" group (admin/agent) shown after a divider. */
  system: StudioNavItem[]
}

const size = 16

/**
 * Dashboard navigation per role, using i18n keys so every label is translated.
 * Paths intentionally match the existing routes so the redesign loses nothing.
 */
export const STUDIO_NAV: Record<string, StudioNavConfig> = {
  system_admin: {
    nav: [
      { id: 'overview', labelKey: 'nav.overview', path: '/dashboard/overview-admin', icon: <AppWindow size={size} /> },
      { id: 'users', labelKey: 'nav.users', path: '/dashboard/users', icon: <Users size={size} /> },
      { id: 'organizations', labelKey: 'nav.organizations', path: '/dashboard/organizations', icon: <Building2 size={size} /> },
      { id: 'routes', labelKey: 'nav.routes', path: '/dashboard/routes', icon: <Route size={size} /> },
      { id: 'schedules', labelKey: 'nav.schedules', path: '/dashboard/schedules', icon: <Clock size={size} /> },
      { id: 'accounting', labelKey: 'nav.accounting', path: '/dashboard/accounting', icon: <DollarSign size={size} /> },
      { id: 'promoters', labelKey: 'nav.promoters', path: '/dashboard/promoters', icon: <HandCoins size={size} /> },
    ],
    system: [
      { id: 'notifications', labelKey: 'nav.notifications', path: '/dashboard/notifications', icon: <Bell size={size} /> },
      { id: 'announcements', labelKey: 'nav.announcements', path: '/dashboard/announcements', icon: <Megaphone size={size} /> },
      { id: 'promotions', labelKey: 'nav.promotions', path: '/dashboard/promotions', icon: <BadgePercent size={size} /> },
    ],
  },
  agency_admin: {
    nav: [
      { id: 'overview', labelKey: 'nav.overview', path: '/dashboard/overview', icon: <AppWindow size={size} /> },
      { id: 'bookings', labelKey: 'nav.bookings', path: '/dashboard/bookings-management', icon: <Ticket size={size} /> },
      { id: 'departures', labelKey: 'nav.departures', path: '/dashboard/departures', icon: <Clock size={size} /> },
      { id: 'reports', labelKey: 'nav.reports', path: '/dashboard/reports', icon: <ListChecks size={size} /> },
      { id: 'agents', labelKey: 'nav.agents', path: '/dashboard/agents', icon: <UserPlus size={size} /> },
      { id: 'settings', labelKey: 'nav.settings', path: '/dashboard/agency-settings', icon: <Settings size={size} /> },
    ],
    system: [
      { id: 'notifications', labelKey: 'nav.notifications', path: '/dashboard/notifications', icon: <Bell size={size} /> },
    ],
  },
  agent: {
    nav: [
      { id: 'bookings', labelKey: 'nav.bookings', path: '/dashboard/agent', icon: <Ticket size={size} /> },
    ],
    system: [
      { id: 'notifications', labelKey: 'nav.notifications', path: '/dashboard/notifications', icon: <Bell size={size} /> },
    ],
  },
  promoter: {
    nav: [
      { id: 'dashboard', labelKey: 'nav.dashboard', path: '/dashboard/promoter', icon: <LayoutDashboard size={size} /> },
      { id: 'referrals', labelKey: 'nav.referrals', path: '/dashboard/promoter/referrals', icon: <Share2 size={size} /> },
      { id: 'earnings', labelKey: 'nav.earnings', path: '/dashboard/promoter/earnings', icon: <Wallet size={size} /> },
      { id: 'payouts', labelKey: 'nav.payouts', path: '/dashboard/promoter/payouts', icon: <HandCoins size={size} /> },
    ],
    system: [
      { id: 'settings', labelKey: 'nav.settings', path: '/dashboard/promoter/settings', icon: <Settings size={size} /> },
    ],
  },
}

export const ROLE_LABEL_KEY: Record<string, string> = {
  system_admin: 'roles.system_admin',
  agency_admin: 'roles.agency_admin',
  agent: 'roles.agent',
  pickup_agent: 'roles.pickup_agent',
  user: 'roles.user',
  promoter: 'roles.promoter',
}

export const ROLE_HOME: Record<string, string> = {
  system_admin: '/dashboard/overview-admin',
  agency_admin: '/dashboard/overview',
  agent: '/dashboard/agent',
  pickup_agent: '/login',
  user: '/book',
  promoter: '/dashboard/promoter',
}

export const ROLE_ICON: Record<string, React.ReactNode> = {
  system_admin: <ShieldCheck size={size} />,
  promoter: <HandCoins size={size} />,
  agent: <Ticket size={size} />,
}
