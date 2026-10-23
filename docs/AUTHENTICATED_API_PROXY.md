# Authenticated staging API proxy

Vercel routes `/api/:path*` to `api/proxy.js`. Its server-side implementation in
`server/api-proxy.js` uses the fixed HTTPS Render staging upstream. Set
`VITE_API_BASE_URL=/api`. Set a random server-only `API_EDGE_SECRET` (32–256
characters) on Vercel and use the same secret on the paired Render service.
Never use a `VITE_` prefix for the credential or commit its value.

Vercel overwrites `x-vercel-forwarded-for` at ingress. The function validates a
single IP, replaces all incoming edge credentials/IP headers, and passes that
identity to the backend's authenticated edge middleware. It does not trust
client XFF/real-ip, choose targets from request input, follow upstream redirects,
or cache API responses. Auth cookies (including multiple Set-Cookie values),
CSRF, idempotency key, body bytes and upstream status codes are preserved.

Deploy the backend middleware with its gate disabled first. Deploy this proxy
with the Vercel secret, verify catalog/auth, then enable the matching Render
secret with `TRUST_PROXY=0`. Direct unauthenticated `/api` then returns 403;
health checks remain reachable. A key mismatch/missing key fails closed. Roll
back by disabling the Render gate before reverting the frontend proxy.

Vercel's function body limit is 4.5 MB including multipart overhead; larger
admin images require resizing or a separately reviewed direct-upload design.
The backend's larger direct-upload cap does not override the hosting limit.
OAuth callback URLs must use the frontend `/api` origin after gate activation;
direct Render `/api` callbacks are intentionally rejected.

Before accepting backend #140, verify real deployment routing and source-IP
handling, forged edge/XFF headers, independent clients/shared NAT budgets,
and rerun the deployed HTTPS cookie/CSRF suite. Local proxy tests are not that
proof. The backend's Redis-outage drill is separate.
