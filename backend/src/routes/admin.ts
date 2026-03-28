import { Hono } from "hono";

import { env } from "../config/env";
import {
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
  saveNowContent,
  saveProfileContent,
} from "../data/public-content-store";

const adminRouter = new Hono();

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
