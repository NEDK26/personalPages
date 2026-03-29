import { put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import sharp from "sharp";

const MAX_LIFE_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
const THUMBNAIL_SIZE = 640;
const THUMBNAIL_CONTENT_TYPE = "image/webp";

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function getBackendBaseUrl() {
  const configuredBaseUrl =
    typeof process === "undefined" ? undefined : process.env.BACKEND_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    throw new HttpError(500, "Missing BACKEND_API_BASE_URL");
  }

  return configuredBaseUrl.endsWith("/") ? configuredBaseUrl.slice(0, -1) : configuredBaseUrl;
}

function getBlobToken() {
  const configuredToken = typeof process === "undefined" ? undefined : process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!configuredToken) {
    throw new HttpError(500, "Missing BLOB_READ_WRITE_TOKEN");
  }

  return configuredToken;
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

async function getResponseMessage(response: Response, fallbackMessage: string) {
  try {
    const payload: unknown = await response.json();

    if (typeof payload !== "object" || payload === null) {
      return fallbackMessage;
    }

    if (typeof (payload as { message?: unknown }).message === "string") {
      return (payload as { message: string }).message;
    }

    if (typeof (payload as { error?: unknown }).error === "string") {
      return (payload as { error: string }).error;
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function authenticateAdminRequest(request: Request, backendBaseUrl: string) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    throw new HttpError(401, "Missing admin authorization");
  }

  let authResponse: Response;

  try {
    authResponse = await fetch(`${backendBaseUrl}/admin/login`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization,
      },
      redirect: "follow",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown admin auth error";

    throw new HttpError(502, message);
  }

  if (authResponse.status === 401) {
    throw new HttpError(401, "账号或密码错误");
  }

  if (!authResponse.ok) {
    throw new HttpError(502, await getResponseMessage(authResponse, "管理员鉴权失败"));
  }
}

function isAllowedUploadPathname(pathname: string) {
  return pathname.startsWith("lives/") && !pathname.startsWith("lives/thumbs/");
}

function isThumbnailPathname(pathname: string) {
  return pathname.startsWith("lives/thumbs/");
}

function buildThumbnailPathname(pathname: string) {
  const fileName = pathname.split("/").pop() ?? pathname;
  const baseName = fileName.replace(/\.[^.]+$/, "");

  return `lives/thumbs/${baseName}.webp`;
}

async function createThumbnailBuffer(blobUrl: string) {
  const sourceResponse = await fetch(blobUrl, {
    redirect: "follow",
  });

  if (!sourceResponse.ok) {
    throw new Error(`Failed to fetch uploaded image: ${sourceResponse.status}`);
  }

  const sourceArrayBuffer = await sourceResponse.arrayBuffer();

  return sharp(Buffer.from(sourceArrayBuffer))
    .rotate()
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: "cover",
      position: sharp.strategy.attention,
    })
    .webp({
      quality: 80,
      effort: 4,
    })
    .toBuffer();
}

async function createLifeThumbnail(blobToken: string, blob: { url: string; pathname: string }) {
  if (!isAllowedUploadPathname(blob.pathname) || isThumbnailPathname(blob.pathname)) {
    return;
  }

  const thumbnailBuffer = await createThumbnailBuffer(blob.url);
  const thumbnailPathname = buildThumbnailPathname(blob.pathname);

  await put(thumbnailPathname, thumbnailBuffer, {
    access: "public",
    allowOverwrite: true,
    cacheControlMaxAge: UPLOAD_CACHE_MAX_AGE_SECONDS,
    contentType: THUMBNAIL_CONTENT_TYPE,
    token: blobToken,
  });
}

export default {
  async fetch(request: Request) {
    let body: HandleUploadBody;

    try {
      body = (await request.json()) as HandleUploadBody;
    } catch {
      return createErrorResponse(400, "Invalid upload payload", "Expected a Vercel Blob upload event body");
    }

    let backendBaseUrl: string;
    let blobToken: string;

    try {
      backendBaseUrl = getBackendBaseUrl();
      blobToken = getBlobToken();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload runtime is unavailable";
      const status = error instanceof HttpError ? error.status : 500;

      return createErrorResponse(status, "Upload Misconfigured", message);
    }

    if (body.type === "blob.generate-client-token") {
      if (!isAllowedUploadPathname(body.payload.pathname)) {
        return createErrorResponse(400, "Invalid upload pathname", "Lives uploads must use the lives/ path prefix");
      }

      try {
        await authenticateAdminRequest(request, backendBaseUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : "管理员鉴权失败";
        const status = error instanceof HttpError ? error.status : 500;

        return createErrorResponse(status, "Upload Unauthorized", message);
      }
    }

    try {
      const jsonResponse = await handleUpload({
        token: blobToken,
        request,
        body,
        onBeforeGenerateToken: async () => {
          return {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_LIFE_IMAGE_SIZE_BYTES,
            addRandomSuffix: true,
            cacheControlMaxAge: UPLOAD_CACHE_MAX_AGE_SECONDS,
          };
        },
        onUploadCompleted: async ({ blob }) => {
          try {
            await createLifeThumbnail(blobToken, {
              url: blob.url,
              pathname: blob.pathname,
            });
          } catch (error) {
            console.error("Failed to create life thumbnail", error);
          }
        },
      });

      return Response.json(jsonResponse, {
        headers: {
          "cache-control": "no-store",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown direct upload error";
      const status = error instanceof HttpError ? error.status : 500;

      return createErrorResponse(status, "Blob client upload failed", message);
    }
  },
};
