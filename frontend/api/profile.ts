const REQUEST_PATH = "/profile";
const ALLOWED_HTTP_METHODS = new Set(["GET", "HEAD"]);

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
  const accept = request.headers.get("accept");

  if (accept) {
    headers.set("accept", accept);
  }

  return headers;
}

function buildResponseHeaders(upstreamResponse: Response, requestMethod: string) {
  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const cacheControl = upstreamResponse.headers.get("cache-control");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (cacheControl) {
    headers.set("cache-control", cacheControl);
  } else if (requestMethod !== "GET") {
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

    let backendBaseUrl: string;

    try {
      backendBaseUrl = getBackendBaseUrl();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backend base URL is unavailable";

      return createErrorResponse(500, "Proxy Misconfigured", message);
    }

    const upstreamUrl = new URL(`${backendBaseUrl}${REQUEST_PATH}`);
    upstreamUrl.search = new URL(request.url).search;

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: buildUpstreamHeaders(request),
        redirect: "follow",
      });

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: buildResponseHeaders(upstreamResponse, request.method),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown upstream error";

      return createErrorResponse(502, "Upstream Request Failed", message);
    }
  },
};
