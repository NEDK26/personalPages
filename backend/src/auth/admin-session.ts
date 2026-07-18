import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { env } from "../config/env";

const ADMIN_SESSION_COOKIE = "personal_pages_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

interface AdminSessionPayload {
  username: string;
  csrfToken: string;
  expiresAt: number;
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", env.ADMIN_SESSION_SECRET).update(encodedPayload).digest("base64url");
}

function createSessionToken(payload: AdminSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function hasValidSignature(encodedPayload: string, providedSignature: string) {
  const expectedSignature = Buffer.from(signPayload(encodedPayload), "utf8");
  const actualSignature = Buffer.from(providedSignature, "utf8");

  return (
    expectedSignature.length === actualSignature.length &&
    timingSafeEqual(expectedSignature, actualSignature)
  );
}

function parseSessionToken(token: string): AdminSessionPayload | null {
  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const encodedPayload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  if (!hasValidSignature(encodedPayload, signature)) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    if (typeof value !== "object" || value === null) {
      return null;
    }

    const payload = value as Partial<AdminSessionPayload>;

    if (
      payload.username !== env.ADMIN_USERNAME ||
      typeof payload.csrfToken !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }

    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}

export function createAdminSession(c: Context) {
  const payload: AdminSessionPayload = {
    username: env.ADMIN_USERNAME,
    csrfToken: randomBytes(24).toString("base64url"),
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };

  setCookie(c, ADMIN_SESSION_COOKIE, createSessionToken(payload), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "Strict",
    secure: env.NODE_ENV === "production",
  });

  return payload;
}

export function getAdminSession(c: Context) {
  const token = getCookie(c, ADMIN_SESSION_COOKIE);

  return token ? parseSessionToken(token) : null;
}

export function clearAdminSession(c: Context) {
  deleteCookie(c, ADMIN_SESSION_COOKIE, {
    path: "/",
    secure: env.NODE_ENV === "production",
  });
}

export function hasValidCsrfToken(c: Context, session: AdminSessionPayload) {
  const providedToken = c.req.header("x-csrf-token");

  if (!providedToken) {
    return false;
  }

  const expectedToken = Buffer.from(session.csrfToken, "utf8");
  const actualToken = Buffer.from(providedToken, "utf8");

  return expectedToken.length === actualToken.length && timingSafeEqual(expectedToken, actualToken);
}

export type { AdminSessionPayload };
