import { prisma } from "./prisma";
import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Cookies } from "@sveltejs/kit";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const COOKIE_NAME = "session";

interface Session {
  userId: number;
  exp: number;
}

export async function createSession(user: User): Promise<string> {
  const token = jwt.sign(
    { userId: user.id, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    JWT_SECRET,
  );
  return token;
}

export async function getSession(cookies: Cookies): Promise<Session | null> {
  const token = cookies.get(COOKIE_NAME);
  if (!token) return null;

  try {
    const session = jwt.verify(token, JWT_SECRET) as Session;
    return session;
  } catch {
    return null;
  }
}

export async function validatePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function createSessionCookie(token: string, secure: boolean = true): string {
  const secureFlag = secure ? " Secure;" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict;${secureFlag} Max-Age=${60 * 60 * 24 * 7}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
