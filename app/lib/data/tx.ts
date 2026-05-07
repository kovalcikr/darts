import 'server-only'
import prisma from "../db";
import type { Prisma } from '@/prisma/client'

type PrismaTransactionClient = Omit<Prisma.TransactionClient, "$transaction" | "$on" | "$connect" | "$disconnect" | "$use">

export async function runInTransaction<T>(
    fn: (tx: PrismaTransactionClient) => Promise<T>
): Promise<T> {
    return prisma.$transaction(fn);
}