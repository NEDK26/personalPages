import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createProxyHandler } from "./proxy.ts";

const originalFetch = globalThis.fetch;

process.env.BACKEND_API_BASE_URL = "https://backend.example.com";

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("admin proxy forwards session and CSRF headers and returns Set-Cookie", async () => {
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://backend.example.com/admin/profile");
    const headers = new Headers(init?.headers);

    assert.equal(headers.get("cookie"), "session=abc");
    assert.equal(headers.get("x-csrf-token"), "csrf-value");

    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": "session=updated; HttpOnly; SameSite=Strict",
        },
      },
    );
  };

  const handler = createProxyHandler({ path: "/admin/profile", methods: ["PUT"] });
  const response = await handler.fetch(
    new Request("https://frontend.example.com/api/admin/profile", {
      method: "PUT",
      headers: {
        Cookie: "session=abc",
        "Content-Type": "application/json",
        "X-CSRF-Token": "csrf-value",
      },
      body: "{}",
    }),
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("public proxy preserves query parameters and applies shared cache policy", async () => {
  globalThis.fetch = async (input) => {
    assert.equal(String(input), "https://backend.example.com/lives?limit=2");
    return Response.json({ items: [] });
  };

  const handler = createProxyHandler({
    path: "/lives",
    methods: ["GET", "HEAD"],
    cachePublicGet: true,
  });
  const response = await handler.fetch(
    new Request("https://frontend.example.com/api/lives?limit=2"),
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control") ?? "", /s-maxage=60/);
});

test("proxy rejects methods outside the explicit route contract", async () => {
  const handler = createProxyHandler({ path: "/content", methods: ["GET", "HEAD"] });
  const response = await handler.fetch(
    new Request("https://frontend.example.com/api/content", { method: "POST" }),
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("Vercel API entrypoints load in the Node ESM runtime", async () => {
  const entrypoints = await Promise.all([
    import("../api/health.ts"),
    import("../api/content.ts"),
    import("../api/lives.ts"),
    import("../api/admin/content.ts"),
    import("../api/admin/login.ts"),
  ]);

  for (const entrypoint of entrypoints) {
    assert.equal(typeof entrypoint.default.fetch, "function");
  }
});
