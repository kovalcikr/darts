type DatabaseUrlOptions = {
  env?: NodeJS.ProcessEnv
  preferNonPooling?: boolean
  required?: boolean
}

function pickDatabaseUrl(
  env: NodeJS.ProcessEnv,
  preferNonPooling: boolean,
): string | undefined {
  if (preferNonPooling) {
    return env.POSTGRES_URL_NON_POOLING ?? env.POSTGRES_PRISMA_URL
  }

  return env.POSTGRES_PRISMA_URL ?? env.POSTGRES_URL_NON_POOLING
}

export function getDatabaseUrl({
  env = process.env,
  preferNonPooling = false,
  required = true,
}: DatabaseUrlOptions = {}): string {
  const databaseUrl = pickDatabaseUrl(env, preferNonPooling)

  if (databaseUrl) {
    return databaseUrl
  }

  if (!required) {
    return ''
  }

  throw new Error(
    'Missing database configuration. Set POSTGRES_PRISMA_URL or POSTGRES_URL_NON_POOLING.',
  )
}
