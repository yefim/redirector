import 'dotenv/config';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  // Preserve Prisma's schema-relative paths and strip legacy connection options.
  return `file:${fileURLToPath(new URL(url, pathToFileURL(resolve('prisma') + '/')))}`;
}
