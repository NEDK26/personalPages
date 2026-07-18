import { createProxyHandler } from "../../server/proxy.ts";

export default createProxyHandler({
  path: "/admin/content",
  methods: ["GET", "PUT"],
});
