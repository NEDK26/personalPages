import { createProxyHandler } from "../server/proxy";

export default createProxyHandler({
  path: "/health",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
