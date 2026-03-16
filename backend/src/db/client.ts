import { createClient } from "@libsql/client";

import { env, isTursoConfigured } from "../config/env";

export const db = isTursoConfigured
  ? createClient({
      url: env.TURSO_DATABASE_URL as string,
      authToken: env.TURSO_AUTH_TOKEN,
    })
  : null;

export async function checkDatabaseConnection() {
  if (!db) {
    return {
      configured: false,
      connected: false,
    };
  }

  await db.execute("SELECT 1");

  return {
    configured: true,
    connected: true,
  };
}
