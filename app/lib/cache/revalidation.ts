import 'server-only'

import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Revalidates the scoreboard for a table slot.
 * @param slot - The slot number (1-6) corresponding to physical tables
 */
export function revalidateTableSlot(slot: number): void {
    revalidatePath('/tables/[table]', 'page')
    revalidateTag(`match${slot}`, 'max')
}

/**
 * Revalidates the scoreboard for a CueScore table ID.
 * Maintains backward compatibility with existing cache tags.
 * @param tableId - The CueScore table identifier (e.g., '11', '12')
 */
export function revalidateTableById(tableId: string): void {
    revalidatePath('/tables/[table]', 'page')
    revalidateTag(`match${tableId}`, 'max')
}