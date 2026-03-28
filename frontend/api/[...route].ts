const PUBLIC_ROUTE_ALLOWLIST = new Set([
  "/health",
  "/highlights",
  "/lives",
  "/now",
  "/profile",
]);

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

  if (accept) {
    headers.set("accept", accept);
  }

  return headers;
}

function buildResponseHeaders(upstreamResponse: Response) {
  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const cacheControl = upstreamResponse.headers.get("cache-control");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  } else if (upstreamResponse.ok) {
    headers.set("cache-control", "public, s-maxage=60, stale-while-revalidate=300");
  }

  return headers;
}

export default {
  async fetch(request: Request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, {
        status: 405,
        headers: {
          Allow: "GET, HEAD",
        },
      });
    }

    const incomingUrl = new URL(request.url);
    const requestPath = normalizeRequestPath(incomingUrl.pathname);

    if (!PUBLIC_ROUTE_ALLOWLIST.has(requestPath)) {
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
    upstreamUrl.search = incomingUrl.search;

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: buildUpstreamHeaders(request),
        signal: request.signal,
        redirect: "follow",
      });

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: buildResponseHeaders(upstreamResponse),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upstream error";

      return createErrorResponse(502, "Upstream Request Failed", message);
    }
  },
};
