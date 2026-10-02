import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { UserRole } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import SEO from './components/seo/SEO';
import Spinner from './components/ui/Spinner';

// Routes are code-split so heavy page-level libraries (mapbox, recharts, etc.)
// load only when their page is actually visited instead of on first paint.
const Login = lazy(() => import('./pages/public/Login'));
const Register = lazy(() => import('./pages/public/Register'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/public/ResetPassword'));
const SetPassword = lazy(() => import('./pages/public/SetPassword'));
const VerifyCode = lazy(() => import('./pages/public/VerifyCode'));
const AuthChoice = lazy(() => import('./pages/public/AuthChoice'));

const WebsiteHome = lazy(() => import('./pages/website/Home'));
const Onboarding = lazy(() => import('./pages/website/Onboarding'));
const MyBookings = lazy(() => import('./pages/website/MyBookings'));
const TicketView = lazy(() => import('./pages/website/TicketView'));
const AgencyRoutesPage = lazy(() => import('./pages/website/AgencyRoutes'));
const BookingGuide = lazy(() => import('./pages/website/BookingGuide'));
const RouteLandingPage = lazy(() => import('./pages/website/RouteLandingPage'));
const RouteHubPage = lazy(() => import('./pages/website/RouteHubPage'));
const AgencyLandingPage = lazy(() => import('./pages/website/AgencyLandingPage'));
const PaymentStatus = lazy(() => import('./pages/website/PaymentStatus'));

const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));

const OverviewPage = lazy(() => import('./layouts/dashboard/OverView'));
const ReportsPage = lazy(() => import('./layouts/dashboard/Reports'));
const BookingsManagementPage = lazy(() => import('./layouts/dashboard/BookingsManagement'));
const NotificationsPage = lazy(() => import('./pages/dashboards/NotificationsPage'));
const Announcements = lazy(() => import('./pages/dashboards/Announcements'));
const OrganisationsPage = lazy(() => import('./potals/SystemAdmin/Organizations'));
const UsersPage = lazy(() => import('./potals/SystemAdmin/Users'));
const SystemAdminOverview = lazy(() => import('./layouts/dashboard/SystemDashboard'));
const RoutePricesPage = lazy(() => import('./potals/SystemAdmin/RoutePricing'));
const AgencyAgentsPage = lazy(() => import('./potals/Agency/Agents'));
const TrackingPage = lazy(() => import('./potals/Common/TrackingPage'));
const AccountingPage = lazy(() => import('./layouts/dashboard/AccountingPage'));
const AgencySettings = lazy(() => import('./pages/dashboards/AgencySettings'));
const DepartureManagement = lazy(() => import('./pages/dashboards/DepartureManagement'));
const ScheduleManagement = lazy(() => import('./pages/dashboards/ScheduleManagement'));
const AgentBookingsPage = lazy(() => import('./pages/website/AgentBookings'));
const StudioPreview = lazy(() => import('./pages/promoter/StudioPreview'));

const ROLE_HOME: Record<UserRole, string> = {
  [UserRole.SYSTEM_ADMIN]: '/dashboard/overview-admin',
  [UserRole.AGENCY_ADMIN]: '/dashboard/overview',
  [UserRole.AGENT]:        '/dashboard/agent',
  [UserRole.PICKUP_AGENT]: '/login',
  [UserRole.USER]:         '/book',
  [UserRole.PROMOTER]:     '/dashboard/promoter',
};

function ForbiddenPage() {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sofia Pro', sans-serif", gap: 16 }}>
      <SEO title="Access Denied" noindex />
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🚫</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Access Denied</h1>
      <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>You don't have permission to view this page.</p>
      {user && (
        <a href={ROLE_HOME[user.role]}
          style={{ padding: '8px 20px', background: '#1D4ED8', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Go to my dashboard
        </a>
      )}
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/welcome" replace />;
  return <Navigate to={ROLE_HOME[user.role]} replace />;
}

// ── All routes live here so useNavigate works inside the router ────────────────
function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-dark) 100%)' }}>
      <Spinner size={44} />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Onboarding />} />
      <Route path="/welcome" element={<Onboarding />} />
      <Route path="/auth-choice" element={<AuthChoice />} />
      <Route path="/book" element={<WebsiteHome />} />
      <Route path="/bus/:slug" element={<RouteLandingPage />} />
      <Route path="/bus/rwanda" element={<RouteHubPage scope="rwanda" />} />
      <Route path="/bus/east-africa" element={<RouteHubPage scope="east-africa" />} />
      <Route path="/agency/:id/:slug" element={<AgencyLandingPage />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/track" element={<MyBookings />} />
      <Route path="/ticket/:bookingId" element={<TicketView />} />
      <Route path="/payment/:referenceCode" element={<PaymentStatus />} />
      <Route path="/guide" element={<BookingGuide />} />
      <Route path="/redirect" element={<RootRedirect />} />
      <Route path="/login"           element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register"        element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password"  element={<GuestRoute><ResetPassword /></GuestRoute>} />
      <Route path="/set-password"    element={<SetPassword />} />
      <Route path="/verify-code"     element={<GuestRoute><VerifyCode /></GuestRoute>} />

      {/* Protected dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<RootRedirect />} />

        {/* Overview */}
        <Route path="overview" element={<OverviewPage />} />

        {/* Reports */}
        <Route path="reports" element={
          <ProtectedRoute roles={[UserRole.AGENCY_ADMIN, UserRole.SYSTEM_ADMIN]}>
            <ReportsPage />
          </ProtectedRoute>
        } />

        {/* Live tracking */}
        <Route path="tracking" element={
          <ProtectedRoute roles={[UserRole.AGENCY_ADMIN, UserRole.SYSTEM_ADMIN]}>
            <TrackingPage />
          </ProtectedRoute>
        } />

        {/* Organizations */}
        <Route path="organizations" element={
          <ProtectedRoute roles={[UserRole.SYSTEM_ADMIN]}>
            <OrganisationsPage />
          </ProtectedRoute>
        } />

        {/* User management (System Admin) */}
        <Route path="users" element={
          <ProtectedRoute roles={[UserRole.SYSTEM_ADMIN]}>
            <UsersPage />
          </ProtectedRoute>
        } />

        {/* Route pricing */}
        <Route path="routes" element={
          <ProtectedRoute roles={[UserRole.SYSTEM_ADMIN]}>
            <RoutePricesPage />
          </ProtectedRoute>
        } />

        {/* Agency bookings management */}
        <Route path="bookings-management" element={
          <ProtectedRoute roles={[UserRole.AGENCY_ADMIN]}>
            <BookingsManagementPage />
          </ProtectedRoute>
        } />

        {/* Agency agents management */}
        <Route path="agents" element={
          <ProtectedRoute roles={[UserRole.AGENCY_ADMIN]}>
            <AgencyAgentsPage />
          </ProtectedRoute>
        } />

        {/* Agency route management */}
        <Route path="agency-routes" element={
          <ProtectedRoute roles={[UserRole.AGENCY_ADMIN]}>
            <AgencyRoutesPage />
          </ProtectedRoute>
        } />

        {/* System Admin overview */}
        <Route path="overview-admin" element={
          <ProtectedRoute roles={[UserRole.SYSTEM_ADMIN]}>
            <SystemAdminOverview />
          </ProtectedRoute>
        } />

        {/* Accounting (System Admin) */}
        <Route path="accounting" element={
          <ProtectedRoute roles={[UserRole.SYSTEM_ADMIN]}>
            <AccountingPage />
          </ProtectedRoute>
        } />

        {/* Agency Settings */}
        <Route path="agency-settings" element={
          <ProtectedRoute roles={[UserRole.AGENCY_ADMIN]}>
            <AgencySettings />
          </ProtectedRoute>
        } />

        {/* Departure Management */}
        <Route path="departures" element={
          <ProtectedRoute roles={[UserRole.AGENCY_ADMIN]}>
            <DepartureManagement />
          </ProtectedRoute>
        } />

        {/* Schedule Management (System Admin) */}
        <Route path="schedules" element={
          <ProtectedRoute roles={[UserRole.SYSTEM_ADMIN]}>
            <ScheduleManagement />
          </ProtectedRoute>
        } />

        {/* Agent bookings */}
        <Route path="agent" element={
          <ProtectedRoute roles={[UserRole.AGENT]}>
            <AgentBookingsPage />
          </ProtectedRoute>
        } />

        {/* Notifications (all roles) */}
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Announcements (System Admin) */}
        <Route path="announcements" element={
          <ProtectedRoute roles={[UserRole.SYSTEM_ADMIN]}>
            <Announcements />
          </ProtectedRoute>
        } />

        <Route path="*" element={<ForbiddenPage />} />
      </Route>

      <Route path="/unauthorized" element={<ForbiddenPage />} />
      {/* Dev-only design-system preview. Not present in production builds. */}
      {import.meta.env.DEV && (
        <Route path="/studio-preview" element={<ProtectedRoute><StudioPreview /></ProtectedRoute>} />
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
