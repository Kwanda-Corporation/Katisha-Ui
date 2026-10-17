import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Scrolls the window back to the top whenever the route (path or query string)
 * changes. Client-only — the effect never runs during SSR.
 *
 * Without this, navigating away from a scrolled page (for example the
 * full-viewport destination panels on /book) keeps the previous scroll offset,
 * so the visitor lands mid-page instead of at the top of the new page.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}
