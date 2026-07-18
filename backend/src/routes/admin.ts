import { createHmac, timingSafeEqual } from "node:crypto";

import { put } from "@vercel/blob";
import { Hono } from "hono";
import sharp from "sharp";
import { z } from "zod";

import {
  clearAdminSession,
  createAdminSession,
  getAdminSession,
  hasValidCsrfToken,
} from "../auth/admin-session";
import { env } from "../config/env";
import {
  adminContentPayloadSchema,
  getHighlightsContent,
  getLivesContent,
  getNowContent,
  getProfileContent,
  highlightsPayloadSchema,
  isAdminEditingEnabled,
  livesPayloadSchema,
  nowPayloadSchema,
  profilePayloadSchema,
  saveHighlightsContent,
  saveLivesContent,
  saveAdminContent,
  saveNowContent,
  saveProfileContent,
} from "../data/public-content-store";

const adminRouter = new Hono();
const MAX_LIFE_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const THUMBNAIL_SIZE = 640;
const THUMBNAIL_CONTENT_TYPE = "image/webp";
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_WINDOW_MILLISECONDS = 15 * 60 * 1000;
const MAX_TRACKED_LOGIN_CLIENTS = 10_000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const loginPayloadSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

function createUploadUnavailableResponse() {
  return new Response(
    JSON.stringify({
      error: "Blob upload unavailable",
      message: "BLOB_READ_WRITE_TOKEN is not configured",
    }),
    {
      status: 503,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

function sanitizeFileNameSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getImageExtension(fileName: string, contentType: string) {
  const extensionMatch = /\.([a-z0-9]+)$/i.exec(fileName);

  if (extensionMatch) {
    return `.${extensionMatch[1].toLowerCase()}`;
  }

  switch (contentType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/avif":
      return ".avif";
    case "image/svg+xml":
      return ".svg";
    default:
      return "";
  }
}

function createLifeImagePathname(fileName: string, contentType: string) {
  const baseName = sanitizeFileNameSegment(fileName) || "life-image";
  const extension = getImageExtension(fileName, contentType);

  return `lives/${baseName}${extension}`;
}

function createLifeThumbnailPathname(pathname: string) {
  const fileName = pathname.split("/").pop() ?? pathname;
  const baseName = fileName.replace(/\.[^.]+$/, "");

  return `lives/thumbs/${baseName}.webp`;
}

function createBlobUrlWithPathname(blobUrl: string, pathname: string) {
  const url = new URL(blobUrl);
  url.pathname = `/${pathname}`;

  return url.toString();
}

async function createLifeThumbnailBuffer(file: File) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  return sharp(fileBuffer)
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

function getClientAddress(headers: Headers) {
  const forwardedAddress = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (forwardedAddress) {
    return forwardedAddress;
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}

function getLoginAttemptState(clientAddress: string) {
  const currentState = loginAttempts.get(clientAddress);

  if (!currentState || currentState.resetAt <= Date.now()) {
    if (!currentState && loginAttempts.size >= MAX_TRACKED_LOGIN_CLIENTS) {
      const oldestClientAddress = loginAttempts.keys().next().value;

      if (oldestClientAddress) {
        loginAttempts.delete(oldestClientAddress);
      }
    }

    const nextState = {
      count: 0,
      resetAt: Date.now() + LOGIN_WINDOW_MILLISECONDS,
    };

    loginAttempts.set(clientAddress, nextState);
    return nextState;
  }

  return currentState;
}

function hasValidAdminCredentials(username: string, password: string) {
  const digestCredential = (value: string) =>
    createHmac("sha256", env.ADMIN_SESSION_SECRET).update(value).digest();
  const usernameMatches = timingSafeEqual(
    digestCredential(username),
    digestCredential(env.ADMIN_USERNAME),
  );
  const passwordMatches = timingSafeEqual(
    digestCredential(password),
    digestCredential(env.ADMIN_PASSWORD),
  );

  return usernameMatches && passwordMatches;
}

function createUnauthorizedResponse() {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Valid admin credentials are required",
    }),
    {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

function createEditingUnavailableResponse() {
  return new Response(
    JSON.stringify({
      error: "Editing unavailable",
      message: "Admin editing requires a configured database",
    }),
    {
      status: 503,
      headers: {
        "content-type": "application/json",
      },
    },
  );
}

adminRouter.post("/admin/login", async (c) => {
  const clientAddress = getClientAddress(c.req.raw.headers);
  const attemptState = getLoginAttemptState(clientAddress);

  if (attemptState.count >= LOGIN_ATTEMPT_LIMIT) {
    const retryAfterSeconds = Math.max(1, Math.ceil((attemptState.resetAt - Date.now()) / 1000));

    return c.json(
      {
        error: "Too many login attempts",
        message: "Please try again later",
      },
      429,
      {
        "Retry-After": String(retryAfterSeconds),
      },
    );
  }

  let payload: unknown;

  try {
    payload = await c.req.json();
  } catch {
    attemptState.count += 1;
    return createUnauthorizedResponse();
  }

  const parsedPayload = loginPayloadSchema.safeParse(payload);

  if (
    !parsedPayload.success ||
    !hasValidAdminCredentials(parsedPayload.data.username, parsedPayload.data.password)
  ) {
    attemptState.count += 1;
    return createUnauthorizedResponse();
  }

  loginAttempts.delete(clientAddress);
  const session = createAdminSession(c);

  return c.json({
    ok: true,
    editingEnabled: isAdminEditingEnabled(),
    csrfToken: session.csrfToken,
  });
});

adminRouter.use("/admin/*", async (c, next) => {
  const session = getAdminSession(c);

  if (!session) {
    return createUnauthorizedResponse();
  }

  if (!["GET", "HEAD"].includes(c.req.method) && !hasValidCsrfToken(c, session)) {
    return c.json(
      {
        error: "Invalid CSRF token",
        message: "A valid CSRF token is required",
      },
      403,
    );
  }

  await next();
});

adminRouter.delete("/admin/login", (c) => {
  clearAdminSession(c);

  return c.json({
    ok: true,
  });
});

adminRouter.get("/admin/content", async (c) => {
  const session = getAdminSession(c);
  const [profile, now, lives, highlights] = await Promise.all([
    getProfileContent(),
    getNowContent(true),
    getLivesContent(true),
    getHighlightsContent(true),
  ]);

  return c.json({
    profile,
    now,
    lives,
    highlights,
    editingEnabled: isAdminEditingEnabled(),
    csrfToken: session?.csrfToken ?? "",
  });
});

adminRouter.put("/admin/content", async (c) => {
  if (!isAdminEditingEnabled()) {
    return createEditingUnavailableResponse();
  }

  const payload: unknown = await c.req.json();
  const parsedPayload = adminContentPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return c.json(
      {
        error: "Invalid admin content payload",
        issues: parsedPayload.error.issues,
      },
      400,
    );
  }

  const savedContent = await saveAdminContent(parsedPayload.data);
  const session = getAdminSession(c);

  return c.json({
    ...savedContent,
    editingEnabled: true,
    csrfToken: session?.csrfToken ?? "",
  });
});

adminRouter.put("/admin/profile", async (c) => {
  if (!isAdminEditingEnabled()) {
    return createEditingUnavailableResponse();
  }

  const payload: unknown = await c.req.json();
  const parsedPayload = profilePayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return c.json(
      {
        error: "Invalid profile payload",
        issues: parsedPayload.error.issues,
      },
      400,
    );
  }

  const content = await saveProfileContent(parsedPayload.data);

  return c.json(content);
});

adminRouter.put("/admin/now", async (c) => {
  if (!isAdminEditingEnabled()) {
    return createEditingUnavailableResponse();
  }

  const payload: unknown = await c.req.json();
  const parsedPayload = nowPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return c.json(
      {
        error: "Invalid now payload",
        issues: parsedPayload.error.issues,
      },
      400,
    );
  }

  const content = await saveNowContent(parsedPayload.data);

  return c.json(content);
});

adminRouter.put("/admin/lives", async (c) => {
  if (!isAdminEditingEnabled()) {
    return createEditingUnavailableResponse();
  }

  const payload: unknown = await c.req.json();
  const parsedPayload = livesPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return c.json(
      {
        error: "Invalid lives payload",
        issues: parsedPayload.error.issues,
      },
      400,
    );
  }

  const items = await saveLivesContent(parsedPayload.data.items);

  return c.json({
    items,
    pageInfo: {
      nextCursor: null,
      hasMore: false,
    },
  });
});

adminRouter.post("/admin/lives/upload", async (c) => {
  if (!isAdminEditingEnabled()) {
    return createEditingUnavailableResponse();
  }

  if (!env.BLOB_READ_WRITE_TOKEN) {
    return createUploadUnavailableResponse();
  }

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return c.json(
      {
        error: "Invalid upload payload",
        message: "Expected an image file in the 'file' field",
      },
      400,
    );
  }

  if (!file.type.startsWith("image/")) {
    return c.json(
      {
        error: "Invalid file type",
        message: "Only image uploads are supported for Lives",
      },
      400,
    );
  }

  if (file.size <= 0) {
    return c.json(
      {
        error: "Invalid file size",
        message: "Uploaded file is empty",
      },
      400,
    );
  }

  if (file.size > MAX_LIFE_IMAGE_SIZE_BYTES) {
    return c.json(
      {
        error: "File too large",
        message: "Please upload an image smaller than 10MB",
      },
      400,
    );
  }

  try {
    const uploadedBlob = await put(createLifeImagePathname(file.name, file.type), file, {
      access: "public",
      addRandomSuffix: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
      contentType: file.type,
      token: env.BLOB_READ_WRITE_TOKEN,
    });
    const thumbnailPathname = createLifeThumbnailPathname(uploadedBlob.pathname);
    const thumbnailBuffer = await createLifeThumbnailBuffer(file);

    await put(thumbnailPathname, thumbnailBuffer, {
      access: "public",
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 30,
      contentType: THUMBNAIL_CONTENT_TYPE,
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    return c.json({
      url: uploadedBlob.url,
      thumbnailUrl: createBlobUrlWithPathname(uploadedBlob.url, thumbnailPathname),
      pathname: uploadedBlob.pathname,
      contentType: uploadedBlob.contentType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";

    return c.json(
      {
        error: "Blob upload failed",
        message,
      },
      502,
    );
  }
});

adminRouter.put("/admin/highlights", async (c) => {
  if (!isAdminEditingEnabled()) {
    return createEditingUnavailableResponse();
  }

  const payload: unknown = await c.req.json();
  const parsedPayload = highlightsPayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return c.json(
      {
        error: "Invalid highlights payload",
        issues: parsedPayload.error.issues,
      },
      400,
    );
  }

  const items = await saveHighlightsContent(parsedPayload.data.items);

  return c.json({
    items,
  });
});

export { adminRouter };
