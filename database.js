const sqlite3 = process.env.DATABASE_URL ? null : require('sqlite3').verbose();
const { Pool } = require('pg');

const replacePlaceholders = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

const createDatabase = (sqlitePath) => {
  const isPostgres = Boolean(process.env.DATABASE_URL);
  const sqlite = isPostgres ? null : new sqlite3.Database(sqlitePath);
  const pool = isPostgres
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : null;

  const query = async (sql, params = []) => {
    if (!isPostgres) {
      return new Promise((resolve, reject) => {
        sqlite.all(sql, params, (error, rows) => {
          if (error) return reject(error);
          resolve({ rows });
        });
      });
    }

    let statement = replacePlaceholders(sql);
    if (/^\s*INSERT\b/i.test(statement) && !/\bRETURNING\b/i.test(statement)) {
      statement += ' RETURNING id';
    }
    return pool.query(statement, params);
  };

  const withCallback = (promise, callback, getResult) => {
    if (typeof callback !== 'function') {
      return promise.then((result) => getResult(result).value);
    }
    return promise.then(
      (result) => {
        const mapped = getResult(result);
        callback.call(mapped.context, null, mapped.value);
      },
      (error) => callback(error)
    );
  };

  return {
    isPostgres,
    async initialize({ seed = true } = {}) {
      const idColumn = isPostgres ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
      const timestampColumn = isPostgres ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'TEXT DEFAULT CURRENT_TIMESTAMP';

      const schema = [
        `CREATE TABLE IF NOT EXISTS users (
          id ${idColumn},
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          city TEXT,
          age INTEGER,
          image TEXT,
          match_score INTEGER DEFAULT 92,
          tags TEXT DEFAULT '[]',
          is_admin INTEGER NOT NULL DEFAULT 0
        )`,
        `CREATE TABLE IF NOT EXISTS posts (
          id ${idColumn},
          user_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          image TEXT,
          video_id TEXT,
          created_at ${timestampColumn},
          FOREIGN KEY(user_id) REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS likes (
          id ${idColumn},
          user_id INTEGER NOT NULL,
          post_id INTEGER NOT NULL,
          UNIQUE(user_id, post_id),
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(post_id) REFERENCES posts(id)
        )`,
        `CREATE TABLE IF NOT EXISTS chats (
          id ${idColumn},
          user1_id INTEGER NOT NULL,
          user2_id INTEGER NOT NULL,
          updated_at ${timestampColumn},
          UNIQUE(user1_id, user2_id)
        )`,
        `CREATE TABLE IF NOT EXISTS messages (
          id ${idColumn},
          chat_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          created_at ${timestampColumn},
          FOREIGN KEY(chat_id) REFERENCES chats(id),
          FOREIGN KEY(sender_id) REFERENCES users(id)
        )`
      ];

      for (const statement of schema) {
        await query(statement);
      }

      if (isPostgres) {
        await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin INTEGER NOT NULL DEFAULT 0');
        await query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_id TEXT');
      } else {
        const columns = await query('PRAGMA table_info(users)');
        if (!columns.rows.some((column) => column.name === 'is_admin')) {
          await query('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
        }
        const postColumns = await query('PRAGMA table_info(posts)');
        if (!postColumns.rows.some((column) => column.name === 'video_id')) {
          await query('ALTER TABLE posts ADD COLUMN video_id TEXT');
        }
      }

      if (!seed) return;

      const seedUsers = [
        ['Lucía', 'lucia@vivelink.com', 'Madrid', 24, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80', 96, ['Cine', 'Senderismo']],
        ['Daniel', 'daniel@vivelink.com', 'Barcelona', 27, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 92, ['Música', 'Vía libre']],
        ['Sara', 'sara@vivelink.com', 'Valencia', 22, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80', 91, ['Fotografía', 'Gastronomía']],
        ['Martín', 'martin@vivelink.com', 'Sevilla', 29, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80', 89, ['Running', 'Podcast']],
        ['Alicia', 'alicia@vivelink.com', 'Madrid', 25, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80', 88, ['Viajes', 'Arte']]
      ];

      for (const [name, email, city, age, image, score, tags] of seedUsers) {
        const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
        if (!existing.rows.length) {
          await query(
            'INSERT INTO users (name, email, password, city, age, image, match_score, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashPassword('123456'), city, age, image, score, JSON.stringify(tags)]
          );
        }
      }

      const postCount = await query('SELECT COUNT(*) AS total FROM posts');
      if (Number(postCount.rows[0].total) === 0) {
        const seeded = await query(
          'SELECT id, email FROM users WHERE email IN (?, ?, ?)',
          ['alicia@vivelink.com', 'lucia@vivelink.com', 'martin@vivelink.com']
        );
        const userIds = Object.fromEntries(seeded.rows.map((row) => [row.email, row.id]));
        await query(
          'INSERT INTO posts (user_id, text, image) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
          [
            userIds['alicia@vivelink.com'], 'Hoy he descubierto un rincón genial para ver el atardecer en Madrid. ¿Alguien se apunta a una escapada el finde?', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
            userIds['lucia@vivelink.com'], 'Acabo de terminar mi primera ruta de senderismo y todavía me quedo con la vista desde la cima. ¡La naturaleza siempre da un buen energy!', 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1200&q=80',
            userIds['martin@vivelink.com'], 'Busco gente con ganas de probar un café nuevo y luego dar una vuelta por el centro. ¡Qué mejor que descubrir sitios juntos!', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
          ]
        );
      }
    },
    get(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const promise = query(sql, params).then((result) => result.rows[0]);
      return withCallback(promise, callback, (row) => ({ context: null, value: row }));
    },
    all(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const promise = query(sql, params).then((result) => result.rows);
      return withCallback(promise, callback, (rows) => ({ context: null, value: rows }));
    },
    run(sql, params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      const promise = isPostgres
        ? query(sql, params).then((result) => ({
          lastID: result.rows[0]?.id,
          changes: result.rowCount
        }))
        : new Promise((resolve, reject) => {
          sqlite.run(sql, params, function (error) {
            if (error) return reject(error);
            resolve({ lastID: this.lastID, changes: this.changes });
          });
        });
      return withCallback(promise, callback, (result) => ({
        context: { lastID: result.lastID, changes: result.changes },
        value: undefined
      }));
    },
    close() {
      return isPostgres ? pool.end() : new Promise((resolve, reject) => {
        sqlite.close((error) => error ? reject(error) : resolve());
      });
    }
  };
};

const hashPassword = (password) => {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

module.exports = { createDatabase };
