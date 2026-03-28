import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const defaultFrontendOrigins = [
  "http://localhost:5173",
  "https://www.nedk.cn",
] as const satisfies readonly string[];

const frontendOriginSchema = z.string().trim().url();

function parseFrontendOrigins(value: string | undefined) {
  const rawOrigins = value
    ? value
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : [...defaultFrontendOrigins];

  const parsedOrigins = z.array(frontendOriginSchema).safeParse(rawOrigins);

  if (!parsedOrigins.success) {
    console.error("Invalid FRONTEND_ORIGINS", parsedOrigins.error.issues);
    throw new Error("Invalid FRONTEND_ORIGINS");
  }

  return parsedOrigins.data;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGINS: z.string().trim().optional(),
  ADMIN_USERNAME: z.string().trim().min(1).default("admin"),
  ADMIN_PASSWORD: z.string().trim().min(1).default("190828xmd"),
  TURSO_DATABASE_URL: z.string().trim().optional(),
  TURSO_AUTH_TOKEN: z.string().trim().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

const rawEnv = parsedEnv.data;

export const env = {
  ...rawEnv,
  FRONTEND_ORIGINS: parseFrontendOrigins(rawEnv.FRONTEND_ORIGINS),
  TURSO_DATABASE_URL: rawEnv.TURSO_DATABASE_URL || undefined,
  TURSO_AUTH_TOKEN: rawEnv.TURSO_AUTH_TOKEN || undefined,
};

export const isTursoConfigured = Boolean(env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN);
