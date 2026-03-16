import { Hono } from "hono";
import { logger } from "hono/logger";

import { healthRouter } from "./routes/health";
import { publicRouter } from "./routes/public";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    message: "Backend API is running",
    docs: [
      "/api",
      "/api/health",
      "/api/profile",
      "/api/now",
      "/api/links",
      "/api/highlights",
    ],
  });
});

app.route("/api", healthRouter);
app.route("/api", publicRouter);

export default app;
