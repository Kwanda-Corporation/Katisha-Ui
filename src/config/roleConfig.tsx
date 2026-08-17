import {
  AppWindow, Signal, Bell, Megaphone,
  Ticket, Users, Building2,
  ListChecks, Route, UserPlus,
  DollarSign,
  Settings, Clock,
} from 'lucide-react';
import { UserRole } from '../contexts/AuthContext';
import React from 'react';

export interface NavItem {
  id: number;
  name: string;
  path: string;
  icon: React.ReactNode;
}

export interface RoleConfig {
  label: string;
  color: string;
  bgColor: string;
  nav: NavItem[];
  systemNav: NavItem[];
  subtitle: string;
}

const iconSize = 15;

export const ROLE_CONFIG: Record<UserRole, RoleConfig> = {
  [UserRole.SYSTEM_ADMIN]: {
    label: 'System Admin',
    color: '#1D4ED8',
    bgColor: '#F4F4F5',
    subtitle: 'Full system access — all modules visible.',
    nav: [
      { id: 1, name: 'Overview', path: '/dashboard/overview-admin', icon: <AppWindow size={iconSize} /> },
      { id: 2, name: 'Users', path: '/dashboard/users', icon: <Users size={iconSize} /> },
      { id: 3, name: 'Organizations', path: '/dashboard/organizations', icon: <Building2 size={iconSize} /> },
      { id: 4, name: 'Routes', path: '/dashboard/routes', icon: <Route size={iconSize} /> },
      { id: 5, name: 'Schedules', path: '/dashboard/schedules', icon: <Clock size={iconSize} /> },
      { id: 6, name: 'Accounting', path: '/dashboard/accounting', icon: <DollarSign size={iconSize} /> },
    ],
    systemNav: [
      { id: 1, name: 'Notifications', path: '/dashboard/notifications', icon: <Bell size={iconSize} /> },
      { id: 2, name: 'Announcements', path: '/dashboard/announcements', icon: <Megaphone size={iconSize} /> },
      { id: 3, name: 'Reports', path: '/dashboard/reports', icon: <Signal size={iconSize} /> },
    ],
  },

  [UserRole.AGENCY_ADMIN]: {
    label: 'Agency Admin',
    color: '#1D4ED8',
    bgColor: '#F4F4F5',
    subtitle: 'Manage your transport agency fleet & drivers.',
    nav: [
      { id: 1, name: 'Overview', path: '/dashboard/overview', icon: <AppWindow size={iconSize} /> },
      { id: 2, name: 'Bookings', path: '/dashboard/bookings-management', icon: <Ticket size={iconSize} /> },
      { id: 3, name: 'Departures', path: '/dashboard/departures', icon: <Clock size={iconSize} /> },
      { id: 4, name: 'Reports', path: '/dashboard/reports', icon: <ListChecks size={iconSize} /> },
      { id: 5, name: 'Agents', path: '/dashboard/agents', icon: <UserPlus size={iconSize} /> },
      { id: 6, name: 'Settings', path: '/dashboard/agency-settings', icon: <Settings size={iconSize} /> },
    ],
    systemNav: [
      { id: 1, name: 'Notifications', path: '/dashboard/notifications', icon: <Bell size={iconSize} /> },
    ],
  },

  [UserRole.AGENT]: {
    label: 'Agent',
    color: '#1D4ED8',
    bgColor: '#F4F4F5',
    subtitle: 'Manage bookings on your assigned routes.',
    nav: [
      { id: 1, name: 'Bookings', path: '/dashboard/agent', icon: <Ticket size={iconSize} /> },
    ],
    systemNav: [
      { id: 1, name: 'Notifications', path: '/dashboard/notifications', icon: <Bell size={iconSize} /> },
    ],
  },

  [UserRole.PICKUP_AGENT]: {
    label: 'Pickup Agent',
    color: '#1D4ED8',
    bgColor: '#F4F4F5',
    subtitle: 'Use the mobile app for pickups.',
    nav: [],
    systemNav: [],
  },

  [UserRole.USER]: {
    label: 'User',
    color: '#1D4ED8',
    bgColor: '#F4F4F5',
    subtitle: 'Book bus tickets and manage your travel.',
    nav: [],
    systemNav: [],
  },
};
