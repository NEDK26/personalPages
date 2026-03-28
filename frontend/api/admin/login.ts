const REQUEST_PATH = "/admin/login";
const ALLOWED_HTTP_METHODS = new Set(["POST"]);

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

function buildResponseHeaders(upstreamResponse: Response) {
  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const cacheControl = upstreamResponse.headers.get("cache-control");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  headers.set("cache-control", cacheControl ?? "no-store");

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

    try {
      const requestBody = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: buildUpstreamHeaders(request),
        body: requestBody,
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
