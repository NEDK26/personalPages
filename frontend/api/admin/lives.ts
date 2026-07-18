import { createProxyHandler } from "../../server/proxy";

export default createProxyHandler({
  path: "/admin/lives",
  methods: ["PUT"],
});
