let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = typeof token === "string" && token ? token : null;
}

export function getCsrfToken() {
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}
