const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');
const { test } = require('node:test');
const { getDatabaseUrl } = require('../build/database-url');

test('database URLs preserve schema-relative paths and absolute production paths', () => {
  const originalUrl = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = 'file:./sqlite.db?connection_limit=1';
    assert.equal(getDatabaseUrl(), `file:${resolve('prisma/sqlite.db')}`);
    process.env.DATABASE_URL = 'file:/data/sqlite.db';
    assert.equal(getDatabaseUrl(), 'file:/data/sqlite.db');
    delete process.env.DATABASE_URL;
    assert.throws(getDatabaseUrl, /DATABASE_URL is required/);
  } finally {
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  }
});

test('Prisma 7 reads legacy timestamps and preserves their format on writes', async t => {
  const dir = mkdtempSync('/tmp/redirector-prisma-');
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${dir}/test.db`;
  let prisma;
  let sqlite;
  t.after(async () => {
    if (prisma) await prisma.$disconnect();
    if (sqlite) sqlite.close();
    rmSync(dir, { recursive: true, force: true });
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  });

  sqlite = new DatabaseSync(`${dir}/test.db`);
  const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    env: process.env,
    encoding: 'utf8',
  });
  assert.equal(migration.status, 0, migration.stdout + migration.stderr);
  const timestamp = Date.parse('2023-03-22T12:00:00Z');
  sqlite.prepare('INSERT INTO "ShortLink" ("linkId", "host", "redirectUrl", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?)')
    .run('legacy-link', 'legacy.example', 'https://example.com/original', timestamp, timestamp);
  sqlite.prepare('INSERT INTO "Hit" ("hitId", "linkId", "rawHeaders", "createdAt") VALUES (?, ?, ?, ?)')
    .run('legacy-hit', 'legacy-link', '{}', timestamp);

  ({ prisma } = require('../build/db'));
  const legacy = await prisma.shortLink.findUnique({ where: { host: 'legacy.example' }, include: { hits: true } });
  assert.equal(legacy.createdAt.getTime(), timestamp);
  assert.equal(legacy.hits[0].createdAt.getTime(), timestamp);
  await prisma.shortLink.update({ where: { linkId: legacy.linkId }, data: { redirectUrl: 'https://example.com/updated' } });
  await prisma.hit.create({ data: { linkId: legacy.linkId, rawHeaders: '{}' } });
  assert.equal(await prisma.hit.count({ where: { linkId: legacy.linkId } }), 2);
  assert.equal(sqlite.prepare('SELECT typeof("updatedAt") AS format FROM "ShortLink"').get().format, 'integer');
  assert.equal(sqlite.prepare('SELECT count(*) AS total FROM "Hit" WHERE typeof("createdAt") = ?').get('integer').total, 2);
});
