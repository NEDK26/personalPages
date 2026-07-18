import { createProxyHandler } from "../server/proxy.ts";

export default createProxyHandler({
  path: "/lives",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
