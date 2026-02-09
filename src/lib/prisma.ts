import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const isDev = process.env.NODE_ENV !== "production"

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: isDev ? 5 : 20,
  })

  return new PrismaClient({
    adapter,
    log: isDev ? ["warn", "error"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
