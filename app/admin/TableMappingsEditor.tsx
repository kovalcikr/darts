'use client'

import { useState } from 'react'
import type { TableMapping } from '@/app/lib/table-mappings'
import { ActionButton, TextField } from './ui'
import { saveTableMappingsAction } from './actions'

export default function TableMappingsEditor({ mappings }: { mappings: TableMapping[] }) {
  const [rows, setRows] = useState(mappings)

  function addRow() {
    const usedSlots = new Set(rows.map((row) => row.slot))
    let slot = 1
    while (usedSlots.has(slot)) slot += 1
    setRows([...rows, { slot, cuescoreTableName: '' }])
  }

  return (
    <form action={saveTableMappingsAction} className="grid gap-4">
      <input name="returnTo" type="hidden" value="/admin" />
      <input name="mappings" type="hidden" value={JSON.stringify(rows)} readOnly />
      <div className="grid gap-3">
        {rows.map((row, index) => (
          <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 md:grid-cols-[0.35fr_1fr_auto] md:items-end" key={row.slot}>
            <TextField label="Slot" name={`slot-${row.slot}`} defaultValue={row.slot} readOnly />
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span>CueScore Table Name</span>
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal tracking-normal text-slate-100 outline-none transition focus:border-cyan-400"
                name={`name-${row.slot}`}
                onChange={(event) => {
                  const name = event.target.value
                  setRows(rows.map((candidate, candidateIndex) => candidateIndex === index ? { ...candidate, cuescoreTableName: name } : candidate))
                }}
                value={row.cuescoreTableName}
              />
            </label>
            <ActionButton
              tone="danger"
              type="button"
              onClick={() => setRows(rows.filter((_, candidateIndex) => candidateIndex !== index))}
            >
              Remove
            </ActionButton>
          </div>
        ))}
      </div>
      <p className="text-sm text-amber-200">
        Remapping a Slot with a live Match is allowed, but its next refresh may switch upstream grouping.
      </p>
      <div className="flex flex-wrap gap-3">
        <ActionButton type="button" tone="muted" onClick={addRow}>Add Table Mapping</ActionButton>
        <ActionButton>Save Table Mappings</ActionButton>
      </div>
    </form>
  )
}
