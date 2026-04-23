import 'server-only'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/prisma/client'
import { getDatabaseUrl } from './database-url'

const prismaClientSingleton = () => {
  const connectionString = getDatabaseUrl()

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
