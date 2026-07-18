import assert from "node:assert/strict";
import { before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.ADMIN_USERNAME = "test-admin";
process.env.ADMIN_PASSWORD = "test-password-strong";
process.env.ADMIN_SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
process.env.TURSO_DATABASE_URL = "";
process.env.TURSO_AUTH_TOKEN = "";
process.env.BLOB_READ_WRITE_TOKEN = "";

let app: typeof import("../src/app").default;

before(async () => {
  app = (await import("../src/app")).default;
});

async function login(clientAddress = "198.51.100.1") {
  return app.request("/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Forwarded-For": clientAddress,
    },
    body: JSON.stringify({
      username: "test-admin",
      password: "test-password-strong",
    }),
  });
}

test("public Lives endpoint paginates and rejects an unknown cursor", async () => {
  const firstPageResponse = await app.request("/lives?limit=2");
  const firstPage = await firstPageResponse.json();

  assert.equal(firstPageResponse.status, 200);
  assert.equal(firstPage.items.length, 2);
  assert.equal(typeof firstPage.pageInfo.hasMore, "boolean");

  const invalidCursorResponse = await app.request("/lives?cursor=missing-cursor");

  assert.equal(invalidCursorResponse.status, 400);
});

test("admin login creates a secure server-side session flow", async () => {
  const loginResponse = await login();
  const loginBody = await loginResponse.json();
  const setCookie = loginResponse.headers.get("set-cookie");

  assert.equal(loginResponse.status, 200);
  assert.equal(typeof loginBody.csrfToken, "string");
  assert.match(setCookie ?? "", /personal_pages_admin_session=/);
  assert.match(setCookie ?? "", /HttpOnly/i);
  assert.match(setCookie ?? "", /SameSite=Strict/i);

  const cookie = setCookie?.split(";")[0] ?? "";
  const contentResponse = await app.request("/admin/content", {
    headers: { Cookie: cookie },
  });
  const contentBody = await contentResponse.json();

  assert.equal(contentResponse.status, 200);
  assert.equal(contentBody.csrfToken, loginBody.csrfToken);

  const missingCsrfResponse = await app.request("/admin/profile", {
    method: "PUT",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contentBody.profile),
  });

  assert.equal(missingCsrfResponse.status, 403);

  const validCsrfResponse = await app.request("/admin/profile", {
    method: "PUT",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-CSRF-Token": loginBody.csrfToken,
    },
    body: JSON.stringify(contentBody.profile),
  });

  assert.equal(validCsrfResponse.status, 503);

  const logoutResponse = await app.request("/admin/logout", {
    method: "POST",
    headers: {
      Cookie: cookie,
      "X-CSRF-Token": loginBody.csrfToken,
    },
  });

  assert.equal(logoutResponse.status, 200);
  assert.match(logoutResponse.headers.get("set-cookie") ?? "", /Max-Age=0/i);
});

test("admin login is rate limited per client address", async () => {
  const clientAddress = "198.51.100.77";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await app.request("/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientAddress,
      },
      body: JSON.stringify({ username: "wrong", password: "wrong" }),
    });

    assert.equal(response.status, 401);
  }

  const blockedResponse = await login(clientAddress);

  assert.equal(blockedResponse.status, 429);
  assert.ok(Number(blockedResponse.headers.get("retry-after")) > 0);
});
