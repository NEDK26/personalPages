import { Router } from "express";

import { highlights, links, now, profile } from "../data/public-content";

const publicRouter = Router();

publicRouter.get("/profile", (_req, res) => {
  res.status(200).json(profile);
});

publicRouter.get("/now", (_req, res) => {
  res.status(200).json(now);
});

publicRouter.get("/links", (_req, res) => {
  res.status(200).json({
    items: links,
  });
});

publicRouter.get("/highlights", (_req, res) => {
  res.status(200).json({
    items: highlights,
  });
});

export { publicRouter };
