import { Hono } from "hono";

import { highlights, lives, now, profile } from "../data/public-content";

const publicRouter = new Hono();
const DEFAULT_LIVES_LIMIT = 4;
const MAX_LIVES_LIMIT = 12;

function parseLivesLimit(value: string | undefined) {
  if (!value) {
    return DEFAULT_LIVES_LIMIT;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return DEFAULT_LIVES_LIMIT;
  }

  return Math.min(parsedValue, MAX_LIVES_LIMIT);
}

publicRouter.get("/profile", (c) => {
  return c.json(profile);
});

publicRouter.get("/now", (c) => {
  return c.json(now);
});

publicRouter.get("/lives", (c) => {
  const cursor = c.req.query("cursor");
  const limit = parseLivesLimit(c.req.query("limit"));
  const cursorIndex = cursor ? lives.findIndex((life) => life.id === cursor) : -1;

  if (cursor && cursorIndex === -1) {
    return c.json(
      {
        error: "Invalid cursor",
      },
      400,
    );
  }

  const startIndex = cursorIndex + 1;
  const items = lives.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + items.length;
  const nextCursor = nextIndex < lives.length && items.length > 0 ? items[items.length - 1].id : null;

  return c.json({
    items,
    pageInfo: {
      nextCursor,
      hasMore: nextIndex < lives.length,
    },
  });
});

publicRouter.get("/highlights", (c) => {
  return c.json({
    items: highlights,
  });
});

export { publicRouter };
