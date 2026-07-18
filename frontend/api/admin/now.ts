import { createProxyHandler } from "../../server/proxy";

export default createProxyHandler({
  path: "/admin/now",
  methods: ["PUT"],
});
