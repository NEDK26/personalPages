const PUBLIC_ROUTE_ALLOWLIST = new Set([
  "/health",
  "/highlights",
  "/lives",
  "/now",
  "/profile",
]);

const ADMIN_ROUTE_PREFIX = "/admin";
const ALLOWED_HTTP_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "PATCH"]);

function normalizeBackendBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizeRequestPath(pathname: string) {
  const pathWithoutApiPrefix = pathname.startsWith("/api") ? pathname.slice(4) || "/" : pathname;

  if (pathWithoutApiPrefix.length > 1 && pathWithoutApiPrefix.endsWith("/")) {
    return pathWithoutApiPrefix.slice(0, -1);
  }

  return pathWithoutApiPrefix;
}

function normalizeRewrittenRoute(route: string) {
  const trimmedRoute = route.trim().replace(/^\/+/, "");

  if (trimmedRoute.length === 0) {
    return "/";
  }

  return normalizeRequestPath(`/${trimmedRoute}`);
}

function resolveRequestPath(incomingUrl: URL) {
  const rewrittenRoute = incomingUrl.searchParams.get("route");

  if (rewrittenRoute) {
    return normalizeRewrittenRoute(rewrittenRoute);
  }

  return normalizeRequestPath(incomingUrl.pathname);
}

function getBackendBaseUrl() {
  const configuredBaseUrl = process.env.BACKEND_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    throw new Error("Missing BACKEND_API_BASE_URL");
  }

  return normalizeBackendBaseUrl(configuredBaseUrl);
}

function createErrorResponse(status: number, error: string, message?: string) {
  return Response.json(
    {
      error,
      ...(message ? { message } : {}),
    },
    {
      status,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

function buildUpstreamHeaders(request: Request) {
  const headers = new Headers();
  const accept = request.headers.get("accept");
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (accept) {
    headers.set("accept", accept);
  }

  if (authorization) {
    headers.set("authorization", authorization);
  }

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return headers;
}

function buildResponseHeaders(upstreamResponse: Response, requestPath: string, requestMethod: string) {
  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const cacheControl = upstreamResponse.headers.get("cache-control");
  const isAdminRoute = requestPath.startsWith(ADMIN_ROUTE_PREFIX);
  const shouldDisableCache = isAdminRoute || requestMethod !== "GET";

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  } else if (shouldDisableCache) {
    headers.set("cache-control", "no-store");
  } else if (upstreamResponse.ok) {
    headers.set("cache-control", "public, s-maxage=60, stale-while-revalidate=300");
  }

  return headers;
}

export default {
  async fetch(request: Request) {
    if (!ALLOWED_HTTP_METHODS.has(request.method)) {
      return new Response(null, {
        status: 405,
        headers: {
          Allow: Array.from(ALLOWED_HTTP_METHODS).join(", "),
        },
      });
    }

    const incomingUrl = new URL(request.url);
    const requestPath = resolveRequestPath(incomingUrl);

    const isPublicRoute = PUBLIC_ROUTE_ALLOWLIST.has(requestPath);
    const isAdminRoute = requestPath.startsWith(ADMIN_ROUTE_PREFIX);

    if (!isPublicRoute && !isAdminRoute) {
      return createErrorResponse(404, "Not Found", `Unsupported public route: ${requestPath}`);
    }

    let backendBaseUrl: string;

    try {
      backendBaseUrl = getBackendBaseUrl();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backend base URL is unavailable";

      return createErrorResponse(500, "Proxy Misconfigured", message);
    }

    const upstreamUrl = new URL(`${backendBaseUrl}${requestPath}`);
    const upstreamSearchParams = new URLSearchParams(incomingUrl.search);
    upstreamSearchParams.delete("route");
    upstreamUrl.search = upstreamSearchParams.toString();

    try {
      const requestBody = request.method === "GET" || request.method === "HEAD" ? undefined : request.body;
      const upstreamRequestInit: RequestInit & { duplex?: "half" } = {
        method: request.method,
        headers: buildUpstreamHeaders(request),
        body: requestBody,
        signal: request.signal,
        redirect: "follow",
      };

      if (requestBody) {
        upstreamRequestInit.duplex = "half";
      }

      const upstreamResponse = await fetch(upstreamUrl, upstreamRequestInit);

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: buildResponseHeaders(upstreamResponse, requestPath, request.method),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upstream error";

      return createErrorResponse(502, "Upstream Request Failed", message);
    }
  },
};
