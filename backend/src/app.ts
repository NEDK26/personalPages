import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { env } from "./config/env";
import { adminRouter } from "./routes/admin";
import { healthRouter } from "./routes/health";
import { publicRouter } from "./routes/public";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: env.FRONTEND_ORIGINS,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
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
      "/lives",
      "/highlights",
    ],
  });
});

app.route("/", healthRouter);
app.route("/", publicRouter);
app.route("/", adminRouter);

export default app;
