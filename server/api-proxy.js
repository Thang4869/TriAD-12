import { isIP } from "node:net";

// Fixed upstream: neither URL query, Host nor forwarding headers select a target.
const UPSTREAM = "https://triad-api-staging.onrender.com";
const METHODS = new Set([
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
]);
const REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "content-type",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "x-csrf-token",
  "idempotency-key",
];
const OMIT_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "trailer",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "content-encoding",
  "content-length",
  "set-cookie",
  "x-triad-edge-key",
  "x-triad-client-ip",
]);

export function createApiProxy({ secret, fetchImpl = fetch } = {}) {
  return async function proxy(request) {
    const fail = (status, error) =>
      Response.json(
        { success: false, error },
        { status, headers: { "cache-control": "no-store" } },
      );
    if (
      typeof secret !== "string" ||
      secret.length < 32 ||
      secret.length > 256
    ) {
      return fail(503, "API proxy is not configured");
    }
    if (!METHODS.has(request.method)) return fail(405, "Method not allowed");
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/"))
      return fail(404, "API route not found");

    // Vercel overwrites this header at its ingress. No XFF/real-ip fallback.
    // Local tests inject RFC5737 fixtures; only the deployed Vercel function is trusted.
    const ip = request.headers.get("x-vercel-forwarded-for");
    if (!ip || !isIP(ip))
      return fail(503, "Trusted client address unavailable");
    const headers = new Headers();
    for (const name of REQUEST_HEADERS) {
      const value = request.headers.get(name);
      if (value !== null) headers.set(name, value);
    }
    headers.set("x-triad-edge-key", secret);
    headers.set("x-triad-client-ip", ip);
    // Avoid compression ambiguity when copying a fetch-decoded response body.
    headers.set("accept-encoding", "identity");

    try {
      const upstream = await fetchImpl(
        new URL(url.pathname + url.search, UPSTREAM),
        {
          method: request.method,
          headers,
          body: ["GET", "HEAD"].includes(request.method)
            ? undefined
            : request.body,
          duplex: "half",
          redirect: "manual", // Never forward cookies or edge credentials across redirects.
          signal: AbortSignal.any([
            request.signal,
            AbortSignal.timeout(90_000),
          ]),
        },
      );
      const responseHeaders = new Headers();
      for (const [name, value] of upstream.headers) {
        if (!OMIT_RESPONSE_HEADERS.has(name)) responseHeaders.set(name, value);
      }
      // Separate Set-Cookie headers preserve login, refresh and logout scopes.
      for (const cookie of upstream.headers.getSetCookie()) {
        responseHeaders.append("set-cookie", cookie);
      }
      responseHeaders.set("cache-control", "no-store");
      return new Response(request.method === "HEAD" ? null : upstream.body, {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch {
      // No headers, URLs, request bodies, IPs or provider errors enter logs/responses.
      console.error("API proxy upstream request failed");
      return fail(502, "API temporarily unavailable");
    }
  };
}
