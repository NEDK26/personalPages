import { put } from "@vercel/blob";
import { Hono } from "hono";

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

function parseBasicAuthHeader(authorizationHeader: string | undefined) {
  if (!authorizationHeader?.startsWith("Basic ")) {
    return null;
  }

  try {
    const encodedValue = authorizationHeader.slice(6);
    const decodedValue = Buffer.from(encodedValue, "base64").toString("utf8");
    const separatorIndex = decodedValue.indexOf(":");

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decodedValue.slice(0, separatorIndex),
      password: decodedValue.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function hasValidAdminCredentials(authorizationHeader: string | undefined) {
  const credentials = parseBasicAuthHeader(authorizationHeader);

  if (!credentials) {
    return false;
  }

  return credentials.username === env.ADMIN_USERNAME && credentials.password === env.ADMIN_PASSWORD;
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
        "www-authenticate": 'Basic realm="Admin", charset="UTF-8"',
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

adminRouter.post("/admin/login", (c) => {
  if (!hasValidAdminCredentials(c.req.header("authorization"))) {
    return createUnauthorizedResponse();
  }

  return c.json({
    ok: true,
    editingEnabled: isAdminEditingEnabled(),
  });
});

adminRouter.use("/admin/*", async (c, next) => {
  if (!hasValidAdminCredentials(c.req.header("authorization"))) {
    return createUnauthorizedResponse();
  }

  await next();
});

adminRouter.get("/admin/content", async (c) => {
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

  return c.json({
    ...savedContent,
    editingEnabled: true,
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

    return c.json({
      url: uploadedBlob.url,
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
