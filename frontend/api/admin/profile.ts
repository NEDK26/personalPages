import { createProxyHandler } from "../../server/proxy";

export default createProxyHandler({
  path: "/admin/profile",
  methods: ["PUT"],
});
