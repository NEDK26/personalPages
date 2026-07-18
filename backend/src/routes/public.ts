import { Hono } from "hono";

import { getHighlightsContent, getLivesContent, getNowContent, getProfileContent } from "../data/public-content-store";

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

function createLivesPage(
  allLives: Awaited<ReturnType<typeof getLivesContent>>,
  cursor: string | undefined,
  limit: number,
) {
  const cursorIndex = cursor ? allLives.findIndex((life) => life.id === cursor) : -1;

  if (cursor && cursorIndex === -1) {
    return null;
  }

  const startIndex = cursorIndex + 1;
  const items = allLives.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + items.length;

  return {
    items,
    pageInfo: {
      nextCursor:
        nextIndex < allLives.length && items.length > 0 ? items[items.length - 1].id : null,
      hasMore: nextIndex < allLives.length,
    },
  };
}

publicRouter.get("/content", async (c) => {
  const [profile, now, allLives, highlights] = await Promise.all([
    getProfileContent(),
    getNowContent(),
    getLivesContent(),
    getHighlightsContent(),
  ]);
  const livesPage = createLivesPage(allLives, undefined, DEFAULT_LIVES_LIMIT);

  return c.json({
    profile,
    now,
    lives: livesPage?.items ?? [],
    livesPageInfo: livesPage?.pageInfo ?? {
      nextCursor: null,
      hasMore: false,
    },
    highlights,
  });
});

publicRouter.get("/profile", async (c) => {
  const profile = await getProfileContent();

  return c.json(profile);
});

publicRouter.get("/now", async (c) => {
  const now = await getNowContent();

  return c.json(now);
});

publicRouter.get("/lives", async (c) => {
  const allLives = await getLivesContent();
  const cursor = c.req.query("cursor");
  const limit = parseLivesLimit(c.req.query("limit"));
  const page = createLivesPage(allLives, cursor, limit);

  if (!page) {
    return c.json(
      {
        error: "Invalid cursor",
      },
      400,
    );
  }

  return c.json(page);
});

publicRouter.get("/highlights", async (c) => {
  const highlights = await getHighlightsContent();

  return c.json({
    items: highlights,
  });
});

export { publicRouter };
