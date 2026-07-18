import { createProxyHandler } from "../server/proxy";

export default createProxyHandler({
  path: "/content",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
