# Security headers, kept in one place so they can be included in the server block
# AND in every location that sets its own headers.
#
# nginx `add_header` is NOT additive: if a location block declares even one
# `add_header`, every `add_header` inherited from the enclosing block is
# discarded for that location. The SPA history fallback internally redirects to
# /index.html, so without this include every client route (/login, /, ...) was
# served with none of these headers - which stripped
# `Cross-Origin-Opener-Policy` and severed the Google Sign-In popup, so GIS
# could not postMessage the credential back and the login failed with
# "Invalid Google token format".
#
# The CSP explicitly allows accounts.google.com because Google Identity Services
# loads its button script from there; `script-src 'self'` alone blocks it.
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Cross-Origin-Opener-Policy "same-origin-allow-popups" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.katisha.today wss://api.katisha.today https://accounts.google.com; frame-src https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
