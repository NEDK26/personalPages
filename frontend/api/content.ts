import { createProxyHandler } from "../server/proxy.js";

export default createProxyHandler({
  path: "/content",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
