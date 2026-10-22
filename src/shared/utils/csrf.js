let csrfToken = null;

export function setCsrfToken(token) {
  csrfToken = typeof token === "string" && token ? token : null;
}

export function getCsrfToken() {
  return csrfToken;
}

export function readSameOriginCsrfCookie(apiBaseURL) {
  try {
    if (
      typeof apiBaseURL !== "string" ||
      !apiBaseURL ||
      new URL(apiBaseURL, window.location.href).origin !==
        window.location.origin
    ) {
      return null;
    }

    const cookie = document.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("csrfToken="));
    const token =
      cookie && decodeURIComponent(cookie.slice("csrfToken=".length));
    return typeof token === "string" && /^[a-f0-9]{64}$/i.test(token)
      ? token
      : null;
  } catch {
    return null;
  }
}

export function clearCsrfToken() {
  csrfToken = null;
}
