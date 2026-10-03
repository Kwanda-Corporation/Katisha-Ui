import { API_BASE } from '../config/apiBase';
import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react';
import { enqueueSync } from '../services/syncQueue';
import { clearAllTickets } from '../services/ticketCache';


export const UserRole = {
  SYSTEM_ADMIN: 'system_admin',
  AGENCY_ADMIN: 'agency_admin',
  AGENT:        'agent',
  PICKUP_AGENT: 'pickup_agent',
  USER:         'user',
  PROMOTER:     'promoter',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface AuthUser {
  id: string;
  username?: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  /** All roles granted to this account. Phase 4 populates this alongside `role`. */
  roles?: UserRole[];
  organization?: string;
  loyaltyPoints?: number;
  freeTickets?: number;
  bookingCount?: number;
  agency?: { _id: string; name: string };
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

interface LoginResult {
  ok: boolean;
  error?: string;
  needsProfile?: boolean;
  /** Account was queued locally and will be synced when back online. */
  queuedOffline?: boolean;
}

interface AuthContextValue extends AuthState {
  login: (identifier: string, password: string) => Promise<LoginResult>;
  googleLogin: (credential: string) => Promise<LoginResult>;
  completeProfile: (phone: string, role?: string) => Promise<LoginResult>;
  register: (username: string, password: string, name: string, phone: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  updateUser: (patch: Partial<AuthUser>) => void;
  /**
   * Adopt a freshly issued token pair without touching the stored user. Used
   * after a password change, which rotates the refresh token server-side: the
   * old one is already dead, so keeping it would sign the user out on the next
   * silent refresh.
   */
  setTokens: (accessToken: string, refreshToken?: string) => void;
  isAuthenticated: boolean;
  authFetch: (path: string, options?: RequestInit) => Promise<any>;
  authFetchBlob: (path: string, options?: RequestInit) => Promise<Blob | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY   = 'vdk_access_token';
const REFRESH_KEY = 'vdk_refresh_token';
const USER_KEY    = 'vdk_user';

function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

function decodeExp(token: string): number | null {
  try {
    return JSON.parse(atob(token.split('.')[1])).exp ?? null;
  } catch {
    return null;
  }
}

/** Returns true if token is missing, malformed, or expires within 30 s */
function isExpiredOrSoon(token: string | null): boolean {
  if (!token) return true;
  const exp = decodeExp(token);
  if (!exp) return true;
  return exp * 1000 < Date.now() + 30_000;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always start from the logged-out state so the first client render is
  // byte-identical to the pre-rendered HTML. Reading localStorage in the
  // useState initializer made logged-in visitors mismatch the server's
  // logged-out markup, which is what raised minified React error #418 on the
  // pre-rendered routes (/, /welcome, /my-bookings, /track). The stored session
  // is restored in an effect below, after hydration has committed.
  const [state, setState] = useState<AuthState>({
    user: null, accessToken: null, refreshToken: null, isLoading: true,
  });

  // Restore an existing session after mount (client only).
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
      const storedAccess = localStorage.getItem(TOKEN_KEY);
      if (storedUser && storedAccess) {
        setState({
          user: storedUser,
          accessToken: storedAccess,
          refreshToken: localStorage.getItem(REFRESH_KEY),
          isLoading: false,
        });
        return;
      }
    } catch {
      // Corrupt value in storage - fall back to logged out.
    }
    // No stored session: stop the guard loading state so ProtectedRoute can
    // send the visitor to the login page instead of waiting forever.
    setState((prev) => (prev.isLoading ? { ...prev, isLoading: false } : prev));
  }, []);

  // Keep a ref so callbacks always see the latest tokens without stale closures
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Deduplicate concurrent refresh calls
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  // Temp tokens stored between googleLogin (needsProfile) and completeProfile
  const tempTokensRef = useRef<{ user: AuthUser; accessToken: string; refreshToken: string } | null>(null);

  // ── Persist / clear ─────────────────────────────────────────────────────────

  function persist(user: AuthUser, accessToken: string, refreshToken: string) {
    localStorage.setItem(TOKEN_KEY,   accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY,    JSON.stringify(user));
    setState({ user, accessToken, refreshToken, isLoading: false });
    // TopNav reads the session from storage after mount, so nudge it to
    // re-read now that the tokens have changed.
    window.dispatchEvent(new Event('vdk-auth-changed'));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    window.dispatchEvent(new Event('vdk-auth-changed'));
  }

  // ── Token refresh ────────────────────────────────────────────────────────────

  const doRefresh = useCallback(async (): Promise<string | null> => {
    // Offline: keep the cached session alive instead of clearing it so cached
    // tickets stay reachable without an internet connection.
    if (!isOnline()) {
      return stateRef.current.accessToken ?? localStorage.getItem(TOKEN_KEY);
    }

    // Deduplicate: if a refresh is already in flight, wait for it
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      const rt = stateRef.current.refreshToken ?? localStorage.getItem(REFRESH_KEY);
      if (!rt) {
        clearSession();
        window.location.href = '/login';
        return null;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/refresh-token`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refreshToken: rt }),
        });

        if (!res.ok) {
          clearSession();
          window.location.href = '/login';
          return null;
        }

        const { data } = await res.json();
        const newAccess: string  = data.accessToken;
        const newRefresh: string = data.refreshToken ?? rt;

        // Update storage and state without touching user
        localStorage.setItem(TOKEN_KEY,   newAccess);
        localStorage.setItem(REFRESH_KEY, newRefresh);
        setState(s => ({ ...s, accessToken: newAccess, refreshToken: newRefresh }));
        return newAccess;
      } catch {
        clearSession();
        window.location.href = '/login';
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  // ── Silent refresh on mount ──────────────────────────────────────────────────

  useEffect(() => {
    const { accessToken, refreshToken } = stateRef.current;
    if (refreshToken && isExpiredOrSoon(accessToken)) {
      void doRefresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for auth-stored event (used by guest booking to auto-login)
  useEffect(() => {
    function handleAuthStored() {
      const storedUser = JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
      const storedAccess = localStorage.getItem(TOKEN_KEY);
      const storedRefresh = localStorage.getItem(REFRESH_KEY);
      if (storedUser && storedAccess) {
        setState({ user: storedUser, accessToken: storedAccess, refreshToken: storedRefresh, isLoading: false });
      }
    }
    window.addEventListener('auth-stored', handleAuthStored);
    return () => window.removeEventListener('auth-stored', handleAuthStored);
  }, []);

  // Listen for auth-cleared (stale/invalid token rejected by the API layer)
  useEffect(() => {
    function handleAuthCleared() {
      setState({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    }
    window.addEventListener('auth-cleared', handleAuthCleared);
    return () => window.removeEventListener('auth-cleared', handleAuthCleared);
  }, []);

  // ── Central fetch helper ─────────────────────────────────────────────────────

  const getValidToken = useCallback(async (): Promise<string | null> => {
    let token = stateRef.current.accessToken ?? localStorage.getItem(TOKEN_KEY);
    if (!isOnline()) return token;
    if (isExpiredOrSoon(token)) {
      token = await doRefresh();
    }
    return token;
  }, [doRefresh]);

  const authFetch = useCallback(async (
    path: string,
    options: RequestInit = {},
  ): Promise<any> => {
    const token = await getValidToken();
    if (!token) return null;

    const buildHeaders = (t: string) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`,
      ...(options.headers ?? {}),
    });

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers: buildHeaders(token) });

    // One retry after a fresh token on unexpected 401 (e.g. clock skew)
    if (res.status === 401) {
      const newToken = await doRefresh();
      if (!newToken) return null;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers: buildHeaders(newToken) });
    }

    if (!res.ok) return null;
    return res.json().catch(() => null);
  }, [getValidToken, doRefresh]);

  const authFetchBlob = useCallback(async (
    path: string,
    options: RequestInit = {},
  ): Promise<Blob | null> => {
    const token = await getValidToken();
    if (!token) return null;

    const buildHeaders = (t: string) => ({
      Authorization: `Bearer ${t}`,
      ...(options.headers ?? {}),
    });

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers: buildHeaders(token) });

    if (res.status === 401) {
      const newToken = await doRefresh();
      if (!newToken) return null;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers: buildHeaders(newToken) });
    }

    return res.ok ? res.blob() : null;
  }, [getValidToken, doRefresh]);

  // ── Auth actions ─────────────────────────────────────────────────────────────

  async function login(
    identifier: string, password: string,
  ): Promise<LoginResult> {
    setState(s => ({ ...s, isLoading: true }));
    if (!isOnline()) {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'You are offline. Please connect to the internet to sign in.' };
    }
    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ identifier, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState(s => ({ ...s, isLoading: false }));
        return { ok: false, error: json?.message ?? 'Invalid credentials.' };
      }
      const { data } = json;
      persist(data.user, data.accessToken, data.refreshToken);
      return { ok: true };
    } catch {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'Unable to reach the server.' };
    }
  }

  async function googleLogin(
    credential: string,
  ): Promise<LoginResult> {
    setState(s => ({ ...s, isLoading: true }));
    if (!isOnline()) {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'You are offline. Please connect to the internet to sign in.' };
    }
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState(s => ({ ...s, isLoading: false }));
        return { ok: false, error: json?.message ?? 'Google sign-in failed.' };
      }
      const { data } = json;
      if (data.needsProfile) {
        // Store tokens temporarily — do NOT persist yet, otherwise GuestRoute
        // redirects away from the login page before the profile modal shows.
        tempTokensRef.current = { user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken };
        setState(s => ({ ...s, isLoading: false }));
        return { ok: true, needsProfile: true };
      }
      persist(data.user, data.accessToken, data.refreshToken);
      return { ok: true };
    } catch {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'Unable to reach the server.' };
    }
  }

  async function completeProfile(
    phone: string, role?: string,
  ): Promise<LoginResult> {
    const token = tempTokensRef.current?.accessToken ?? stateRef.current.accessToken;
    if (!token) {
      return { ok: false, error: 'No authentication token. Please sign in again.' };
    }
    setState(s => ({ ...s, isLoading: true }));
    if (!isOnline()) {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'You are offline. Please connect to the internet to sign in.' };
    }
    try {
      const res = await fetch(`${API_BASE}/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState(s => ({ ...s, isLoading: false }));
        return { ok: false, error: json?.message ?? 'Failed to complete profile.' };
      }
      const { data } = json;
      tempTokensRef.current = null;
      persist(data.user, data.accessToken, data.refreshToken);
      return { ok: true };
    } catch {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'Unable to reach the server.' };
    }
  }

  async function register(
    username: string, password: string, name: string, phone: string,
  ): Promise<LoginResult> {
    setState(s => ({ ...s, isLoading: true }));
    if (!isOnline()) {
      // Save the account locally; it syncs with the DB when back online.
      setState(s => ({ ...s, isLoading: false }));
      await enqueueSync('auth:register', { username, password, name, phone });
      return { ok: true, queuedOffline: true };
    }
    try {
      const res  = await fetch(`${API_BASE}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password, name, phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState(s => ({ ...s, isLoading: false }));
        return { ok: false, error: json?.message ?? 'Registration failed.' };
      }
      const { data } = json;
      persist(data.user, data.accessToken, data.refreshToken);
      return { ok: true };
    } catch {
      setState(s => ({ ...s, isLoading: false }));
      return { ok: false, error: 'Unable to reach the server.' };
    }
  }

  async function logout() {
    const token = stateRef.current.accessToken;
    if (token) {
      await fetch(`${API_BASE}/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {/* fire-and-forget */});
    }
    clearSession();
    clearAllTickets().catch(() => {});
  }

  function hasRole(...roles: UserRole[]) {
    if (!state.user) return false;
    // `role` is only the primary role. An account can hold several (a promoter
    // is also a `user`), and the API authorizes on `roles[]`, so checking the
    // primary field alone locked multi-role accounts out of their own pages.
    const granted = new Set<UserRole>([state.user.role, ...(state.user.roles ?? [])]);
    return roles.some((role) => granted.has(role));
  }

  function updateUser(patch: Partial<AuthUser>) {
    setState(prev => {
      if (!prev.user) return prev;
      const updated = { ...prev.user, ...patch };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return { ...prev, user: updated };
    });
  }

  function setTokens(accessToken: string, refreshToken?: string) {
    setState(prev => {
      const nextRefresh = refreshToken ?? prev.refreshToken ?? localStorage.getItem(REFRESH_KEY);
      localStorage.setItem(TOKEN_KEY, accessToken);
      if (nextRefresh) localStorage.setItem(REFRESH_KEY, nextRefresh);
      return { ...prev, accessToken, refreshToken: nextRefresh };
    });
    window.dispatchEvent(new Event('vdk-auth-changed'));
  }

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      googleLogin,
      completeProfile,
      register,
      logout,
      hasRole,
      updateUser,
      setTokens,
      isAuthenticated: !!state.user && !!state.accessToken,
      authFetch,
      authFetchBlob,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}