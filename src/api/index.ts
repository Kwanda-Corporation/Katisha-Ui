import { API_BASE, SERVER_ORIGIN } from '../config/apiBase';

export { API_BASE, SERVER_ORIGIN };

export function resolveImageUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      if (url.pathname.startsWith('/uploads/') && url.origin !== SERVER_ORIGIN) {
        return `${SERVER_ORIGIN}${url.pathname}`;
      }
    } catch {
      return path;
    }
    return path;
  }
  return `${SERVER_ORIGIN}${path}`;
}

interface ApiOptions extends RequestInit {
  params?: Record<string, string>;
}

const SESSION_KEYS = ['vdk_access_token', 'vdk_refresh_token', 'vdk_user'];

function clearStaleSession() {
  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
  window.dispatchEvent(new Event('auth-cleared'));
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('vdk_refresh_token') ?? sessionStorage.getItem('vdk_refresh_token');
  if (!refreshToken) return null;
  try {
    const rres = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!rres.ok) return null;
    const rjson = await rres.json();
    const access = rjson.data?.accessToken;
    const refresh = rjson.data?.refreshToken;
    if (!access) return null;
    localStorage.setItem('vdk_access_token', access);
    localStorage.setItem('vdk_refresh_token', refresh ?? refreshToken);
    return access;
  } catch {
    return null;
  }
}

async function request<T = any>(path: string, options: ApiOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const token = localStorage.getItem('vdk_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  const json = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retry = await fetch(url, { ...fetchOptions, headers });
        if (retry.ok) return await retry.json();
      }
      clearStaleSession();
    }
    throw new Error(json.message || 'Request failed');
  }
  return json;
}

export const api = {
  // Auth
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  googleAuth: (credential: string) => request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  refreshToken: (data: any) => request('/auth/refresh-token', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data: any) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data: any) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (data: any) => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  createUserWithInvite: (data: any) => request('/auth/create-user', { method: 'POST', body: JSON.stringify(data) }),
  verifySetupToken: (token: string) => request(`/auth/verify-setup?token=${token}`),
  setupAccount: (data: any) => request('/auth/setup-account', { method: 'POST', body: JSON.stringify(data) }),
  getRewards: () => request('/auth/rewards'),

  // Agencies
  getAgencies: (params?: Record<string, string>) => request('/agencies', { params }),
  getPublicAgencies: () => request('/agencies/public'),
  getAgency: (id: string) => request(`/agencies/${id}`),
  getPublicAgency: (id: string) => request(`/agencies/public/${id}`),
  createAgency: (data: any) => request('/agencies', { method: 'POST', body: JSON.stringify(data) }),
  updateAgency: (id: string, data: any) => request(`/agencies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAgencyStats: (id: string) => request(`/agencies/${id}/stats`),

  // Routes
  getRoutes: (params?: Record<string, string>) => request('/routes', { params }),
  searchRoutes: (params: Record<string, string>) => request('/routes/search', { params }),
  getRoute: (id: string) => request(`/routes/${id}`),
  getAgencyRoutes: (agencyId: string) => request(`/routes/agency/${agencyId}`),
  createRoute: (data: any) => request('/routes', { method: 'POST', body: JSON.stringify(data) }),
  createBulkRoutes: (data: { routes: any[] }) => request('/routes/bulk', { method: 'POST', body: JSON.stringify(data) }),
  updateRoute: (id: string, data: any) => request(`/routes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRoute: (id: string) => request(`/routes/${id}`, { method: 'DELETE' }),

  // Bookings
  createBooking: (data: any) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  createGuestBooking: (data: any) => request('/bookings/guest', { method: 'POST', body: JSON.stringify(data) }),
  getUserBookings: (params?: Record<string, string>) => request('/bookings', { params }),
  getBooking: (id: string) => request(`/bookings/${id}`),
  trackBooking: (ref: string) => request(`/bookings/track/${ref}`),
  trackBookingStatus: (ref: string) => request(`/bookings/track/${ref}/status`),
  verifyTicket: (ref: string) => request(`/bookings/verify/${ref}`),
  getAgencyBookings: (params?: Record<string, string>) => request('/bookings/agency/all', { params }),
  getAgentBookings: (params?: Record<string, string>) => request('/bookings/agent/today', { params }),
  getPickupAgentBookings: (params?: Record<string, string>) => request('/bookings/pickup-agent/today', { params }),
  confirmBooking: (id: string) => request(`/bookings/${id}/confirm`, { method: 'PATCH' }),
  issueBooking: (id: string) => request(`/bookings/${id}/issue`, { method: 'PATCH' }),
  rejectBooking: (id: string, reason: string) => request(`/bookings/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  cancelBooking: (id: string) => request(`/bookings/${id}/cancel`, { method: 'POST' }),
  abandonBooking: (id: string) => request(`/bookings/${id}/abandon`, { method: 'POST' }),
  viewTicket: (id: string) => request(`/bookings/${id}/ticket`),
  getTakenSeats: (params: Record<string, string>) => request('/bookings/taken-seats', { params }),
  getPaymentConfig: () => request('/bookings/payment-config'),
  getPendingMomoPayments: (params?: Record<string, string>) => request('/bookings/payments/momo/pending', { params }),
  approveMomoPayment: (id: string) => request(`/bookings/${id}/payment/approve`, { method: 'PATCH' }),
  rejectMomoPayment: (id: string, reason?: string) =>
    request(`/bookings/${id}/payment/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  // Departure Blocks
  getDepartureSchedule: (params: Record<string, string>) => request('/departure-blocks/schedule', { params }),
  getBlockedDepartures: (params: Record<string, string>) => request('/departure-blocks', { params }),
  getBlockedDates: (params: Record<string, string>) => request('/departure-blocks/blocked-dates', { params }),
  getBlockedTimes: (params: Record<string, string>) => request('/departure-blocks/public', { params }),
  blockDeparture: (data: { routeId: string; travelDate: string; travelTime: string; reason?: string }) =>
    request('/departure-blocks', { method: 'POST', body: JSON.stringify(data) }),
  unblockDeparture: (data: { routeId: string; travelDate: string; travelTime: string }) =>
    request('/departure-blocks', { method: 'DELETE', body: JSON.stringify(data) }),

  // Schedules (system admin travel-hour management)
  getPublicSchedule: (params: Record<string, string>) => request('/schedules/public', { params }),
  getWeeklySchedules: (params: Record<string, string>) => request('/schedules/weekly', { params }),
  addWeeklySchedule: (data: { agencyId: string; routeId: string; dayOfWeek: number; travelTime: string }) =>
    request('/schedules/weekly', { method: 'POST', body: JSON.stringify(data) }),
  removeWeeklySchedule: (data: { agencyId: string; routeId: string; dayOfWeek: number; travelTime: string }) =>
    request('/schedules/weekly', { method: 'DELETE', body: JSON.stringify(data) }),
  getOverrides: (params: Record<string, string>) => request('/schedules/overrides', { params }),
  addOverride: (data: { agencyId: string; routeId: string; travelDate: string; travelTime: string; action: 'add' | 'remove' }) =>
    request('/schedules/overrides', { method: 'POST', body: JSON.stringify(data) }),
  removeOverride: (data: { agencyId: string; routeId: string; travelDate: string; travelTime: string }) =>
    request('/schedules/overrides', { method: 'DELETE', body: JSON.stringify(data) }),
  getEffectiveSchedule: (params: Record<string, string>) => request('/schedules/effective', { params }),

  // Dashboard
  getAdminDashboard: () => request('/dashboard/admin'),
  getAgencyDashboard: () => request('/dashboard/agency'),
  getAgentDashboard: () => request('/dashboard/agent'),

  // Data
  getDistricts: () => request('/data/districts'),
  getEastAfricaCities: () => request('/data/east-africa-cities'),
  getProvinces: () => request('/data/provinces'),

  // Analytics
  getAgencyAnalytics: (params?: Record<string, string>) => request('/analytics/agency', { params }),
  getSystemAnalytics: () => request('/analytics/system'),
  exportAgencyReport: async (params?: Record<string, string>) => {
    let url = `${API_BASE}/analytics/agency/report`;
    if (params) {
      const sp = new URLSearchParams(params);
      url += `?${sp.toString()}`;
    }
    const token = localStorage.getItem('vdk_access_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const json = await res.json().catch(() => ({ message: 'Export failed' }));
      throw new Error(json.message || 'Export failed');
    }
    const blob = await res.blob();
    const cd = res.headers.get('Content-Disposition') || '';
    const match = cd.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `Katisha_Report.xlsx`;
    const a = window.document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  // Agent Route Assignments
  getAgentAssignedRoutes: (agentId: string) => request(`/users/${agentId}/assigned-routes`),
  updateAgentAssignedRoutes: (agentId: string, routeIds: string[]) =>
    request(`/users/${agentId}/assigned-routes`, { method: 'PATCH', body: JSON.stringify({ routeIds }) }),

  // Notifications
  getNotifications: (params?: Record<string, string>) => request('/notifications', { params }),
  markNotificationsRead: () => request('/notifications/read', { method: 'PATCH' }),
  createAnnouncement: (data: any) => request('/notifications/announcement', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  getSettings: () => request('/settings'),
  updateSetting: (key: string, value: any, description?: string) =>
    request('/settings', { method: 'PUT', body: JSON.stringify({ key, value, description }) }),
  updateSettings: (settings: Record<string, any>) =>
    request('/settings/bulk', { method: 'PUT', body: JSON.stringify({ settings }) }),

  // Accounting (manual, PIN-gated payouts)
  getPayoutSummary: () => request('/accounting/payouts/summary'),
  getPayableBookings: () => request('/accounting/payouts/payable'),
  updatePayoutPhone: (phone: string, method?: string) =>
    request('/accounting/payouts/phone', { method: 'PUT', body: JSON.stringify({ phone, method }) }),
  executePayout: (bookingIds: string[], phoneNumber: string, pin: string) =>
    request('/accounting/payouts/execute', {
      method: 'POST',
      body: JSON.stringify({ bookingIds, phoneNumber, pin }),
    }),
};

export default api;
