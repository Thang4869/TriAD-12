# TriAD Performance Audit

## Purpose

Capture repeatable Lighthouse lab reports for the production build on mobile and desktop. The reports are evidence for investigation, not a claim that Core Web Vitals pass real-user (field) thresholds.

## Prerequisites

- Node.js and npm versions supported by this repository.
- Google Chrome or Chromium installed and available to Lighthouse.
- Dependencies installed with `npm ci`.
- A clean production build.

Lighthouse is invoked through `npx`; it is not added as a runtime dependency. The first run may download the Lighthouse CLI.

## Reproducible local run

**PowerShell window 1 — build and serve the production output:**

```powershell
Set-Location -LiteralPath 'B:\Duong'
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Keep this window open.

**PowerShell window 2 — run both Lighthouse profiles:**

```powershell
Set-Location -LiteralPath 'B:\Duong'
npm run performance:audit -- --url http://127.0.0.1:4173
```

The command runs a default mobile profile and a desktop profile. It writes machine-readable reports to:

- `artifacts/performance/lighthouse-mobile.json`
- `artifacts/performance/lighthouse-desktop.json`

The output directory is intentionally local evidence and should not be committed by default. Preserve the reports when comparing runs.

## Metrics and interpretation

The runner prints the Performance score, FCP, LCP, INP (when the report exposes it), CLS and TBT. A lab run may not produce an INP value; do not substitute TBT and call it INP. Lighthouse lab measurements are sensitive to CPU load, browser version, network conditions, cache state and concurrent processes.

For a defensible comparison:

1. Record the commit SHA, date/time, Node/npm versions, Chrome version, OS, target URL and Lighthouse version.
2. Run each profile at least three times under the same conditions.
3. Compare medians, not the single best run.
4. Keep mobile and desktop results separate.
5. Treat CLS and LCP as lab diagnostics here; collect field data from CrUX or real-user monitoring before claiming field Core Web Vitals compliance.
6. Do not claim improvement unless the same environment and methodology show a repeatable change.

## Current status

This runner establishes the measurement procedure. Baseline values, bottleneck findings and post-change comparisons must be filled in only after reports have actually been generated and reviewed. No Lighthouse score or Core Web Vitals result is asserted by this document.
