import { createProxyHandler } from "../server/proxy";

export default createProxyHandler({
  path: "/highlights",
  methods: ["GET", "HEAD"],
  cachePublicGet: true,
});
