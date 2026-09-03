/**
 * Server-side render data bridge.
 *
 * During pre-render (SSG) the build script fetches active routes + agencies
 * from the API and stores them here. The SSR pass (entry-server) sets them
 * before rendering, so route/agency landing pages can render their full
 * resolved content (agency lists, fares, descriptions) instead of just a
 * "loading" state — giving crawlers substantive HTML.
 *
 * On the client this module stays empty and pages fetch as usual.
 */
let routes: any[] | null = null;
let agencies: any[] | null = null;

export const ssrData = {
  setRoutes(data: any[] | null) {
    routes = data;
  },
  setAgencies(data: any[] | null) {
    agencies = data;
  },
  getRoutes(): any[] | null {
    return routes;
  },
  getAgencies(): any[] | null {
    return agencies;
  },
  reset() {
    routes = null;
    agencies = null;
  },
};
