"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const {
  validateDeploymentApiUrl,
} = require("../../scripts/validate-deployment-env.cjs");

test("accepts a deployed HTTPS API URL and normalizes a trailing slash", () => {
  for (const value of [
    "https://api.example.com/api",
    "https://api.example.com/api/",
  ]) {
    assert.equal(
      validateDeploymentApiUrl(value),
      "https://api.example.com/api",
    );
  }
});

for (const [name, value] of [
  ["missing", undefined],
  ["unconfigured relative path", "/backend/api"],
  ["insecure HTTP", "http://api.example.com/api"],
  ["loopback hostname", "https://localhost/api"],
  ["loopback IPv4", "https://127.0.0.1/api"],
  ["loopback IPv6", "https://[::1]/api"],
  ["wrong API path", "https://api.example.com/"],
  ["embedded credentials", "https://user:private-value@api.example.com/api"],
  ["query credentials", "https://api.example.com/api?key=private-value"],
  ["fragment", "https://api.example.com/api#private-value"],
]) {
  test(`rejects ${name} without printing credentials`, () => {
    assert.throws(
      () => validateDeploymentApiUrl(value),
      (error) => {
        assert.match(error.message, /VITE_API_BASE_URL/);
        assert.doesNotMatch(error.message, /private-value/);
        return true;
      },
    );
  });
}

test("accepts the same-origin API only with the checked-in HTTPS proxy", () => {
  assert.equal(validateDeploymentApiUrl("/api"), "/api");
});

for (const [name, rewrites] of [
  ["missing proxy", []],
  [
    "wrong source",
    [
      {
        source: "/backend/:path*",
        destination: "https://api.example.com/api/:path*",
      },
    ],
  ],
  [
    "insecure destination",
    [
      {
        source: "/api/:path*",
        destination: "http://api.example.com/api/:path*",
      },
    ],
  ],
  [
    "loopback destination",
    [{ source: "/api/:path*", destination: "https://localhost/api/:path*" }],
  ],
  [
    "missing wildcard",
    [{ source: "/api/:path*", destination: "https://api.example.com/api" }],
  ],
  [
    "wrong destination path",
    [{ source: "/api/:path*", destination: "https://api.example.com/:path*" }],
  ],
  [
    "embedded credentials",
    [
      {
        source: "/api/:path*",
        destination: "https://user:private-value@api.example.com/api/:path*",
      },
    ],
  ],
  [
    "query credentials",
    [
      {
        source: "/api/:path*",
        destination: "https://api.example.com/api/:path*?key=private-value",
      },
    ],
  ],
]) {
  test(`rejects a same-origin API with ${name}`, () => {
    assert.throws(
      () => validateDeploymentApiUrl("/api", rewrites),
      (error) => {
        assert.match(error.message, /VITE_API_BASE_URL/);
        assert.doesNotMatch(error.message, /private-value/);
        return true;
      },
    );
  });
}

test("the build guard accepts the configured same-origin API", () => {
  const child = spawnSync(
    process.execPath,
    [path.resolve(__dirname, "../../scripts/validate-deployment-env.cjs")],
    {
      env: { ...process.env, VITE_API_BASE_URL: "/api" },
      encoding: "utf8",
      timeout: 5000,
    },
  );
  assert.equal(child.status, 0);
  assert.match(child.stdout, /configured/);
});

test("the build guard exits unsuccessfully when hosting configuration is missing", () => {
  const env = { ...process.env };
  delete env.VITE_API_BASE_URL;
  const child = spawnSync(
    process.execPath,
    [path.resolve(__dirname, "../../scripts/validate-deployment-env.cjs")],
    { env, encoding: "utf8", timeout: 5000 },
  );
  assert.equal(child.status, 1);
  assert.match(child.stderr, /VITE_API_BASE_URL/);
});
