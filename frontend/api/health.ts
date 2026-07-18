import { createProxyHandler } from "../server/proxy.js";

export default createProxyHandler({
  path: "/health",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
