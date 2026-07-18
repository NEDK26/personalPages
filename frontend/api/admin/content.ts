import { createProxyHandler } from "../../server/proxy.js";

export default createProxyHandler({
  path: "/admin/content",
  methods: ["GET", "PUT"],
});
