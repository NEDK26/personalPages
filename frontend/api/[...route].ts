import { proxyToBackend } from "./_lib/vercel-proxy";

const PUBLIC_ROUTE_ALLOWLIST = new Set(["/health", "/highlights", "/lives", "/now", "/profile"]);

function normalizeRequestPath(pathname: string) {
  const pathWithoutApiPrefix = pathname.startsWith("/api") ? pathname.slice(4) || "/" : pathname;

  if (pathWithoutApiPrefix.length > 1 && pathWithoutApiPrefix.endsWith("/")) {
    return pathWithoutApiPrefix.slice(0, -1);
  }

  return pathWithoutApiPrefix;
}

export default {
  async fetch(request: Request) {
    const incomingUrl = new URL(request.url);
    const requestPath = normalizeRequestPath(incomingUrl.pathname);

    if (!PUBLIC_ROUTE_ALLOWLIST.has(requestPath)) {
      return Response.json(
        {
          error: "Not Found",
          message: `Unsupported public route: ${requestPath}`,
        },
        {
          status: 404,
          headers: {
            "cache-control": "no-store",
          },
        },
      );
    }

    return proxyToBackend(request, requestPath);
  },
};
