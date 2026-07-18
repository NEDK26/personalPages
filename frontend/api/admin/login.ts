import { createProxyHandler } from "../../server/proxy.ts";

export default createProxyHandler({
  path: "/admin/login",
  methods: ["POST", "DELETE"],
});
