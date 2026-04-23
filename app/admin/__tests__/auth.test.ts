import { beforeEach, describe, expect, jest, test } from '@jest/globals'

const mockCookies = jest.fn()

jest.mock('next/headers', () => ({
  cookies: (...args: unknown[]) => mockCookies(...args),
}))

describe('admin auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete process.env.ADMIN_UI_USERNAME
    delete process.env.ADMIN_UI_PASSWORD
  })

  test('validates configured credentials', async () => {
    process.env.ADMIN_UI_USERNAME = 'admin'
    process.env.ADMIN_UI_PASSWORD = 'secret'

    const auth = await import('../auth')

    expect(auth.isAdminConfigured()).toBe(true)
    expect(auth.validateAdminCredentials('admin', 'secret')).toBe(true)
    expect(auth.validateAdminCredentials('admin', 'wrong')).toBe(false)
  })

  test('authenticates matching admin session cookie', async () => {
    process.env.ADMIN_UI_USERNAME = 'admin'
    process.env.ADMIN_UI_PASSWORD = 'secret'

    const auth = await import('../auth')
    const token = auth.getAdminSessionToken()

    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: token }),
    })

    await expect(auth.isAdminAuthenticated()).resolves.toBe(true)
  })

  test('rejects missing admin session cookie', async () => {
    process.env.ADMIN_UI_USERNAME = 'admin'
    process.env.ADMIN_UI_PASSWORD = 'secret'

    const auth = await import('../auth')

    mockCookies.mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    })

    await expect(auth.isAdminAuthenticated()).resolves.toBe(false)
  })
})
