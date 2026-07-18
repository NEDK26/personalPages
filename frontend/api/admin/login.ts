import { createProxyHandler } from "../../server/proxy";

export default createProxyHandler({
  path: "/admin/login",
  methods: ["POST", "DELETE"],
});
