# ── Build stage ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Runtime config baked in at build time (Vite inlines VITE_* vars).
ARG VITE_API_URL=https://api.katisha.today/api
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_MAPBOX_TOKEN=
ARG VITE_GA_MEASUREMENT_ID=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN \
    VITE_GA_MEASUREMENT_ID=$VITE_GA_MEASUREMENT_ID
RUN npm run build:seo

# ── Runtime stage ─────────────────────────────────────────────
FROM nginx:1.27-alpine
# Main config: non-root pid path (/tmp) since we run as the nginx user.
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=builder /app/dist /usr/share/nginx/html
# Run as non-root
RUN chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d /usr/share/nginx/html
USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
