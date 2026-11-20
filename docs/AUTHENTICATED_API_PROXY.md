# Authenticated staging API proxy

## Request path

The supported Vercel staging path is:

~~~text
Browser
  -> https://triad-staging-three.vercel.app/api/<path>
  -> vercel.json rewrite
  -> api/proxy.js
  -> server/api-proxy.js
  -> fixed https://triad-api-staging.onrender.com upstream
~~~

Set VITE_API_BASE_URL=/api. The browser stays on the frontend origin; the proxy performs the server-side request to Render.

## Trust boundary

The proxy:

- Accepts only the methods explicitly listed in server/api-proxy.js.
- Uses a fixed upstream; request path, query, Host and forwarding headers cannot select another destination.
- Reads the single x-vercel-forwarded-for value supplied by Vercel ingress and rejects a missing or invalid IP.
- Builds a fresh upstream header set from an allowlist, then sets x-triad-edge-key and x-triad-client-ip itself. Client-supplied XFF/real-IP and edge credential headers are not forwarded.
- Does not follow upstream redirects.
- Preserves request bodies, upstream status, CSRF and idempotency headers, and separate Set-Cookie response headers.
- Sets Cache-Control: no-store and avoids logging request bodies, cookies, IPs or provider error details.

This design relies on the Vercel ingress behavior for x-vercel-forwarded-for. A local unit test can verify proxy logic, but cannot prove what a live Vercel request receives at ingress.

## Required configuration

| Setting | Location | Requirement |
|---|---|---|
| VITE_API_BASE_URL | Vercel build environment | /api |
| API_EDGE_SECRET | Vercel server environment | Random server-only value, 32–256 characters |
| API_EDGE_SECRET | Paired Render backend environment | Exact same secret as Vercel |

Never prefix the edge secret with VITE_, expose it to browser code, commit it or print it in logs. A missing, invalid or mismatched secret must fail closed.

## Deployment and rollback

Use a coordinated frontend/backend rollout:

1. Deploy the backend edge middleware with its enforcement gate disabled.
2. Configure the same server-only API_EDGE_SECRET on Vercel and the paired Render service.
3. Deploy the frontend proxy and verify catalog, authentication, cookies and CSRF through the Vercel origin.
4. Enable the backend edge gate while keeping TRUST_PROXY=0; do not enable broad forwarded-header trust as a shortcut.
5. Verify that direct unauthenticated Render API requests are rejected while intended health checks remain available.
6. Record the deployed frontend/backend commit and deployment identities.

For rollback, disable the backend edge gate first. Only then revert the frontend proxy or its routing configuration. Do not remove or rotate one side of the shared secret independently during an active rollout.

## Hosting constraints

- Vercel's function request-body limit is 4.5 MB, including multipart overhead. Larger admin image uploads need resizing or a separately reviewed direct-upload design.
- The backend's larger direct-upload limit does not override the Vercel function limit.
- OAuth callback URLs must use the frontend /api origin after edge-gate activation. Direct Render API callbacks are intentionally rejected by the gated topology.
- The checked-in upstream is the Render staging API. Review the destination and backend trust configuration before using this proxy for another environment.

## Acceptance status and remaining verification

Backend [Issue #140](https://github.com/Thang4869/TriAD-Backend/issues/140) is closed. Its recorded hosted canary nevertheless observed req.ip=::1 on both direct Render and the earlier Vercel rewrite path; that observation did **not** prove independent public-client IP attribution. The edge proxy in this repository now forwards the Vercel-ingress address through the authenticated edge headers, but the code and local tests alone do not prove the deployed end-to-end identity boundary.

Before treating public client-IP attribution as verified, capture a controlled live canary that demonstrates all of the following:

- Render receives the expected client identity through the authenticated edge path.
- Forged client XFF/real-IP headers cannot change that identity.
- Direct-origin API requests cannot bypass the edge gate.
- Independent network sources receive independent budgets, while shared-NAT behavior is understood.
- The deployed HTTPS cookie/CSRF journey remains successful.

The backend Redis-outage/readiness drill is a separate acceptance item. Do not infer its result from this proxy document or from a successful frontend CI run.
