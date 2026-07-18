import { migrateContentStorage } from "./data/public-content-store";
import { db } from "./db/client";

async function runMigration() {
  await migrateContentStorage();
  db?.close();
}

runMigration().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown migration error";

  console.error(`Content migration failed: ${message}`);
  process.exitCode = 1;
});
