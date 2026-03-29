import { z } from "zod";

import { db } from "../db/client";
import {
  profile as defaultProfile,
  highlights as defaultHighlights,
  lives as defaultLives,
  now as defaultNow,
} from "./public-content";

const CONTENT_SCOPE_PROFILE = "profile";
const CONTENT_SCOPE_NOW = "now";
const CONTENT_SCOPE_LIVES = "lives";
const CONTENT_SCOPE_HIGHLIGHTS = "highlights";

const contentStatusSchema = z.enum(["draft", "published", "hidden"]);

const contentEntrySchema = z.object({
  scope: z.enum([CONTENT_SCOPE_PROFILE, CONTENT_SCOPE_NOW, CONTENT_SCOPE_LIVES, CONTENT_SCOPE_HIGHLIGHTS]),
  data: z.string(),
  updated_at: z.string(),
});

const profileSocialsSchema = z.object({
  github: z.string().trim().min(1),
  blog: z.string().trim().min(1),
  email: z.string().trim().min(1),
});

const profileSchema = z.object({
  name: z.string().trim().min(1),
  headline: z.string().trim().min(1),
  avatarUrl: z.string().trim().url(),
  location: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)),
  socials: profileSocialsSchema,
});

const baseJourneyItemSchema = z.object({
  id: z.string().trim().min(1),
  type: z.enum(["education", "work"]),
  title: z.string().trim().min(1),
  organization: z.string().trim().min(1),
  location: z.string().trim().min(1),
  period: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const journeyItemSchema = baseJourneyItemSchema.extend({
  status: contentStatusSchema,
  sortOrder: z.number().int().nonnegative(),
});

const nowSchema = z.object({
  summary: z.string().trim().min(1),
  items: z.array(journeyItemSchema),
  updatedAt: z.string().trim().min(1),
});

const legacyNowSchema = z.object({
  summary: z.string().trim().min(1),
  items: z.array(baseJourneyItemSchema),
  updatedAt: z.string().trim().min(1),
});

const imageSourceSchema = z.string().trim().refine(
  (value) => {
    if (value.startsWith("/")) {
      return true;
    }

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Expected an absolute URL or root-relative path",
  },
);

const baseLifeMomentSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  imageUrl: imageSourceSchema,
  thumbnailUrl: imageSourceSchema.optional(),
  alt: z.string().trim(),
  location: z.string().trim(),
  capturedAt: z.string().trim().min(1),
  description: z.string().trim(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const lifeMomentSchema = baseLifeMomentSchema.extend({
  status: contentStatusSchema,
  sortOrder: z.number().int().nonnegative(),
});

const baseHighlightItemSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  description: z.string().trim().min(1),
  kind: z.enum(["project", "approach", "skill"]),
  period: z.string().trim().min(1),
  stack: z.array(z.string().trim().min(1)),
  link: z.string().trim().optional().default(""),
});

const highlightItemSchema = baseHighlightItemSchema.extend({
  status: contentStatusSchema,
  sortOrder: z.number().int().nonnegative(),
});

const journeyRowSchema = z.object({
  id: z.string(),
  type: z.enum(["education", "work"]),
  title: z.string(),
  organization: z.string(),
  location: z.string(),
  period: z.string(),
  description: z.string(),
  status: contentStatusSchema,
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

const lifeMomentRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  image_url: z.string(),
  thumbnail_url: z.string().nullable().optional(),
  alt: z.string(),
  location: z.string(),
  captured_at: z.string(),
  description: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  status: contentStatusSchema,
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

const projectRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  kind: z.enum(["project", "approach", "skill"]),
  period: z.string(),
  stack_json: z.string(),
  link: z.string(),
  status: contentStatusSchema,
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const profilePayloadSchema = profileSchema;
export const nowPayloadSchema = nowSchema;
export const livesPayloadSchema = z.object({
  items: z.array(lifeMomentSchema),
});
export const highlightsPayloadSchema = z.object({
  items: z.array(highlightItemSchema),
});
export const adminContentPayloadSchema = z.object({
  profile: profilePayloadSchema,
  now: nowPayloadSchema,
  lives: z.array(lifeMomentSchema),
  highlights: z.array(highlightItemSchema),
});

export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type ProfileContent = z.infer<typeof profileSchema>;
export type JourneyItem = z.infer<typeof journeyItemSchema>;
export type NowContent = z.infer<typeof nowSchema>;
export type LifeMoment = z.infer<typeof lifeMomentSchema>;
export type HighlightItem = z.infer<typeof highlightItemSchema>;

const fallbackProfile = profilePayloadSchema.parse(defaultProfile);
const fallbackNow = nowPayloadSchema.parse({
  ...defaultNow,
  items: defaultNow.items.map((item, index) => ({
    ...item,
    status: "published",
    sortOrder: index,
  })),
});
const fallbackLives = defaultLives.map((item, index) => ({
  ...item,
  status: "published" as const,
  sortOrder: index,
}));
const fallbackHighlights = z.array(highlightItemSchema).parse(
  defaultHighlights.map((item, index) => ({
    ...item,
    status: "published" as const,
    sortOrder: index,
  })),
);

let ensureContentStoragePromise: Promise<void> | null = null;

function createTimestamp() {
  return new Date().toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function ensureLifeMomentThumbnailColumn() {
  if (!db) {
    return;
  }

  try {
    await db.execute("ALTER TABLE life_moments ADD COLUMN thumbnail_url TEXT");
  } catch (error) {
    if (error instanceof Error && /duplicate column|already exists/i.test(error.message)) {
      return;
    }

    throw error;
  }
}

async function ensureContentStorage() {
  if (!db) {
    return;
  }

  if (!ensureContentStoragePromise) {
    ensureContentStoragePromise = (async () => {
      await db.execute(
        "CREATE TABLE IF NOT EXISTS public_content (scope TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)",
      );
      await db.execute(`
        CREATE TABLE IF NOT EXISTS journey_items (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          organization TEXT NOT NULL,
          location TEXT NOT NULL,
          period TEXT NOT NULL,
          description TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'published',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS life_moments (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          image_url TEXT NOT NULL,
          thumbnail_url TEXT,
          alt TEXT NOT NULL,
          location TEXT NOT NULL,
          captured_at TEXT NOT NULL,
          description TEXT NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'published',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await ensureLifeMomentThumbnailColumn();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          description TEXT NOT NULL,
          kind TEXT NOT NULL,
          period TEXT NOT NULL,
          stack_json TEXT NOT NULL,
          link TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'published',
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await db.execute("CREATE INDEX IF NOT EXISTS idx_journey_status_order ON journey_items(status, sort_order)");
      await db.execute("CREATE INDEX IF NOT EXISTS idx_lives_status_order ON life_moments(status, sort_order)");
      await db.execute("CREATE INDEX IF NOT EXISTS idx_projects_status_order ON projects(status, sort_order)");

      await migrateLegacyProfileIfNeeded();
      await migrateLegacyNowIfNeeded();
      await migrateLegacyLivesIfNeeded();
      await migrateLegacyHighlightsIfNeeded();
      await seedDefaultsIfNeeded();
    })();
  }

  await ensureContentStoragePromise;
}

async function readStoredContent(scope: "profile" | "now" | "lives" | "highlights") {
  if (!db) {
    return null;
  }

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

async function getStoredContent(scope: "profile" | "now" | "lives" | "highlights") {
  if (!db) {
    return null;
  }

  await ensureContentStorage();

  return readStoredContent(scope);
}

async function writeStoredContent(scope: "profile" | "now" | "lives" | "highlights", data: string) {
  if (!db) {
    throw new Error("Admin editing requires a configured database");
  }

  await db.execute({
    sql: `
      INSERT INTO public_content (scope, data, updated_at)
      VALUES (?1, ?2, ?3)
      ON CONFLICT(scope) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at
    `,
    args: [scope, data, createTimestamp()],
  });
}

async function saveStoredContent(scope: "profile" | "now" | "lives" | "highlights", data: string) {
  if (!db) {
    throw new Error("Admin editing requires a configured database");
  }

  await ensureContentStorage();

  await writeStoredContent(scope, data);
}

async function getTableCount(tableName: "journey_items" | "life_moments" | "projects") {
  if (!db) {
    return 0;
  }

  const result = await db.execute(`SELECT COUNT(*) AS count FROM ${tableName}`);
  const count = result.rows[0]?.count;

  return typeof count === "number" ? count : Number(count ?? 0);
}

async function migrateLegacyNowIfNeeded() {
  if (!db || (await getTableCount("journey_items")) > 0) {
    return;
  }

  const storedEntry = await readStoredContent(CONTENT_SCOPE_NOW);

  if (!storedEntry) {
    return;
  }

  const rawValue: unknown = JSON.parse(storedEntry.data);
  const parsedLegacyNow = legacyNowSchema.safeParse(rawValue);

  if (!parsedLegacyNow.success) {
    return;
  }

  const nextNow = nowPayloadSchema.parse({
    ...parsedLegacyNow.data,
    items: parsedLegacyNow.data.items.map((item, index) => ({
      ...item,
      status: "published",
      sortOrder: index,
    })),
  });

  await replaceJourneyItems(nextNow.items);
  await writeStoredContent(
    CONTENT_SCOPE_NOW,
    JSON.stringify({
      summary: nextNow.summary,
      updatedAt: nextNow.updatedAt,
    }),
  );
}

async function migrateLegacyProfileIfNeeded() {
  if (!db) {
    return;
  }

  const storedEntry = await readStoredContent(CONTENT_SCOPE_PROFILE);

  if (!storedEntry) {
    return;
  }

  const rawValue: unknown = JSON.parse(storedEntry.data);
  const parsedProfile = profilePayloadSchema.safeParse(rawValue);

  if (!parsedProfile.success || !isRecord(rawValue) || !("shortBio" in rawValue)) {
    return;
  }

  await writeStoredContent(CONTENT_SCOPE_PROFILE, JSON.stringify(parsedProfile.data));
}

async function migrateLegacyLivesIfNeeded() {
  if (!db || (await getTableCount("life_moments")) > 0) {
    return;
  }

  const storedEntry = await readStoredContent(CONTENT_SCOPE_LIVES);

  if (!storedEntry) {
    return;
  }

  const rawValue: unknown = JSON.parse(storedEntry.data);
  const parsedLegacyLives = z.array(baseLifeMomentSchema).safeParse(rawValue);

  if (!parsedLegacyLives.success) {
    return;
  }

  const items = parsedLegacyLives.data.map((item, index) => ({
    ...item,
    status: "published" as const,
    sortOrder: index,
  }));

  await replaceLifeMoments(items);
}

async function migrateLegacyHighlightsIfNeeded() {
  if (!db || (await getTableCount("projects")) > 0) {
    return;
  }

  const storedEntry = await readStoredContent(CONTENT_SCOPE_HIGHLIGHTS);

  if (!storedEntry) {
    return;
  }

  const rawValue: unknown = JSON.parse(storedEntry.data);
  const parsedLegacyHighlights = z.array(baseHighlightItemSchema).safeParse(rawValue);

  if (!parsedLegacyHighlights.success) {
    return;
  }

  const items = parsedLegacyHighlights.data.map((item, index) => ({
    ...item,
    status: "published" as const,
    sortOrder: index,
  }));

  await replaceProjects(items);
}

async function seedDefaultsIfNeeded() {
  if (!db) {
    return;
  }

  if ((await getTableCount("journey_items")) === 0) {
    await replaceJourneyItems(fallbackNow.items);
  }

  if ((await getTableCount("life_moments")) === 0) {
    await replaceLifeMoments(fallbackLives);
  }

  if ((await getTableCount("projects")) === 0) {
    await replaceProjects(fallbackHighlights);
  }
}

function mapJourneyRowToItem(row: z.infer<typeof journeyRowSchema>): JourneyItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    organization: row.organization,
    location: row.location,
    period: row.period,
    description: row.description,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

function mapLifeMomentRowToItem(row: z.infer<typeof lifeMomentRowSchema>): LifeMoment {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    alt: row.alt,
    location: row.location,
    capturedAt: row.captured_at,
    description: row.description,
    width: row.width,
    height: row.height,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

function mapProjectRowToItem(row: z.infer<typeof projectRowSchema>): HighlightItem {
  let rawStack: unknown = [];

  try {
    rawStack = JSON.parse(row.stack_json);
  } catch {
    rawStack = [];
  }

  const parsedStack = z.array(z.string()).safeParse(rawStack);

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    description: row.description,
    kind: row.kind,
    period: row.period,
    stack: parsedStack.success ? parsedStack.data : [],
    link: row.link,
    status: row.status,
    sortOrder: row.sort_order,
  };
}

async function readJourneyItems(includeAll: boolean) {
  if (!db) {
    return includeAll ? fallbackNow.items : fallbackNow.items.filter((item) => item.status === "published");
  }

  await ensureContentStorage();

  const result = await db.execute({
    sql: `
      SELECT id, type, title, organization, location, period, description, status, sort_order, created_at, updated_at
      FROM journey_items
      ${includeAll ? "" : "WHERE status = 'published'"}
      ORDER BY sort_order ASC, updated_at ASC
    `,
  });

  return result.rows.map((row) => mapJourneyRowToItem(journeyRowSchema.parse(row)));
}

async function readLifeMoments(includeAll: boolean) {
  if (!db) {
    return includeAll ? fallbackLives : fallbackLives.filter((item) => item.status === "published");
  }

  await ensureContentStorage();

  const result = await db.execute({
    sql: `
      SELECT id, title, image_url, thumbnail_url, alt, location, captured_at, description, width, height, status, sort_order, created_at, updated_at
      FROM life_moments
      ${includeAll ? "" : "WHERE status = 'published'"}
      ORDER BY sort_order ASC, updated_at ASC
    `,
  });

  return result.rows.map((row) => mapLifeMomentRowToItem(lifeMomentRowSchema.parse(row)));
}

async function readProjects(includeAll: boolean) {
  if (!db) {
    return includeAll ? fallbackHighlights : fallbackHighlights.filter((item) => item.status === "published");
  }

  await ensureContentStorage();

  const result = await db.execute({
    sql: `
      SELECT id, title, summary, description, kind, period, stack_json, link, status, sort_order, created_at, updated_at
      FROM projects
      ${includeAll ? "" : "WHERE status = 'published'"}
      ORDER BY sort_order ASC, updated_at ASC
    `,
  });

  return result.rows.map((row) => mapProjectRowToItem(projectRowSchema.parse(row)));
}

async function replaceJourneyItems(items: JourneyItem[]) {
  if (!db) {
    throw new Error("Admin editing requires a configured database");
  }
  await db.execute("DELETE FROM journey_items");

  const timestamp = createTimestamp();

  for (const item of items) {
    await db.execute({
      sql: `
        INSERT INTO journey_items (id, type, title, organization, location, period, description, status, sort_order, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
      `,
      args: [
        item.id,
        item.type,
        item.title,
        item.organization,
        item.location,
        item.period,
        item.description,
        item.status,
        item.sortOrder,
        timestamp,
        timestamp,
      ],
    });
  }
}

function createUpsertStoredContentStatement(
  scope: "profile" | "now" | "lives" | "highlights",
  data: string,
  timestamp: string,
) {
  return {
    sql: `
      INSERT INTO public_content (scope, data, updated_at)
      VALUES (?1, ?2, ?3)
      ON CONFLICT(scope) DO UPDATE SET
        data = excluded.data,
        updated_at = excluded.updated_at
    `,
    args: [scope, data, timestamp],
  };
}

function createReplaceJourneyStatements(items: JourneyItem[], timestamp: string) {
  return [
    {
      sql: "DELETE FROM journey_items",
      args: [],
    },
    ...items.map((item) => ({
      sql: `
        INSERT INTO journey_items (id, type, title, organization, location, period, description, status, sort_order, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
      `,
      args: [
        item.id,
        item.type,
        item.title,
        item.organization,
        item.location,
        item.period,
        item.description,
        item.status,
        item.sortOrder,
        timestamp,
        timestamp,
      ],
    })),
  ];
}

function createReplaceLifeMomentStatements(items: LifeMoment[], timestamp: string) {
  return [
    {
      sql: "DELETE FROM life_moments",
      args: [],
    },
    ...items.map((item) => ({
      sql: `
        INSERT INTO life_moments (id, title, image_url, thumbnail_url, alt, location, captured_at, description, width, height, status, sort_order, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
      `,
      args: [
        item.id,
        item.title,
        item.imageUrl,
        item.thumbnailUrl ?? null,
        item.alt,
        item.location,
        item.capturedAt,
        item.description,
        item.width,
        item.height,
        item.status,
        item.sortOrder,
        timestamp,
        timestamp,
      ],
    })),
  ];
}

function createReplaceProjectStatements(items: HighlightItem[], timestamp: string) {
  return [
    {
      sql: "DELETE FROM projects",
      args: [],
    },
    ...items.map((item) => ({
      sql: `
        INSERT INTO projects (id, title, summary, description, kind, period, stack_json, link, status, sort_order, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
      `,
      args: [
        item.id,
        item.title,
        item.summary,
        item.description,
        item.kind,
        item.period,
        JSON.stringify(item.stack),
        item.link ?? "",
        item.status,
        item.sortOrder,
        timestamp,
        timestamp,
      ],
    })),
  ];
}

async function replaceLifeMoments(items: LifeMoment[]) {
  if (!db) {
    throw new Error("Admin editing requires a configured database");
  }
  await db.execute("DELETE FROM life_moments");

  const timestamp = createTimestamp();

  for (const item of items) {
    await db.execute({
      sql: `
        INSERT INTO life_moments (id, title, image_url, thumbnail_url, alt, location, captured_at, description, width, height, status, sort_order, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
      `,
      args: [
        item.id,
        item.title,
        item.imageUrl,
        item.thumbnailUrl ?? null,
        item.alt,
        item.location,
        item.capturedAt,
        item.description,
        item.width,
        item.height,
        item.status,
        item.sortOrder,
        timestamp,
        timestamp,
      ],
    });
  }
}

async function replaceProjects(items: HighlightItem[]) {
  if (!db) {
    throw new Error("Admin editing requires a configured database");
  }
  await db.execute("DELETE FROM projects");

  const timestamp = createTimestamp();

  for (const item of items) {
    await db.execute({
      sql: `
        INSERT INTO projects (id, title, summary, description, kind, period, stack_json, link, status, sort_order, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
      `,
      args: [
        item.id,
        item.title,
        item.summary,
        item.description,
        item.kind,
        item.period,
        JSON.stringify(item.stack),
        item.link ?? "",
        item.status,
        item.sortOrder,
        timestamp,
        timestamp,
      ],
    });
  }
}

export async function getProfileContent(): Promise<ProfileContent> {
  try {
    const storedEntry = await getStoredContent(CONTENT_SCOPE_PROFILE);

    if (!storedEntry) {
      return fallbackProfile;
    }

    const rawValue: unknown = JSON.parse(storedEntry.data);
    const parsedProfile = profilePayloadSchema.safeParse(rawValue);

    if (!parsedProfile.success) {
      return fallbackProfile;
    }

    return parsedProfile.data;
  } catch {
    return fallbackProfile;
  }
}

export async function getNowContent(includeAll = false): Promise<NowContent> {
  const fallbackItems = includeAll ? fallbackNow.items : fallbackNow.items.filter((item) => item.status === "published");

  try {
    const items = await readJourneyItems(includeAll);
    const storedEntry = await getStoredContent(CONTENT_SCOPE_NOW);

    if (!storedEntry) {
      return {
        ...fallbackNow,
        items,
      };
    }

    const rawValue: unknown = JSON.parse(storedEntry.data);
    const parsedNow = z
      .object({
        summary: z.string().trim().min(1),
        updatedAt: z.string().trim().min(1),
      })
      .safeParse(rawValue);

    if (!parsedNow.success) {
      return {
        ...fallbackNow,
        items,
      };
    }

    return {
      ...parsedNow.data,
      items,
    };
  } catch {
    return {
      ...fallbackNow,
      items: fallbackItems,
    };
  }
}

export async function getLivesContent(includeAll = false): Promise<LifeMoment[]> {
  return readLifeMoments(includeAll);
}

export async function getHighlightsContent(includeAll = false): Promise<HighlightItem[]> {
  return readProjects(includeAll);
}

export async function saveProfileContent(content: ProfileContent) {
  const parsedProfile = profilePayloadSchema.parse(content);

  await saveStoredContent(CONTENT_SCOPE_PROFILE, JSON.stringify(parsedProfile));

  return parsedProfile;
}

export async function saveNowContent(content: NowContent) {
  const parsedNow = nowPayloadSchema.parse({
    ...content,
    updatedAt: createTimestamp().slice(0, 10),
  });

  await saveStoredContent(
    CONTENT_SCOPE_NOW,
    JSON.stringify({
      summary: parsedNow.summary,
      updatedAt: parsedNow.updatedAt,
    }),
  );
  await replaceJourneyItems(parsedNow.items);

  return parsedNow;
}

export async function saveLivesContent(items: LifeMoment[]) {
  const parsedLives = z.array(lifeMomentSchema).parse(items);

  await ensureContentStorage();

  await replaceLifeMoments(parsedLives);

  return parsedLives;
}

export async function saveHighlightsContent(items: HighlightItem[]) {
  const parsedHighlights = z.array(highlightItemSchema).parse(items);

  await ensureContentStorage();

  await replaceProjects(parsedHighlights);

  return parsedHighlights;
}

export async function saveAdminContent(content: {
  profile: ProfileContent;
  now: NowContent;
  lives: LifeMoment[];
  highlights: HighlightItem[];
}) {
  if (!db) {
    throw new Error("Admin editing requires a configured database");
  }

  const timestamp = createTimestamp();
  const parsedProfile = profilePayloadSchema.parse(content.profile);
  const parsedNow = nowPayloadSchema.parse({
    ...content.now,
    updatedAt: timestamp.slice(0, 10),
  });
  const parsedLives = z.array(lifeMomentSchema).parse(content.lives);
  const parsedHighlights = z.array(highlightItemSchema).parse(content.highlights);

  await ensureContentStorage();

  await db.batch(
    [
      createUpsertStoredContentStatement(CONTENT_SCOPE_PROFILE, JSON.stringify(parsedProfile), timestamp),
      createUpsertStoredContentStatement(
        CONTENT_SCOPE_NOW,
        JSON.stringify({
          summary: parsedNow.summary,
          updatedAt: parsedNow.updatedAt,
        }),
        timestamp,
      ),
      ...createReplaceJourneyStatements(parsedNow.items, timestamp),
      ...createReplaceLifeMomentStatements(parsedLives, timestamp),
      ...createReplaceProjectStatements(parsedHighlights, timestamp),
    ],
    "write",
  );

  return {
    profile: parsedProfile,
    now: parsedNow,
    lives: parsedLives,
    highlights: parsedHighlights,
  };
}

export function isAdminEditingEnabled() {
  return Boolean(db);
}
