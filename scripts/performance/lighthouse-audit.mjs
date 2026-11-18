import { mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const urlIndex = args.findIndex((arg) => arg === "--url");
const inlineUrl = args.find((arg) => arg.startsWith("--url="));
const targetUrl = inlineUrl
  ? inlineUrl.slice("--url=".length)
  : urlIndex >= 0
    ? args[urlIndex + 1]
    : null;

if (!targetUrl) {
  console.error(
    "Usage: npm run performance:audit -- --url http://127.0.0.1:4173",
  );
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(targetUrl);
} catch {
  console.error("The audit URL must be a valid absolute HTTP(S) URL.");
  process.exit(1);
}

if (!["http:", "https:"].includes(parsedUrl.protocol)) {
  console.error("Only HTTP and HTTPS URLs can be audited.");
  process.exit(1);
}

const outputDirectory = resolve("artifacts/performance");
await mkdir(outputDirectory, { recursive: true });

const profiles = [
  { name: "mobile", flags: [] },
  { name: "desktop", flags: ["--preset=desktop"] },
];

for (const profile of profiles) {
  const outputPath = resolve(outputDirectory, `lighthouse-${profile.name}.json`);
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    throw new Error("Run this audit through npm so npm_execpath is available.");
  }

  const commandArgs = [
    npmCli,
    "exec",
    "--yes",
    "--package=lighthouse",
    "--",
    "lighthouse",
    targetUrl,
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outputPath}`,
    "--chrome-flags=--headless --no-sandbox",
    ...profile.flags,
  ];

  console.log(`\nRunning Lighthouse (${profile.name}) for ${targetUrl}`);
  const result = spawnSync(process.execPath, commandArgs, {
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  const report = JSON.parse(await readFile(outputPath, "utf8"));
  const audits = report.audits ?? {};
  const metric = (id) => {
    const value = audits[id]?.numericValue;
    return Number.isFinite(value) ? Math.round(value * 100) / 100 : "not available";
  };
  const score = report.categories?.performance?.score;

  console.log(`Lighthouse ${profile.name} summary`);
  console.log(`Performance score: ${score == null ? "not available" : Math.round(score * 100)}`);
  console.log(`FCP (ms): ${metric("first-contentful-paint")}`);
  console.log(`LCP (ms): ${metric("largest-contentful-paint")}`);
  console.log(`INP (ms): ${metric("interaction-to-next-paint")}`);
  console.log(`CLS: ${metric("cumulative-layout-shift")}`);
  console.log(`TBT (ms): ${metric("total-blocking-time")}`);
  console.log(`Report: ${outputPath}`);
}

console.log("\\nBoth Lighthouse profiles completed. Review the reports before claiming a performance improvement.");
