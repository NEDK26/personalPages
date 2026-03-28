import { z } from "zod";

import { db } from "../db/client";
import { highlights as defaultHighlights, lives as defaultLives } from "./public-content";

const CONTENT_SCOPE_LIVES = "lives";
const CONTENT_SCOPE_HIGHLIGHTS = "highlights";

const contentEntrySchema = z.object({
  scope: z.enum([CONTENT_SCOPE_LIVES, CONTENT_SCOPE_HIGHLIGHTS]),
  data: z.string(),
  updated_at: z.string(),
});

const lifeMomentSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  imageUrl: z.string().trim().url(),
  alt: z.string().trim().min(1),
  location: z.string().trim().min(1),
  capturedAt: z.string().trim().min(1),
  description: z.string().trim().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const highlightItemSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  kind: z.enum(["project", "approach", "skill"]),
});

export const livesPayloadSchema = z.object({
  items: z.array(lifeMomentSchema),
});

export const highlightsPayloadSchema = z.object({
  items: z.array(highlightItemSchema),
});

export type LifeMoment = z.infer<typeof lifeMomentSchema>;
export type HighlightItem = z.infer<typeof highlightItemSchema>;

const fallbackLives = livesPayloadSchema.parse({ items: defaultLives }).items;
const fallbackHighlights = highlightsPayloadSchema.parse({ items: defaultHighlights }).items;

let ensureContentTablePromise: Promise<void> | null = null;

async function ensureContentTable() {
  if (!db) {
    return;
  }

  if (!ensureContentTablePromise) {
    ensureContentTablePromise = db
      .execute(
        "CREATE TABLE IF NOT EXISTS public_content (scope TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)",
      )
      .then(() => undefined);
  }

  await ensureContentTablePromise;
}

async function getStoredContent(scope: "lives" | "highlights") {
  if (!db) {
    return null;
  }

  await ensureContentTable();

  const result = await db.execute({
    sql: "SELECT scope, data, updated_at FROM public_content WHERE scope = ?1 LIMIT 1",
    args: [scope],
  });

  const firstRow = result.rows[0];

  if (!firstRow) {
    return null;
  }

  const parsedEntry = contentEntrySchema.safeParse({
    scope: firstRow.scope,
    data: firstRow.data,
    updated_at: firstRow.updated_at,
  });

  if (!parsedEntry.success) {
    return null;
  }

  return parsedEntry.data;
}

async function saveStoredContent(scope: "lives" | "highlights", data: string) {
  if (!db) {
    throw new Error("Admin editing requires a configured database");
  }

  await ensureContentTable();

  await db.execute({
    sql: `
      INSERT INTO public_content (scope, data, updated_at)
      VALUES (?1, ?2, ?3)
      ON CONFLICT(scope) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
    `,
    args: [scope, data, new Date().toISOString()],
  });
}

export async function getLivesContent(): Promise<LifeMoment[]> {
  try {
    const storedEntry = await getStoredContent(CONTENT_SCOPE_LIVES);

    if (!storedEntry) {
      return fallbackLives;
    }

    const rawValue: unknown = JSON.parse(storedEntry.data);
    const parsedLives = z.array(lifeMomentSchema).safeParse(rawValue);

    if (!parsedLives.success) {
      return fallbackLives;
    }

    return parsedLives.data;
  } catch {
    return fallbackLives;
  }
}

export async function getHighlightsContent(): Promise<HighlightItem[]> {
  try {
    const storedEntry = await getStoredContent(CONTENT_SCOPE_HIGHLIGHTS);

    if (!storedEntry) {
      return fallbackHighlights;
    }

    const rawValue: unknown = JSON.parse(storedEntry.data);
    const parsedHighlights = z.array(highlightItemSchema).safeParse(rawValue);

    if (!parsedHighlights.success) {
      return fallbackHighlights;
    }

    return parsedHighlights.data;
  } catch {
    return fallbackHighlights;
  }
}

export async function saveLivesContent(items: LifeMoment[]) {
  const parsedLives = z.array(lifeMomentSchema).parse(items);

  await saveStoredContent(CONTENT_SCOPE_LIVES, JSON.stringify(parsedLives));

  return parsedLives;
}

export async function saveHighlightsContent(items: HighlightItem[]) {
  const parsedHighlights = z.array(highlightItemSchema).parse(items);

  await saveStoredContent(CONTENT_SCOPE_HIGHLIGHTS, JSON.stringify(parsedHighlights));

  return parsedHighlights;
}

export function isAdminEditingEnabled() {
  return Boolean(db);
}
