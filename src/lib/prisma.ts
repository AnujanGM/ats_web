import { PrismaClient } from "@prisma/client";

/**
 * Global Prisma Client Singleton
 *
 * Why this pattern?
 * In Next.js development mode, Hot Module Replacement (HMR) re-imports server files
 * frequently. Without caching the PrismaClient instance on `globalThis`, each reload
 * would open a new PostgreSQL connection pool and quickly exhaust Supabase's connection
 * limit. In production, a single instance is created per server process.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper to check if a real PostgreSQL DATABASE_URL is configured.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      url.trim().length > 0 &&
      !url.includes("[PROJECT-REF]") &&
      !url.includes("[PASSWORD]")
  );
}
