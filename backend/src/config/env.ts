import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const defaultFrontendOrigins = [
  "http://localhost:5173",
  "https://www.nedk.cn",
] as const satisfies readonly string[];

const frontendOriginSchema = z.string().trim().url();

function optionalTrimmedString(minLength = 1) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(minLength).optional(),
  );
}

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

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    FRONTEND_ORIGINS: z.string().trim().optional(),
    ADMIN_USERNAME: optionalTrimmedString(),
    ADMIN_PASSWORD: optionalTrimmedString(12),
    ADMIN_SESSION_SECRET: optionalTrimmedString(32),
    BLOB_READ_WRITE_TOKEN: optionalTrimmedString(),
    TURSO_DATABASE_URL: optionalTrimmedString(),
    TURSO_AUTH_TOKEN: optionalTrimmedString(),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== "production") {
      return;
    }

    for (const key of ["ADMIN_USERNAME", "ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"] as const) {
      if (!value[key]) {
        context.addIssue({
          code: "custom",
          message: `${key} is required in production`,
          path: [key],
        });
      }
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

const rawEnv = parsedEnv.data;
const developmentAdminPassword = "development-only-password";
const developmentSessionSecret = "development-only-session-secret-change-me";

export const env = {
  ...rawEnv,
  FRONTEND_ORIGINS: parseFrontendOrigins(rawEnv.FRONTEND_ORIGINS),
  ADMIN_USERNAME: rawEnv.ADMIN_USERNAME ?? "admin",
  ADMIN_PASSWORD: rawEnv.ADMIN_PASSWORD ?? developmentAdminPassword,
  ADMIN_SESSION_SECRET: rawEnv.ADMIN_SESSION_SECRET ?? developmentSessionSecret,
  BLOB_READ_WRITE_TOKEN: rawEnv.BLOB_READ_WRITE_TOKEN || undefined,
  TURSO_DATABASE_URL: rawEnv.TURSO_DATABASE_URL || undefined,
  TURSO_AUTH_TOKEN: rawEnv.TURSO_AUTH_TOKEN || undefined,
};

export const isTursoConfigured = Boolean(env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN);
export const isBlobConfigured = Boolean(env.BLOB_READ_WRITE_TOKEN);
