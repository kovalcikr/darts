import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import type { PrismaClient } from '@/prisma/client'
import { mockDeep, mockReset } from 'jest-mock-extended'
import prisma from '@/app/lib/db'

import {
  getTableMappings,
  getTableIdBySlot,
  defaultTableMappings,
} from '../table-mappings'

jest.mock('@/app/lib/db', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

const prismaMock = prisma as any

function mockResolved(fn: unknown, value: unknown) {
  ;(fn as { mockResolvedValue: (mockValue: unknown) => void }).mockResolvedValue(value)
}

describe('table mappings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockReset(prismaMock)
  })

  describe('defaultTableMappings', () => {
    test('provides default mapping of slot to CueScore table name', () => {
      expect(defaultTableMappings).toEqual([
        { slot: 1, cuescoreTableName: '11' },
        { slot: 2, cuescoreTableName: '12' },
        { slot: 3, cuescoreTableName: '13' },
        { slot: 4, cuescoreTableName: '14' },
        { slot: 5, cuescoreTableName: '15' },
        { slot: 6, cuescoreTableName: '16' },
      ])
    })
  })

  describe('getTableMappings', () => {
    test('returns defaults when no setting exists', async () => {
      mockResolved(prismaMock.appSetting.findUnique, null)

      const mappings = await getTableMappings()

      expect(mappings).toEqual(defaultTableMappings)
    })

    test('returns parsed mappings from app setting', async () => {
      mockResolved(prismaMock.appSetting.findUnique, {
        key: 'tableMappings',
        value: JSON.stringify([
          { slot: 1, cuescoreTableName: 'A' },
          { slot: 2, cuescoreTableName: 'B' },
          { slot: 3, cuescoreTableName: 'C' },
          { slot: 4, cuescoreTableName: 'D' },
          { slot: 5, cuescoreTableName: 'E' },
          { slot: 6, cuescoreTableName: 'F' },
        ]),
        updatedAt: new Date('2026-04-29T00:00:00.000Z'),
      })

      const mappings = await getTableMappings()

      expect(mappings).toEqual([
        { slot: 1, cuescoreTableName: 'A' },
        { slot: 2, cuescoreTableName: 'B' },
        { slot: 3, cuescoreTableName: 'C' },
        { slot: 4, cuescoreTableName: 'D' },
        { slot: 5, cuescoreTableName: 'E' },
        { slot: 6, cuescoreTableName: 'F' },
      ])
    })

    test('returns defaults when JSON is invalid', async () => {
      mockResolved(prismaMock.appSetting.findUnique, {
        key: 'tableMappings',
        value: 'not valid json',
        updatedAt: new Date('2026-04-29T00:00:00.000Z'),
      })

      const mappings = await getTableMappings()

      expect(mappings).toEqual(defaultTableMappings)
    })

    test('returns defaults when JSON is not an array', async () => {
      mockResolved(prismaMock.appSetting.findUnique, {
        key: 'tableMappings',
        value: JSON.stringify({ slot: 1, cuescoreTableName: 'X' }),
        updatedAt: new Date('2026-04-29T00:00:00.000Z'),
      })

      const mappings = await getTableMappings()

      expect(mappings).toEqual(defaultTableMappings)
    })
  })

  describe('getTableIdBySlot', () => {
    test('returns default CueScore table name when no setting', async () => {
      mockResolved(prismaMock.appSetting.findUnique, null)

      expect(await getTableIdBySlot(1)).toBe('11')
      expect(await getTableIdBySlot(2)).toBe('12')
      expect(await getTableIdBySlot(6)).toBe('16')
    })

    test('returns configured CueScore table name for slot', async () => {
      mockResolved(prismaMock.appSetting.findUnique, {
        key: 'tableMappings',
        value: JSON.stringify([
          { slot: 1, cuescoreTableName: 'table-A' },
          { slot: 2, cuescoreTableName: 'table-B' },
          { slot: 3, cuescoreTableName: 'table-C' },
          { slot: 4, cuescoreTableName: 'table-D' },
          { slot: 5, cuescoreTableName: 'table-E' },
          { slot: 6, cuescoreTableName: 'table-F' },
        ]),
      })

      expect(await getTableIdBySlot(1)).toBe('table-A')
      expect(await getTableIdBySlot(6)).toBe('table-F')
    })

    test('returns default for slot not found in mapping', async () => {
      mockResolved(prismaMock.appSetting.findUnique, {
        key: 'tableMappings',
        value: JSON.stringify([
          { slot: 1, cuescoreTableName: 'table-A' },
          // missing slots 2-6
        ]),
      })

      // slot 1 is configured
      expect(await getTableIdBySlot(1)).toBe('table-A')
      // slots 2-6 fall back to defaults
      expect(await getTableIdBySlot(2)).toBe('12')
      expect(await getTableIdBySlot(6)).toBe('16')
    })
  })
})
