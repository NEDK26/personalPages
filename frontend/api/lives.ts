import { createProxyHandler } from "../server/proxy";

export default createProxyHandler({
  path: "/lives",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
