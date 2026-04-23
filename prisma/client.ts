// Centralize Prisma imports so the later generator/output switch stays local.
export { Prisma, PrismaClient } from './generated/client/client.ts'
export type { Match, PlayerThrow, Tournament } from './generated/client/client.ts'
