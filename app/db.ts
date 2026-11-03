import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';
import { getDatabaseUrl } from './database-url';

export const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3(
    { url: getDatabaseUrl() },
    // Existing records use milliseconds, not the adapter's default ISO strings.
    { timestampFormat: 'unixepoch-ms' },
  ),
});
