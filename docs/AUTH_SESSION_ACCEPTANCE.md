# Auth/session acceptance — #23 / backend #90

The supported staging origin is `https://triad-staging-three.vercel.app`, using
the checked-in same-origin `/api` rewrite to Render. Requests use
`credentials: include`; frontend code reads only the readable CSRF cookie or
JSON bootstrap, never HttpOnly access/refresh JWTs.

## Corrected behavior

- Login, logout and expiry have distinct event names. Previously the missing
  login/logout constants both resolved to `undefined`, so login dispatched both
  handlers and could clear the persisted cart.
- Login reloads the saved cart. Logout/expiry reset the local view without a
  `DELETE /cart` call. An explicit checkout/cart-clear operation still clears
  the server cart.
- Responses started in an older session cannot repopulate the current cart
  view. Stale write results are reported as a session-change error; this does
  not undo a request already accepted by the server.
- A protected-request 401 expires the displayed identity with a Vietnamese
  sign-in instruction. It does not call logout, refresh or retry the write.
  A late 401 whose CSRF context has changed cannot sign out a newer login.
- Auth endpoints retain their own login/refresh/reload recovery. CSRF rejection
  explains that the page must be reloaded, without discarding a valid identity
  or silently replaying the rejected action.

## Evidence and reproducible checks

Before the fix, two tests using the real auth event bus failed: the saved cart
was empty after login, and an expired write retained the cached identity/raw
error. After the fix, local coverage passed **887 tests in 57 files**, the
production build passed, and all **22 deployment configuration safeguards**
passed. This does not claim local PostgreSQL/Redis fullstack execution.

```powershell
Set-Location B:\Duong
npm ci
npm run test:coverage
node --test tests/scripts/deployment-env.test.cjs
npm run build
```

Expected: all listed tests/checks pass. The repository CI additionally runs the
mock browser suite and the real PostgreSQL/Redis fullstack suite. The new
fullstack scenario keeps a page open, removes only the disposable fixture's
access cookie, submits one protected write, verifies 401 without a refresh or
replay, signs in explicitly, and verifies the previously saved cart remains.
It then removes its fixture and logs out. Auth traces/video are disabled.

## Deployment acceptance (historical gap, closed on 2026-10-23)

The backend hardening is [TriAD-Backend PR #217](https://github.com/Thang4869/TriAD-Backend/pull/217).
Its signed CSRF token preserves the existing 64-hex format, so this frontend
remains compatible with both the previous and signed-CSRF backend.

These were the outstanding verification requirements before the actual hosted
Chromium acceptance run below. The full authenticated test ran successfully on
2026-10-23, not just on loopback; local browser tests still provide additional
expiry/regression coverage. No JWT values were exported.

## Hosted HTTPS browser test — 2026-10-23 (#23 / Backend #90)

- Backend deployed to Render Singapore: `triad-api-staging`, deployment
  `dep-dbdm9n8ae00c738mhi10`, source
  `d986ced677cd1e42c3b4fd23999a6bbed5c6f10c`, status **live**.
  Render health log returned HTTP 200 for `/health/ready`.
- Frontend canonical origin: `https://triad-staging-three.vercel.app`;
  deployment `dpl_E7qerinuKs53La4HFaRCqDXPEaRy`,
  source `1c312eb7ac14ea8d981f46448c05403aeff75229`.
- The Playwright test `tests/staging/auth-origin.spec.js` uses actual public
  HTTPS Vercel/Render endpoints, unlike local loopback fullstack tests.
  First PR CI run:
  [GitHub Actions #39964964556](https://github.com/Thang4869/TriAD-12/actions/runs/39964964556).
  **4 PASS, 1 SKIPPED:** canonical origin/proxy, anonymous CSRF/refresh,
  allowed/blocked Render CORS preflight and simple-form login rejection.
- The credentialed scenario is deliberately **not PASS** until a disposable,
  verified, dedicated staging account (with 2FA disabled for this scenario)
  has completed login → cookie flags/host-only Path → missing/invalid/valid CSRF
  → reload/second tab → refresh → logout in actual Chromium.

### Final authenticated HTTPS acceptance — PASS (2026-10-23)

- **Run:** [GitHub Actions #39967055295](https://github.com/Thang4869/TriAD-12/actions/runs/39967055295), manually dispatched on trusted `main`, source `7e345a3ac0de7c103ca058d5a9203e794905dc41`, conclusion `success`.
- **Jobs:** 3/3 succeeded (unit/coverage + browser, disposable PostgreSQL/Redis fullstack, deployed HTTPS acceptance).
- **Live hosted Chromium:** **5 passed, 0 skipped**, in 11.6 seconds, at `tests/staging/auth-origin.spec.js`. All hosted checks used Vercel `https://triad-staging-three.vercel.app` and Render `https://triad-api-staging.onrender.com`; the remaining authenticated scenario received configured GitHub repository secrets in the trusted `main` workflow.
- **Auth browser assertions:** login through same-origin HTTPS `/api`; cookies `Secure`, `SameSite=None`, host-only domain and `Path=/`; access/refresh `HttpOnly`, CSRF browser-readable, no JWTs in JSON; missing/invalid CSRF 403 and valid CSRF allowed through middleware; reload, second-tab CSRF bootstrap, refresh, logout, cookie removal, and protected access after logout 401.
- **Unauthenticated assertions:** HTTPS origin and catalog rewrite; missing session CSRF/refresh rejected; valid and disallowed CORS origins via Render; rejected simple-form login did not issue cookies.
- **Deploy identity:** Render `dep-dbdm9n8ae00c738mhi10` (`d986ced677cd1e42c3b4fd23999a6bbed5c6f10c`, live). Frontend Vercel deployed source `7e345a3`.
- **Security boundary:** Staging-only dedicated test account stored in GitHub Actions secrets, no raw password/JWT values emitted, and trace/video/screenshot capture disabled. Secrets never run on untrusted PR events.

**Accepted:** [Frontend #23](https://github.com/Thang4869/TriAD-12/issues/23) and [Backend #90](https://github.com/Thang4869/TriAD-Backend/issues/90). This verifies the current deployed same-origin proxy topology and session behavior, not arbitrary cross-site deployments or availability during a Redis outage. The later cases remain in dedicated reliability/proxy work.
