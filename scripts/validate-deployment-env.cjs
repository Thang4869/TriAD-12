"use strict";

function validateDeploymentApiUrl(value) {
  const message =
    "Set VITE_API_BASE_URL to the deployed HTTPS API URL ending in /api, without credentials, query or fragment";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(message);
  }

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !["/api", "/api/"].includes(url.pathname) ||
    url.search ||
    url.hash ||
    url.hostname === "localhost" ||
    url.hostname.endsWith(".localhost") ||
    /^127\./.test(url.hostname) ||
    url.hostname === "[::1]"
  ) {
    throw new Error(message);
  }

  return `${url.origin}/api`;
}

if (require.main === module) {
  try {
    validateDeploymentApiUrl(process.env.VITE_API_BASE_URL);
    console.log("Frontend deployment API URL is configured.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateDeploymentApiUrl };
