interface ProxyHandlerOptions {
  path: string;
  methods: readonly string[];
  cachePublicGet?: boolean;
}

function getBackendBaseUrl() {
  const configuredBaseUrl =
    typeof process === "undefined" ? undefined : process.env.BACKEND_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    throw new Error("Missing BACKEND_API_BASE_URL");
  }

  return configuredBaseUrl.endsWith("/") ? configuredBaseUrl.slice(0, -1) : configuredBaseUrl;
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

  for (const headerName of [
    "accept",
    "content-type",
    "cookie",
    "origin",
    "x-csrf-token",
    "x-forwarded-for",
    "x-real-ip",
  ]) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

function buildResponseHeaders(upstreamResponse: Response, requestMethod: string, cachePublicGet: boolean) {
  const headers = new Headers();

  for (const headerName of ["content-type", "set-cookie", "retry-after"]) {
    const value = upstreamResponse.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  const upstreamCacheControl = upstreamResponse.headers.get("cache-control");

  if (upstreamCacheControl) {
    headers.set("cache-control", upstreamCacheControl);
  } else if (cachePublicGet && requestMethod === "GET" && upstreamResponse.ok) {
    headers.set("cache-control", "public, s-maxage=60, stale-while-revalidate=300");
  } else {
    headers.set("cache-control", "no-store");
  }

  return headers;
}

export function createProxyHandler({ path, methods, cachePublicGet = false }: ProxyHandlerOptions) {
  const allowedMethods = new Set(methods);

  return {
    async fetch(request: Request) {
      if (!allowedMethods.has(request.method)) {
        return new Response(null, {
          status: 405,
          headers: {
            Allow: Array.from(allowedMethods).join(", "),
          },
        });
      }

      let backendBaseUrl: string;

      try {
        backendBaseUrl = getBackendBaseUrl();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Backend base URL is unavailable";

        return createErrorResponse(500, "Proxy Misconfigured", message);
      }

      const upstreamUrl = new URL(`${backendBaseUrl}${path}`);
      upstreamUrl.search = new URL(request.url).search;

      try {
        const requestBody = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
        const upstreamResponse = await fetch(upstreamUrl, {
          method: request.method,
          headers: buildUpstreamHeaders(request),
          body: requestBody,
          redirect: "follow",
        });

        return new Response(upstreamResponse.body, {
          status: upstreamResponse.status,
          headers: buildResponseHeaders(upstreamResponse, request.method, cachePublicGet),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown upstream error";

        return createErrorResponse(502, "Upstream Request Failed", message);
      }
    },
  };
}
