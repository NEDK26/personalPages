import { Hono } from "hono";

import { checkDatabaseConnection } from "../db/client";

const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  return c.json({
    ok: true,
    service: "backend",
    message: "API routes are available at the root path",
  });
});

healthRouter.get("/health", async (c) => {
  try {
    const database = await checkDatabaseConnection();

    return c.json({
      ok: true,
      service: "backend",
      timestamp: new Date().toISOString(),
      database,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";

    return c.json(
      {
        ok: false,
        service: "backend",
        timestamp: new Date().toISOString(),
        database: {
          configured: true,
          connected: false,
        },
        error: message,
      },
      503,
    );
  }
});

export { healthRouter };
