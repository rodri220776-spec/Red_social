const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createDatabase } = require('../database');

test('initializes the SQLite schema without demo data', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vivelink-test-'));
  const database = createDatabase(path.join(directory, 'test.sqlite'));

  t.after(async () => {
    await database.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  await database.initialize({ seed: false });
  const tables = await database.all(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
  );

  assert.deepEqual(tables.map(({ name }) => name), [
    'chats',
    'likes',
    'messages',
    'posts',
    'sqlite_sequence',
    'users'
  ]);
  assert.equal(await database.get('SELECT COUNT(*) AS count FROM users').then(({ count }) => count), 0);
});
