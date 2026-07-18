import { createProxyHandler } from "../server/proxy.ts";

export default createProxyHandler({
  path: "/health",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
