# TriAD Performance Audit

## Purpose

This document defines a repeatable Lighthouse lab procedure for the production build on mobile and desktop. Lab reports support investigation and comparison; they do not establish real-user Core Web Vitals compliance.

## Prerequisites

- Node.js 24 and npm (the versions used by CI).
- Google Chrome or Chromium available to Lighthouse.
- Dependencies installed with npm ci.
- A clean production build.

The audit runner invokes Lighthouse through npm exec; Lighthouse is not a runtime dependency. The first run may download the CLI package.

## Reproducible local run

**PowerShell window 1 — build and serve the production output:**

~~~powershell
Set-Location -LiteralPath 'B:\Duong'
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
~~~

Keep this window open.

**PowerShell window 2 — run both Lighthouse profiles:**

~~~powershell
Set-Location -LiteralPath 'B:\Duong'
npm run performance:audit -- --url http://127.0.0.1:4173
~~~

The runner executes a default mobile profile and a desktop profile. It writes machine-readable reports to:

- artifacts/performance/lighthouse-mobile.json
- artifacts/performance/lighthouse-desktop.json

The output directory is local evidence and should not be committed by default. Preserve the reports when comparing runs.

## Metrics and interpretation

The runner prints Performance score, FCP, LCP, INP (when exposed by the report), CLS and TBT. A Lighthouse lab run may not produce an INP value; do not substitute TBT and label it INP.

Lighthouse results vary with CPU load, browser version, network conditions, cache state and concurrent processes. For a defensible comparison:

1. Record commit SHA, date/time, Node/npm versions, Chrome version, OS, target URL and Lighthouse version.
2. Run each profile at least three times under the same conditions.
3. Compare medians, not the single best run.
4. Keep mobile and desktop results separate.
5. Treat lab LCP/CLS as diagnostics. Use CrUX or real-user monitoring before making field Core Web Vitals claims.
6. Claim improvement only when the same environment and methodology show a repeatable change.

## Current project status — 20 November 2026

[Issue #92](https://github.com/Thang4869/TriAD-12/issues/92) remains open. Recent implementation changes associated with the performance work have merged:

- [PR #97](https://github.com/Thang4869/TriAD-12/pull/97): reduce homepage layout shifts and image payload.
- [PR #98](https://github.com/Thang4869/TriAD-12/pull/98): remove a mismatched hero-image preload.
- [PR #99](https://github.com/Thang4869/TriAD-12/pull/99): load only the required regular and fill icon weights.

The repository does not currently publish reproducible Lighthouse baseline and post-change medians in this document. Therefore no numerical performance gain, Lighthouse score or field Core Web Vitals pass is asserted here. Generate and review the reports above before adding such claims or closing the measurement work.
