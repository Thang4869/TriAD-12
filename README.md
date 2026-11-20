# TriAD

A multi-page kitchenware e-commerce storefront built with JavaScript, Vite and Tailwind CSS. The frontend integrates with the separate [TriAD Backend](https://github.com/Thang4869/TriAD-Backend) for authentication, catalog, cart, checkout and account workflows.

<p align="center">
  <img src="images/Banner.png" alt="TriAD project banner" width="100%" />
</p>

<p align="center">
  <a href="https://thang4869.github.io/TriAD-12/">GitHub Pages demo</a> ·
  <a href="https://triad-staging-three.vercel.app/">Vercel staging</a> ·
  <a href="https://github.com/Thang4869/TriAD-12">Source repository</a>
</p>

[![Test & Coverage](https://github.com/Thang4869/TriAD-12/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/Thang4869/TriAD-12/actions/workflows/test.yml)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

> **Deployment distinction:** GitHub Pages is the public static demo. Vercel staging is the integrated environment that routes same-origin /api requests through the server-side proxy to the Render staging API. Do not assume the Pages demo provides the authenticated backend workflows.

## Project scope

TriAD is organized as a multi-page browser application with feature modules and a separate backend. The frontend includes:

- Product browsing, search, sorting, filtering and product details.
- Cart interactions and server-backed cart state.
- Checkout quote review, order submission and idempotent retry handling.
- Sign-in, session restoration, logout and CSRF-protected writes.
- Account, profile, order-history and administration pages.
- Shared UI, application services and reusable domain-oriented modules.

The availability of protected features depends on the configured backend and the user's permissions.

## Technology

| Area | Technology |
|---|---|
| Runtime and package manager | Node.js 24, npm |
| Build and development | Vite 8 |
| UI styling | Tailwind CSS 4, CSS |
| Application code | JavaScript ES modules |
| Unit and integration tests | Vitest 5, Testing Library, jsdom |
| Browser tests | Playwright 1.62 |
| Code quality | ESLint, Prettier |
| Hosting | GitHub Pages demo, Vercel staging |
| API | Separate TriAD Backend on Render staging |

Versions above describe the repository's current toolchain and CI configuration; package ranges remain defined in package.json and package-lock.json.

## Architecture

~~~text
Browser
  |
  +-- Multi-page HTML entry points
  |
  +-- src/app/          Bootstrap and application orchestration
  |
  +-- src/modules/      Feature modules (products, cart, checkout, auth, ...)
  |
  +-- src/shared/       Shared services, models, repositories and utilities
  |
  +-- /api
        |
        +-- Local development: Vite proxy -> local backend
        |
        +-- Vercel staging: api/proxy.js -> server/api-proxy.js
                                      |
                                      +--> fixed Render staging API
~~~

The frontend does not own the production database or authentication secrets. Business-critical state and authorization are enforced by the backend; browser-side state is presentation state, not an authorization boundary.

## Repository layout

~~~text
.
├── api/                  # Vercel API route
├── pages/                # Multi-page HTML entry points and partials
├── scripts/              # Deployment guards and performance tooling
├── server/               # Server-side API proxy implementation
├── src/
│   ├── app/              # Bootstrap and app orchestration
│   ├── config/           # Frontend configuration
│   ├── modules/          # Feature modules
│   ├── shared/           # Shared models, repositories and services
│   ├── styles/           # Global and component styles
│   └── ui/               # Shared UI components
├── tests/
│   ├── e2e/              # Browser tests
│   ├── fullstack/        # Disposable frontend/backend journeys
│   ├── scripts/          # Deployment and proxy safeguards
│   └── staging/          # Public HTTPS staging checks
├── index.html
├── verify-email.html
├── vite.config.js
└── package.json
~~~

## Local development

Prerequisites:

- Node.js 24 (the version used by CI).
- npm.
- The TriAD backend running locally on port 5000 for API-backed workflows.

From PowerShell:

~~~powershell
Set-Location -LiteralPath 'B:\Duong'
npm ci
Copy-Item -Path '.env.example' -Destination '.env'
npm run dev
~~~

Vite serves the app on port 3000 by default and proxies /api to http://localhost:5000. If the backend listens on a different local address, set the proxy target before starting Vite:

~~~powershell
$env:VITE_DEV_API_PROXY_TARGET = 'http://127.0.0.1:5000'
npm run dev
~~~

Do not open the HTML files through file://; use the Vite server so routing, modules and API proxy behavior work as expected.

## Environment configuration

| Variable | Purpose | Exposure |
|---|---|---|
| VITE_API_BASE_URL | Browser API base; use /api for the supported same-origin setup | Public build-time configuration |
| VITE_DEV_API_PROXY_TARGET | Optional local Vite proxy destination; defaults to http://localhost:5000 | Local development only |
| API_EDGE_SECRET | Shared credential between the Vercel proxy and paired backend edge middleware | Server-only secret; never use a VITE_ prefix |

For Vercel staging, set VITE_API_BASE_URL=/api. Configure the same randomly generated API_EDGE_SECRET on Vercel and the paired Render service. The secret must be 32–256 characters and must never be committed or exposed to browser code.

The checked-in proxy uses a fixed Render staging upstream. Review the deployment and backend configuration before reusing it for another environment.

## Available scripts

| Command | Purpose |
|---|---|
| npm run dev | Start the Vite development server |
| npm run build | Build all configured pages into dist/ |
| npm run preview | Preview the production build |
| npm test -- --run | Run Vitest unit and integration tests once |
| npm run test:coverage | Run tests with coverage thresholds |
| npm run test:e2e | Run the Playwright browser suite |
| npm run test:e2e:fullstack | Run frontend/backend auth and checkout tests against disposable fixtures |
| npm run test:e2e:staging | Run browser checks against the configured staging environment |
| npm run performance:audit -- --url <URL> | Run mobile and desktop Lighthouse lab profiles |
| npm run format | Format repository files with Prettier |

**Test safety:** the fullstack suite requires a dedicated disposable PostgreSQL/Redis backend and guarded test configuration. Do not point it at a personal, shared or production database. The staging suite sends requests to the real staging deployment; run it deliberately and only when staging verification is intended.

## CI and verification

The Test & Coverage workflow runs:

1. Deployment-configuration and API-proxy safeguards.
2. Production build, unit/integration coverage and browser E2E tests.
3. Deployed HTTPS-origin checks.
4. Fullstack auth and checkout journeys against disposable PostgreSQL and Redis services, with the backend main branch checked out separately.

The main-branch workflow run on 20 November 2026 ([run #44655347922](https://github.com/Thang4869/TriAD-12/actions/runs/44655347922)) completed successfully across all three jobs. A successful hosted-staging job is not, by itself, proof that every credentialed scenario ran; check the workflow summary and uploaded result artifact before making that claim.

## Deployment

### Vercel staging

The checked-in vercel.json:

- Validates deployment environment configuration before building.
- Builds the Vite application into dist/.
- Routes /api/:path* to the server-side api/proxy.js function.
- Disables API response caching.

The proxy implementation is in server/api-proxy.js. It targets the configured fixed Render staging API and requires the server-only edge secret. See [Authenticated API proxy](docs/AUTHENTICATED_API_PROXY.md) before changing its destination, secret or backend trust configuration.

### GitHub Pages

The GitHub Pages URL is maintained as a static demo. Its hosting topology differs from Vercel staging; do not copy Vercel's server-only proxy assumptions or claim same-origin authenticated API support there without separately configuring and testing an appropriate backend route.

## Security boundaries

- Access and refresh JWTs are held in HttpOnly cookies; frontend JavaScript must not read or persist them.
- Mutating API requests use CSRF protection.
- Checkout retries retain the same idempotency key for an uncertain attempt.
- The Vercel proxy uses a fixed upstream and a server-only shared secret; browser-provided forwarding headers must not be treated as trusted identity.
- Never place database, SMTP, OAuth or payment credentials in VITE_* variables.
- Client-side validation and hidden UI controls do not replace backend authorization or validation.

See [Auth/session acceptance](docs/AUTH_SESSION_ACCEPTANCE.md) and [Authenticated API proxy](docs/AUTHENTICATED_API_PROXY.md).

## Performance

Performance work is tracked in [Issue #92](https://github.com/Thang4869/TriAD-12/issues/92). Recent merged changes include [PR #97](https://github.com/Thang4869/TriAD-12/pull/97) (layout shifts and image payload), [PR #98](https://github.com/Thang4869/TriAD-12/pull/98) (hero preload correction) and [PR #99](https://github.com/Thang4869/TriAD-12/pull/99) (icon weight loading).

No Lighthouse score or field Core Web Vitals result is claimed here. Follow [the performance audit procedure](docs/PERFORMANCE_AUDIT.md) and retain reproducible reports before publishing numerical comparisons.

## Project documentation

- [Authenticated API proxy](docs/AUTHENTICATED_API_PROXY.md)
- [Auth/session acceptance](docs/AUTH_SESSION_ACCEPTANCE.md)
- [Performance audit](docs/PERFORMANCE_AUDIT.md)
- [Backend repository](https://github.com/Thang4869/TriAD-Backend)
- [Open frontend issues](https://github.com/Thang4869/TriAD-12/issues)

## Contributing

Keep changes focused, add or update tests for behavior changes, run the relevant checks and open a pull request with the verification evidence. Do not include secrets, real user data or production credentials in commits, logs or test artifacts.
