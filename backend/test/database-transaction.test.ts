import assert from "node:assert/strict";
import { before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.ADMIN_USERNAME = "test-admin";
process.env.ADMIN_PASSWORD = "test-password-strong";
process.env.ADMIN_SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
process.env.TURSO_DATABASE_URL = "file::memory:";
process.env.TURSO_AUTH_TOKEN = "test-token";
process.env.BLOB_READ_WRITE_TOKEN = "";

let app: typeof import("../src/app").default;
let cookie = "";
let csrfToken = "";

before(async () => {
  app = (await import("../src/app")).default;
  const { migrateContentStorage } = await import("../src/data/public-content-store");

  await migrateContentStorage();

  const loginResponse = await app.request("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "test-admin",
      password: "test-password-strong",
    }),
  });
  const loginBody = await loginResponse.json();

  cookie = loginResponse.headers.get("set-cookie")?.split(";")[0] ?? "";
  csrfToken = loginBody.csrfToken;
});

test("failed replacement rolls back the delete and partial inserts", async () => {
  const initialResponse = await app.request("/admin/content", {
    headers: { Cookie: cookie },
  });
  const initialContent = await initialResponse.json();
  const originalIds = initialContent.lives.map((item: { id: string }) => item.id);
  const duplicateItem = {
    ...initialContent.lives[0],
    id: "duplicate-primary-key",
  };

  const failedResponse = await app.request("/admin/lives", {
    method: "PUT",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ items: [duplicateItem, duplicateItem] }),
  });

  assert.equal(failedResponse.status, 500);

  const afterFailureResponse = await app.request("/admin/content", {
    headers: { Cookie: cookie },
  });
  const afterFailureContent = await afterFailureResponse.json();

  assert.deepEqual(
    afterFailureContent.lives.map((item: { id: string }) => item.id),
    originalIds,
  );
});
