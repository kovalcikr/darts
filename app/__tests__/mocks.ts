import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import prisma from '../lib/db';
import axios from 'axios';
import { jest, beforeEach, test, expect } from '@jest/globals';

jest.mock('../lib/db', () => ({
    __esModule: true,
    default: mockDeep<PrismaClient>(),
}))

jest.mock('axios');
beforeEach(() => {
    mockReset(prismaMock);
    mockedAxios.get.mockResolvedValue({ data: {} });
})

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
export const mockedAxios = axios as jest.Mocked<typeof axios>;

test('dummy test', () => {
    expect(true).toBe(true);
});
