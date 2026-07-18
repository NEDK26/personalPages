import { createProxyHandler } from "../server/proxy";

export default createProxyHandler({
  path: "/now",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
