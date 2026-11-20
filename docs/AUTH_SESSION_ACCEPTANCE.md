# Auth/session acceptance — frontend #23 / backend #90

## Supported staging topology

The supported staging origin is https://triad-staging-three.vercel.app. Browser API calls use the same-origin /api route through the checked-in Vercel proxy to Render. Requests include credentials. Frontend JavaScript reads only the browser-readable CSRF cookie or JSON bootstrap value; it never reads HttpOnly access/refresh JWTs.

See [Authenticated API proxy](AUTHENTICATED_API_PROXY.md) for the proxy trust boundary and deployment requirements.

## Corrected session and cart behavior

- Login, logout and expiry use distinct event names. The earlier missing login/logout constants both resolved to undefined, causing login to dispatch both handlers and potentially clear the persisted cart.
- Login reloads the saved cart. Logout/expiry reset the local view without issuing DELETE /cart; explicit cart-clear and checkout operations remain separate.
- Responses started in an older session cannot repopulate the current cart view. Stale write results are surfaced as a session-change error; this does not undo a request already accepted by the server.
- A protected-request 401 expires the displayed identity with a Vietnamese sign-in instruction. It does not silently refresh or replay the protected write.
- A late 401 whose CSRF context has changed cannot sign out a newer login.
- Auth endpoints retain their own login/refresh/reload recovery. CSRF rejection explains that the page must be reloaded without silently replaying the rejected action.

## Local and CI verification

The original fix snapshot recorded **887 tests in 57 files**, a successful production build and 22 deployment-configuration safeguards. Those counts are historical measurements from that change, not the current test-suite total.

The latest recorded main-branch workflow is [run #44655347922](https://github.com/Thang4869/TriAD-12/actions/runs/44655347922), source `0779307564a218fd9d66a8e4d00fe8cb3852b38c` (`0779307`), dated 20 November 2026. All three jobs completed successfully:

- Unit/coverage, deployment safeguards, production build and browser E2E.
- Deployed HTTPS-origin/cookie acceptance job.
- Frontend/backend auth and checkout fullstack job using disposable PostgreSQL and Redis services.

A successful hosted-staging job means the job completed; it does not, on its own, disclose whether the credentialed browser scenario ran. Check the workflow summary and uploaded hosted-staging-auth-results artifact before claiming that a credentialed run was repeated.

The fullstack auth replay tests use disposable loopback fixtures only. In tests/fullstack/auth-session.spec.js, Playwright trace and video are explicitly disabled so auth request headers and test tokens are not retained in those artifacts. Do not weaken that setting or print cookie/token values.

For local checks:

~~~powershell
Set-Location -LiteralPath 'B:\Duong'
npm ci
npm run test:coverage
node --test tests/scripts/deployment-env.test.cjs tests/scripts/api-proxy.test.cjs
npm run build
~~~

The fullstack suite additionally requires its guarded disposable backend, PostgreSQL and Redis configuration. Never point it at a personal, shared or production database.

## Historical deployed HTTPS acceptance — 23 October 2026

The backend hardening was delivered in [TriAD-Backend PR #217](https://github.com/Thang4869/TriAD-Backend/pull/217). Its signed CSRF token preserves the existing 64-hex format, maintaining compatibility with the frontend's CSRF handling.

The final authenticated HTTPS acceptance was recorded in [GitHub Actions run #39967055295](https://github.com/Thang4869/TriAD-12/actions/runs/39967055295), manually dispatched on trusted main, source 7e345a3ac0de7c103ca058d5a9203e794905dc41. At that time:

- All three workflow jobs succeeded.
- Hosted Chromium reported five passed and zero skipped for the authenticated staging suite.
- Login used the same-origin HTTPS /api route.
- Cookie assertions covered Secure, SameSite, host-only domain, Path, HttpOnly access/refresh cookies and browser-readable CSRF.
- Missing/invalid CSRF was rejected; valid CSRF was accepted.
- Reload, second-tab CSRF bootstrap, refresh, logout and revoked-session access were exercised.
- The test used a dedicated staging account from GitHub Actions secrets. Raw passwords/JWTs were not exported; staging trace/video/screenshot capture was disabled.

The deployed identities recorded at that time were Render deployment dep-dbdm9n8ae00c738mhi10 and frontend Vercel source 7e345a3. These are historical deployment identities, not a claim about the current deployment.

**Accepted at that time:** [Frontend #23](https://github.com/Thang4869/TriAD-12/issues/23) and [Backend #90](https://github.com/Thang4869/TriAD-Backend/issues/90).

## Scope and limitations

This evidence applies to the recorded Vercel/Render staging topology and the test dates above. It does not establish arbitrary cross-site deployment support, production availability during Redis failure, or live public-client IP attribution through the newer edge-proxy path. Those require their own deployment evidence.
