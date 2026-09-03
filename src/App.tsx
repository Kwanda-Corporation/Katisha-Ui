import IntroOverlay from './components/ui/IntroOverlay';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { OnlineProvider } from './contexts/OnlineContext';
import { ToastProvider } from './components/ui/Toast';

// Shared provider tree used by both entry points. The router (BrowserRouter on
// the client, StaticRouter during SSR) wraps this in the corresponding entry
// file so the same route tree is reused everywhere.
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <IntroOverlay>
      <OnlineProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </OnlineProvider>
    </IntroOverlay>
  );
}
