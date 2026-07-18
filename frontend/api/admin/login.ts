import { createProxyHandler } from "../../server/proxy.js";

export default createProxyHandler({
  path: "/admin/login",
  methods: ["POST", "DELETE"],
});
