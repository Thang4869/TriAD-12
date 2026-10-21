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
  ["relative local proxy", "/api"],
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
