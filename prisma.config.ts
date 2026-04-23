import { defineConfig } from 'prisma/config'
import { getDatabaseUrl } from './app/lib/database-url'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: getDatabaseUrl({ preferNonPooling: true, required: false }),
  },
})
