import { existsSync } from 'node:fs';

const systemChromiumExecutablePath = '/usr/bin/chromium-browser';

export function resolveChromiumExecutablePath(
  env: NodeJS.ProcessEnv = process.env,
  pathExists: (path: string) => boolean = existsSync,
) {
  if (env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    return env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  }

  return pathExists(systemChromiumExecutablePath) ? systemChromiumExecutablePath : undefined;
}
