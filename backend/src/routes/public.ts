import { Hono } from "hono";

import { highlights, links, now, profile } from "../data/public-content";

const publicRouter = new Hono();

publicRouter.get("/profile", (c) => {
  return c.json(profile);
});

publicRouter.get("/now", (c) => {
  return c.json(now);
});

publicRouter.get("/links", (c) => {
  return c.json({
    items: links,
  });
});

publicRouter.get("/highlights", (c) => {
  return c.json({
    items: highlights,
  });
});

export { publicRouter };
