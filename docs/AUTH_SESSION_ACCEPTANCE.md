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

## Deployment acceptance still required

The backend hardening is [TriAD-Backend PR #217](https://github.com/Thang4869/TriAD-Backend/pull/217).
Its signed CSRF token preserves the existing 64-hex format, so this frontend
remains compatible with both the previous and signed-CSRF backend.

Record exact reviewed commits and live deployment IDs after merge. On the new
HTTPS deployment, verify cookie Secure/SameSite/host-only/Path behavior, allowed
and denied browser origins, reload recovery, another tab renewing CSRF, and the
open-page expiry UX. Use disposable sessions for negative/replay probes; never
export a real hosted user's JWTs. Local loopback browser tests are not evidence
of hosted HTTPS cookie acceptance. Keep backend #90/frontend #23 open until the
deployed evidence is recorded.

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

### Completing the final credentialed acceptance safely

1. Create or identify a **dedicated staging-only test account**, not a real
   personal login or production account. Confirm email verification is complete
   and 2FA is disabled for this disposable fixture only.
2. In the **TriAD-12 GitHub repository**, go to
   `Settings → Secrets and variables → Actions` and configure the encrypted
   repository secrets `STAGING_AUTH_EMAIL` and `STAGING_AUTH_PASSWORD`.
   Do **not** paste the password in a PR, issue, log or chat.
3. The `hosted-staging-auth` CI job deliberately never passes these secrets
   to pull-request code; only a trusted `main` run may execute authenticated
   tests. Open `Actions → Test & Coverage → Run workflow`, select branch
   `main`, then inspect the `Deployed HTTPS origin / cookie acceptance` job.
4. Require **5 PASS / 0 SKIPPED** and exact source/deployment IDs, with
   `test:coverage`, fullstack, build and security checks green. The test
   disables trace, video and screenshots; it does not emit cookie/JWT values.
5. Inspect any failures and fix the actual Vercel rewrite, cookie/CORS settings
   or session behavior as needed. **Only then close Backend #90 and FE #23.**

Never use the existing loopback fixture `user@example.com/user123` against
hosted staging. Negative tests do not substitute for authenticated HTTPS
browser acceptance; leave both issues open while credentials are absent.
