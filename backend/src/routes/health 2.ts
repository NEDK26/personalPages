import { Router } from "express";

import { checkDatabaseConnection } from "../db/client";

const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    const database = await checkDatabaseConnection();

    res.status(200).json({
      ok: true,
      service: "backend",
      timestamp: new Date().toISOString(),
      database,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";

    res.status(503).json({
      ok: false,
      service: "backend",
      timestamp: new Date().toISOString(),
      database: {
        configured: true,
        connected: false,
      },
      error: message,
    });
  }
});

export { healthRouter };
