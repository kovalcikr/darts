import 'dotenv/config'

import { defineConfig } from 'prisma/config'
import { getDatabaseUrl } from './app/lib/database-url'

const fallbackGenerateUrl = 'postgresql://prisma:prisma@localhost:5432/prisma'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // `prisma generate` still validates datasource syntax even though it does not
    // need a live database connection. Keep the real URL when available, and
    // fall back to a syntactically valid placeholder for generation-only flows.
    url: getDatabaseUrl({ preferNonPooling: true, required: false }) || fallbackGenerateUrl,
  },
})
