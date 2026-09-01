import { PrismaClient } from "@prisma/client";

// Prisma singleton — prevents hot-reload from creating new connections in dev.
// In production, a single PrismaClient instance is used.
// FYI: globalThis persists across Next.js hot reloads.

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
