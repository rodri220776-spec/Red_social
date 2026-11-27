const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createDatabase } = require('../database');

const repositoryRoot = path.join(__dirname, '..');
const adminEmail = 'admin-only-test@example.com';
const adminPassword = 'TestAdminPassword!234';
const userEmail = 'regular-test@example.com';
const userPassword = 'TestRegularPassword!234';

const reservePort = async () => {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const { port } = listener.address();
  await new Promise((resolve, reject) => {
    listener.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
};

const waitForHealth = async (serverProcess, url) => {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Test server exited with code ${serverProcess.exitCode}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {
      // The server may not be listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test server did not become ready.');
};

test('admin-only mode rejects public account creation and non-admin login', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vivelink-admin-only-'));
  const database = createDatabase(path.join(directory, 'test.sqlite'));
  const port = await reservePort();
  let serverProcess;

  await database.initialize({ seed: false });
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(userPassword, salt, 100000, 64, 'sha512').toString('hex');
  await database.run(
    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 0)',
    ['Regular User', userEmail, `${salt}:${passwordHash}`]
  );
  await database.close();

  const serverEnv = {
    ...process.env,
    NODE_ENV: 'development',
    ADMIN_ONLY: 'true',
    ADMIN_EMAIL: adminEmail,
    ADMIN_PASSWORD: adminPassword,
    PORT: String(port),
    SQLITE_PATH: path.join(directory, 'test.sqlite')
  };
  delete serverEnv.DATABASE_URL;

  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: repositoryRoot,
    env: serverEnv,
    stdio: 'ignore'
  });

  t.after(async () => {
    if (serverProcess.exitCode === null) {
      const exited = new Promise((resolve) => serverProcess.once('exit', resolve));
      serverProcess.kill();
      await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3000))]);
    }
    if (serverProcess.exitCode === null) serverProcess.kill('SIGKILL');
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHealth(serverProcess, `${baseUrl}/health`);

  const configResponse = await fetch(`${baseUrl}/api/config`);
  assert.deepEqual(await configResponse.json(), { adminOnly: true });

  const registerResponse = await fetch(`${baseUrl}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'New User', email: 'new@example.com', password: userPassword })
  });
  assert.equal(registerResponse.status, 403);

  const userLoginResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, password: userPassword })
  });
  assert.equal(userLoginResponse.status, 401);

  const adminLoginResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });
  assert.equal(adminLoginResponse.status, 200);
  const { token, user } = await adminLoginResponse.json();
  assert.equal(user.isAdmin, true);

  const createUserResponse = await fetch(`${baseUrl}/api/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Another User',
      email: 'another@example.com',
      password: userPassword
    })
  });
  assert.equal(createUserResponse.status, 403);
});
