import { createProxyHandler } from "../server/proxy.ts";

export default createProxyHandler({
  path: "/content",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
