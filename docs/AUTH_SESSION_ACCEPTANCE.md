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
