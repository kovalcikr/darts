import { describe, expect, test } from '@jest/globals';
import { resolveChromiumExecutablePath } from '../../playwright.browser-path';

describe('resolveChromiumExecutablePath', () => {
  test('prefers the explicit playwright executable path', () => {
    expect(
      resolveChromiumExecutablePath(
        { PLAYWRIGHT_CHROMIUM_EXECUTABLE: '/custom/chromium' } as NodeJS.ProcessEnv,
        () => false,
      )
    ).toBe('/custom/chromium');
  });

  test('falls back to the system chromium path when it exists', () => {
    expect(resolveChromiumExecutablePath({} as NodeJS.ProcessEnv, (path) => path === '/usr/bin/chromium-browser'))
      .toBe('/usr/bin/chromium-browser');
  });

  test('returns undefined when no chromium executable is configured', () => {
    expect(resolveChromiumExecutablePath({} as NodeJS.ProcessEnv, () => false)).toBeUndefined();
  });
});
