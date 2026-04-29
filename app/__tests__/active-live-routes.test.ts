import { describe, expect, test } from '@jest/globals'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readWorkspaceFile(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('active tournament live route guardrails', () => {
  test('dashboard client fetches the active dashboard API only', () => {
    const source = readWorkspaceFile('app/dashboard/dashboard-view.tsx')

    expect(source).toContain('/api/dashboard')
    expect(source).not.toContain('/api/dashboard/tournament/')
  })

  test('active table selector does not render tournament-specific scoreboard links', () => {
    const source = readWorkspaceFile('app/tables/page.tsx')

    expect(source).toContain('href={`/tables/1${item}`}')
    expect(source).not.toContain('/tournaments/')
  })
})
