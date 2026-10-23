import { createApiProxy } from "../server/api-proxy.js";

const proxy = createApiProxy({ secret: process.env.API_EDGE_SECRET });
export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
