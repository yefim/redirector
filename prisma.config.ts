import { defineConfig } from 'prisma/config';
import { getDatabaseUrl } from './app/database-url';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: process.env.DATABASE_URL ? { url: getDatabaseUrl() } : undefined,
});
