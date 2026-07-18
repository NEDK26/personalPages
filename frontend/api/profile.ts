import { createProxyHandler } from "../server/proxy";

export default createProxyHandler({
  path: "/profile",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
