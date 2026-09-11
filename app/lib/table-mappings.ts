export type TableMapping = {
  slot: number
  cuescoreTableName: string
}

export function validateTableMappings(value: unknown): TableMapping[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('At least one Table Mapping is required.')
  }
  if (value.length > 10) {
    throw new Error('A maximum of 10 Table Mappings is allowed.')
  }

  const slots = new Set<number>()
  const names = new Set<string>()
  const mappings = value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Table Mapping ${index + 1} is invalid.`)
    }
    const candidate = item as { slot?: unknown; cuescoreTableName?: unknown }
    if (!Number.isInteger(candidate.slot) || Number(candidate.slot) <= 0) {
      throw new Error(`Table Mapping ${index + 1} must have a positive Slot.`)
    }
    const slot = Number(candidate.slot)
    const name = typeof candidate.cuescoreTableName === 'string'
      ? candidate.cuescoreTableName.trim()
      : ''
    if (!name) {
      throw new Error(`Table Mapping ${index + 1} requires a CueScore Table Name.`)
    }
    if (slots.has(slot)) {
      throw new Error(`Slot ${slot} is used more than once.`)
    }
    if (names.has(name)) {
      throw new Error(`CueScore Table Name "${name}" is used more than once.`)
    }
    slots.add(slot)
    names.add(name)
    return { slot, cuescoreTableName: name }
  })

  return mappings.sort((a, b) => a.slot - b.slot)
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
    return validateTableMappings(JSON.parse(setting.value))
  } catch {
    return defaultTableMappings
  }
}

export async function getTableMappingBySlot(slot: number): Promise<TableMapping | null> {
  const mappings = await getTableMappings()
  return mappings.find((mapping) => mapping.slot === slot) ?? null
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
