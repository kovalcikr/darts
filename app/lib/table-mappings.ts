export type TableMapping = {
  slot: number
  cuescoreTableName: string
}

export const defaultTableMappings: TableMapping[] = [
  { slot: 1, cuescoreTableName: '11' },
  { slot: 2, cuescoreTableName: '12' },
  { slot: 3, cuescoreTableName: '13' },
  { slot: 4, cuescoreTableName: '14' },
  { slot: 5, cuescoreTableName: '15' },
  { slot: 6, cuescoreTableName: '16' },
]

const TABLE_MAPPINGS_KEY = 'tableMappings'

export async function getTableMappings(): Promise<TableMapping[]> {
  const { default: prisma } = await import('./db')
  
  const setting = await prisma.appSetting.findUnique({
    where: { key: TABLE_MAPPINGS_KEY },
    select: { value: true },
  })

  if (!setting?.value) {
    return defaultTableMappings
  }

  try {
    const parsed = JSON.parse(setting.value)
    if (!Array.isArray(parsed)) {
      return defaultTableMappings
    }
    return parsed
  } catch {
    return defaultTableMappings
  }
}

export async function getTableIdBySlot(slot: number): Promise<string> {
   const mappings = await getTableMappings()
   const mapping = mappings.find((m) => m.slot === slot)
   
   if (!mapping) {
     const defaultMapping = defaultTableMappings.find((m) => m.slot === slot)
     return defaultMapping?.cuescoreTableName ?? '11'
   }
   
   return mapping.cuescoreTableName
}

export async function getTableSlotByTableId(tableId: string): Promise<number | null> {
   const mappings = await getTableMappings()
   const mapping = mappings.find((m) => m.cuescoreTableName === tableId)
   return mapping?.slot ?? null
}
