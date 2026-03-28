import cors from "cors";
import express from "express";

import { healthRouter } from "./routes/health";
import { publicRouter } from "./routes/public";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({
      message: "Backend API is running",
    });
  });

  app.use("/api", healthRouter);
  app.use("/api", publicRouter);

  return app;
}
