import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
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
  TURSO_DATABASE_URL: rawEnv.TURSO_DATABASE_URL || undefined,
  TURSO_AUTH_TOKEN: rawEnv.TURSO_AUTH_TOKEN || undefined,
};

export const isTursoConfigured = Boolean(env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN);
