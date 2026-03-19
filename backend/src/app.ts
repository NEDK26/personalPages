import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { publicRouter } from "./routes/public";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: env.FRONTEND_ORIGINS,
    allowMethods: ["GET", "OPTIONS"],
  }),
);

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    message: "Backend API is running",
    docs: [
      "/health",
      "/profile",
      "/now",
      "/links",
      "/highlights",
    ],
  });
});

app.route("/", healthRouter);
app.route("/", publicRouter);

export default app;
