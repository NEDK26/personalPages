import { serve } from "@hono/node-server";

import app from "./app";
import { env } from "./config/env";
import { migrateContentStorage } from "./data/public-content-store";

async function startServer() {
  await migrateContentStorage();

  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    () => {
      console.log(`API server listening on http://localhost:${env.PORT}`);
    },
  );
}

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";

  console.error(`Failed to start API server: ${message}`);
  process.exitCode = 1;
});
