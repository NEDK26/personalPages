import { createProxyHandler } from "../../server/proxy";

export default createProxyHandler({
  path: "/admin/logout",
  methods: ["POST"],
});
