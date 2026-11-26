const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { createDatabase } = require('./database');

const sourcePath = path.join(__dirname, 'database.sqlite');
const tables = ['users', 'posts', 'likes', 'chats', 'messages'];
const demoEmails = new Set([
  'lucia@vivelink.com',
  'daniel@vivelink.com',
  'sara@vivelink.com',
  'martin@vivelink.com',
  'alicia@vivelink.com'
]);

const readRows = (sqlite, table) => new Promise((resolve, reject) => {
  sqlite.all(`SELECT * FROM ${table} ORDER BY id`, (error, rows) => {
    if (error) return reject(error);
    resolve(rows);
  });
});

const run = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('Define DATABASE_URL con la URL de conexión de Neon antes de migrar.');
  }
  if (!fs.existsSync(sourcePath)) {
    throw new Error('No se encontró database.sqlite; no hay una base local que migrar.');
  }

  const db = createDatabase(sourcePath);
  const sqlite = new sqlite3.Database(sourcePath);
  try {
    await db.initialize({ seed: false });
    const data = {};
    for (const table of tables) data[table] = await readRows(sqlite, table);

    const demoUserIds = new Set(data.users
      .filter((user) => demoEmails.has(user.email.toLowerCase()))
      .map((user) => user.id));
    data.users = data.users.filter((user) => !demoUserIds.has(user.id));
    data.posts = data.posts.filter((post) => !demoUserIds.has(post.user_id));
    const retainedPostIds = new Set(data.posts.map((post) => post.id));
    data.likes = data.likes.filter((like) => (
      !demoUserIds.has(like.user_id) && retainedPostIds.has(like.post_id)
    ));
    data.chats = data.chats.filter((chat) => (
      !demoUserIds.has(chat.user1_id) && !demoUserIds.has(chat.user2_id)
    ));
    const retainedChatIds = new Set(data.chats.map((chat) => chat.id));
    data.messages = data.messages.filter((message) => (
      !demoUserIds.has(message.sender_id) && retainedChatIds.has(message.chat_id)
    ));

    const userIds = new Map();
    for (const user of data.users) {
      const saved = await db.get(
        `INSERT INTO users (id, name, email, password, city, age, image, match_score, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name, password = EXCLUDED.password, city = EXCLUDED.city,
           age = EXCLUDED.age, image = EXCLUDED.image, match_score = EXCLUDED.match_score,
           tags = EXCLUDED.tags
         RETURNING id`,
        [user.id, user.name, user.email, user.password, user.city, user.age, user.image, user.match_score, user.tags]
      );
      userIds.set(user.id, saved.id);
    }

    const postIds = new Map();
    for (const post of data.posts) {
      const saved = await db.get(
        `INSERT INTO posts (id, user_id, text, image, video_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id, text = EXCLUDED.text,
           image = EXCLUDED.image, video_id = EXCLUDED.video_id,
           created_at = EXCLUDED.created_at
         RETURNING id`,
        [post.id, userIds.get(post.user_id), post.text, post.image, post.video_id || null, post.created_at]
      );
      postIds.set(post.id, saved.id);
    }

    const chatIds = new Map();
    for (const chat of data.chats) {
      const saved = await db.get(
        `INSERT INTO chats (id, user1_id, user2_id, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           user1_id = EXCLUDED.user1_id, user2_id = EXCLUDED.user2_id,
           updated_at = EXCLUDED.updated_at
         RETURNING id`,
        [chat.id, userIds.get(chat.user1_id), userIds.get(chat.user2_id), chat.updated_at]
      );
      chatIds.set(chat.id, saved.id);
    }

    for (const like of data.likes) {
      await db.get(
        `INSERT INTO likes (id, user_id, post_id)
         VALUES (?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id, post_id = EXCLUDED.post_id
         RETURNING id`,
        [like.id, userIds.get(like.user_id), postIds.get(like.post_id)]
      );
    }

    for (const message of data.messages) {
      await db.get(
        `INSERT INTO messages (id, chat_id, sender_id, text, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           chat_id = EXCLUDED.chat_id, sender_id = EXCLUDED.sender_id,
           text = EXCLUDED.text, created_at = EXCLUDED.created_at
         RETURNING id`,
        [message.id, chatIds.get(message.chat_id), userIds.get(message.sender_id), message.text, message.created_at]
      );
    }

    for (const table of tables) {
      await db.get(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${table}), 1),
          EXISTS (SELECT 1 FROM ${table}))`
      );
    }

    console.log(`Migración completada: ${data.users.length} usuarios, ${data.posts.length} publicaciones, ${data.likes.length} likes, ${data.chats.length} chats y ${data.messages.length} mensajes.`);
  } finally {
    await new Promise((resolve, reject) => sqlite.close((error) => error ? reject(error) : resolve()));
    await db.close();
  }
};

run().catch((error) => {
  console.error('No se pudo migrar la base de datos:', error.message);
  process.exitCode = 1;
});
