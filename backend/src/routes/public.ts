import { Hono } from "hono";

import { highlights, lives, now, profile } from "../data/public-content";

const publicRouter = new Hono();

publicRouter.get("/profile", (c) => {
  return c.json(profile);
});

publicRouter.get("/now", (c) => {
  return c.json(now);
});

publicRouter.get("/lives", (c) => {
  return c.json({
    items: lives,
  });
});

publicRouter.get("/highlights", (c) => {
  return c.json({
    items: highlights,
  });
});

export { publicRouter };
