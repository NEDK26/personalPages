import { createProxyHandler } from "../server/proxy.js";

export default createProxyHandler({
  path: "/lives",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
