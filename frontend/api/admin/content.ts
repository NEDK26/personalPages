import { createProxyHandler } from "../../server/proxy";

export default createProxyHandler({
  path: "/admin/content",
  methods: ["GET", "PUT"],
});
