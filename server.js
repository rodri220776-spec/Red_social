const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createDatabase } = require('./database');

const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.SQLITE_PATH || path.join(__dirname, 'database.sqlite');
const db = createDatabase(dbPath);
const sessions = new Map();

const ensureDir = () => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, stored) => {
  if (!stored || typeof stored !== 'string') return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashed, 'hex'));
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const user = token ? sessions.get(token) : null;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (!Number(req.user.is_admin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  city: user.city,
  age: user.age,
  image: user.image,
  match_score: user.match_score,
  isAdmin: Boolean(Number(user.is_admin)),
  tags: JSON.parse(user.tags || '[]')
});

const normalizeYouTubeVideoId = (value) => {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  if (typeof value !== 'string' || value.length > 2000) return undefined;

  let url;
  try {
    url = new URL(value.trim());
  } catch (_error) {
    return undefined;
  }

  const host = url.hostname.toLowerCase();
  const allowedHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']);
  if (!allowedHosts.has(host)) return undefined;

  let videoId = null;
  if (host.endsWith('youtu.be')) {
    videoId = url.pathname.split('/').filter(Boolean)[0];
  } else if (url.pathname === '/watch') {
    videoId = url.searchParams.get('v');
  } else {
    videoId = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] || null;
  }

  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : undefined;
};

const configureAdminAccount = async () => {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email && !password) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured in production.');
    }
    return;
  }
  if (!email || !password) {
    throw new Error('Configure both ADMIN_EMAIL and ADMIN_PASSWORD.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }

  await db.run('UPDATE users SET is_admin = 0 WHERE is_admin <> 0 AND email <> ?', [email]);
  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existingAdmin) {
    await db.run('UPDATE users SET is_admin = 1, password = ? WHERE id = ?', [hashPassword(password), existingAdmin.id]);
    return;
  }

  const defaultImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80';
  await db.run(
    'INSERT INTO users (name, email, password, city, age, image, match_score, tags, is_admin) VALUES (?, ?, ?, ?, 25, ?, 0, ?, 1)',
    [process.env.ADMIN_NAME || 'Admin', email, hashPassword(password), 'Madrid', defaultImage, '[]']
  );
};

const ensureExampleVideoPost = async () => {
  const videoId = '7THYN-y_Z7o';
  await db.run('DELETE FROM posts WHERE video_id = ?', ['aqz-KE-bpKQ']);
  const existingPost = await db.get('SELECT id FROM posts WHERE video_id = ?', [videoId]);
  if (existingPost) return;

  const author = await db.get('SELECT id FROM users ORDER BY id LIMIT 1');
  if (!author) throw new Error('No user is available to publish the example video.');

  await db.run(
    'INSERT INTO posts (user_id, text, image, video_id) VALUES (?, ?, NULL, ?)',
    [author.id, "The Best Clipping App You'll Ever Use", videoId]
  );
};

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(express.json({ limit: '16kb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(__dirname, 'styles.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(__dirname, 'script.js')));

app.post('/api/register', (req, res) => {
  const { name, email, password, city = 'Madrid', age = 25 } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanName = String(name || '').trim();
  const cleanCity = String(city || '').trim();
  const cleanAge = Number(age);

  if (!cleanName || cleanName.length > 80 || cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Introduce un nombre y un email válidos.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 200 caracteres.' });
  }
  if (!cleanCity || cleanCity.length > 100 || !Number.isInteger(cleanAge) || cleanAge < 17 || cleanAge > 100) {
    return res.status(400).json({ error: 'Introduce una edad y ciudad válidas.' });
  }

  db.get('SELECT id FROM users WHERE email = ?', [cleanEmail], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error de base de datos' });
    if (row) return res.status(409).json({ error: 'El email ya está registrado' });

    const defaultImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80';
    db.run(
      'INSERT INTO users (name, email, password, city, age, image, match_score, tags) VALUES (?, ?, ?, ?, ?, ?, 92, ?)',
      [cleanName, cleanEmail, hashPassword(password), cleanCity, cleanAge, defaultImage, JSON.stringify(['Amigos', 'Viajes'])],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ error: 'No se pudo crear el usuario' });

        const userId = this.lastID;
        db.get('SELECT * FROM users WHERE id = ?', [userId], (userErr, userRow) => {
          if (userErr || !userRow) return res.status(500).json({ error: 'Error recuperando usuario' });

          const token = crypto.randomBytes(24).toString('hex');
          sessions.set(token, userRow);
          return res.status(201).json({ token, user: safeUser(userRow) });
        });
      }
    );
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()], (err, user) => {
    if (err) return res.status(500).json({ error: 'Error de base de datos' });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    if (!verifyPassword(String(password), user.password)) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user);
    return res.json({ token, user: safeUser(user) });
  });
});

app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  db.all(
    'SELECT id, name, email, city, age, is_admin FROM users ORDER BY id DESC',
    (err, users) => {
      if (err) return res.status(500).json({ error: 'No se pudieron cargar los usuarios' });
      res.json(users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        age: user.age,
        isAdmin: Boolean(Number(user.is_admin))
      })));
    }
  );
});

app.post('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  const { name, email, password, city = 'Madrid', age = 25 } = req.body || {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanCity = String(city || '').trim();
  const cleanAge = Number(age);

  if (!cleanName || cleanName.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
    return res.status(400).json({ error: 'Introduce un nombre y un email válidos.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: 'La contraseña debe tener entre 8 y 200 caracteres.' });
  }
  if (!Number.isInteger(cleanAge) || cleanAge < 17 || cleanAge > 100 || !cleanCity || cleanCity.length > 100) {
    return res.status(400).json({ error: 'Introduce una edad y ciudad válidas.' });
  }

  db.get('SELECT id FROM users WHERE email = ?', [cleanEmail], (lookupErr, existingUser) => {
    if (lookupErr) return res.status(500).json({ error: 'Error de base de datos' });
    if (existingUser) return res.status(409).json({ error: 'El email ya está registrado' });

    const defaultImage = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80';
    db.run(
      'INSERT INTO users (name, email, password, city, age, image, match_score, tags, is_admin) VALUES (?, ?, ?, ?, ?, ?, 92, ?, 0)',
      [cleanName, cleanEmail, hashPassword(password), cleanCity, cleanAge, defaultImage, JSON.stringify(['Amigos', 'Viajes'])],
      function (insertErr) {
        if (insertErr) return res.status(500).json({ error: 'No se pudo crear el usuario' });
        res.status(201).json({
          user: {
            id: this.lastID,
            name: cleanName,
            email: cleanEmail,
            city: cleanCity,
            age: cleanAge,
            isAdmin: false
          }
        });
      }
    );
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});

app.get('/api/profiles', requireAuth, (req, res) => {
  db.all('SELECT * FROM users WHERE is_admin = 0 ORDER BY match_score DESC LIMIT 10', (err, users) => {
    if (err) return res.status(500).json({ error: 'No se pudieron cargar los perfiles' });
    const list = users.map((user) => ({
      id: user.id,
      name: user.name,
      age: user.age,
      city: user.city,
      distance: `${Math.max(1, Math.min(12, Math.abs(user.id - 4) + 2))} km`,
      tags: JSON.parse(user.tags || '[]'),
      match: user.match_score,
      image: user.image
    }));
    res.json(list);
  });
});

app.get('/api/posts', requireAuth, (req, res) => {
  db.all(`
    SELECT p.*, u.name AS user_name, u.image AS user_image
    FROM posts p
    JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: 'No se pudieron cargar las publicaciones' });

    const posts = rows.map((row) => ({
      id: row.id,
      user: row.user_name,
      handle: '@' + (row.user_name.toLowerCase().replace(/[^a-z0-9_]+/g, '') || row.user_id),
      time: 'Reciente',
      text: row.text,
      image: row.image || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
      videoId: row.video_id || null,
      likes: 0,
      liked: false,
      userImage: row.user_image,
      createdAt: row.created_at
    }));

    const postIds = posts.map((post) => post.id);
    if (!postIds.length) return res.json(posts);

    db.all(`SELECT post_id, COUNT(*) AS likes FROM likes WHERE post_id IN (${postIds.map(() => '?').join(',')}) GROUP BY post_id`, postIds, (likeErr, likeRows) => {
      if (likeErr) return res.status(500).json({ error: 'No se pudo calcular likes' });

      const likeMap = Object.fromEntries((likeRows || []).map((row) => [String(row.post_id), Number(row.likes)]));
      db.all(`SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${postIds.map(() => '?').join(',')})`, [req.user.id, ...postIds], (ownLikeErr, ownLikeRows) => {
        if (ownLikeErr) return res.status(500).json({ error: 'No se pudo saber tus likes' });
        const likedSet = new Set((ownLikeRows || []).map((row) => String(row.post_id)));

        const result = posts.map((post) => ({
          ...post,
          likes: Number(likeMap[String(post.id)] || 0),
          liked: likedSet.has(String(post.id))
        }));

        res.json(result);
      });
    });
  });
});

app.post('/api/posts', requireAuth, (req, res) => {
  const { text, videoUrl } = req.body || {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'El texto no puede estar vacío' });
  }

  const videoId = normalizeYouTubeVideoId(videoUrl);
  if (videoId === undefined) {
    return res.status(400).json({ error: 'Introduce un enlace válido de YouTube.' });
  }

  const safeText = String(text).trim();
  db.run(
    'INSERT INTO posts (user_id, text, image, video_id) VALUES (?, ?, ?, ?)',
    [
      req.user.id,
      safeText,
      videoId ? null : 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
      videoId
    ],
    function (err) {
      if (err) return res.status(500).json({ error: 'No se pudo guardar la publicación' });
      res.status(201).json({ id: this.lastID, text: safeText, videoId });
    }
  );
});

app.post('/api/posts/:id/like', requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  if (!postId) return res.status(400).json({ error: 'ID inválido' });

  db.get('SELECT id FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId], (err, row) => {
    if (err) return res.status(500).json({ error: 'No se pudo procesar el like' });

    if (row) {
      db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId], (deleteErr) => {
        if (deleteErr) return res.status(500).json({ error: 'No se pudo quitar el like' });
        db.get('SELECT COUNT(*) AS likes FROM likes WHERE post_id = ?', [postId], (countErr, countRow) => {
          res.json({ liked: false, likes: Number(countRow?.likes || 0) });
        });
      });
      return;
    }

    db.run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, postId], (insertErr) => {
      if (insertErr) return res.status(500).json({ error: 'No se pudo guardar el like' });
      db.get('SELECT COUNT(*) AS likes FROM likes WHERE post_id = ?', [postId], (countErr, countRow) => {
        res.json({ liked: true, likes: Number(countRow?.likes || 0) });
      });
    });
  });
});

app.get('/api/matches', requireAuth, (req, res) => {
  db.all('SELECT * FROM users WHERE is_admin = 0 ORDER BY match_score DESC LIMIT 5', (err, users) => {
    if (err) return res.status(500).json({ error: 'No se pudieron cargar los matches' });
    res.json(users.map((user) => ({
      id: user.id,
      name: user.name,
      city: user.city,
      percent: user.match_score
    })));
  });
});

app.get('/api/chats', requireAuth, (req, res) => {
  db.all('SELECT * FROM users WHERE id != ? AND is_admin = 0 ORDER BY id ASC LIMIT 5', [req.user.id], (err, users) => {
    if (err) return res.status(500).json({ error: 'No se pudieron cargar los chats' });

    const chats = users.slice(0, 3).map((user, index) => ({
      id: user.id,
      name: user.name,
      excerpt: index === 0 ? 'Te vi en el perfil de conciertos...' : index === 1 ? 'Vamos a probar ese sitio nuevo?' : '¡Gracias por el like! 😊',
      active: index < 2,
      unread: index === 0 ? 2 : index === 2 ? 1 : 0
    }));

    res.json(chats);
  });
});

app.post('/api/chats/:id/messages', requireAuth, (req, res) => {
  const recipientId = Number(req.params.id);
  const text = String(req.body?.text || '').trim();

  if (!recipientId || !text) {
    return res.status(400).json({ error: 'Datos de mensaje inválidos' });
  }

  db.get('SELECT * FROM users WHERE id = ?', [recipientId], (err, recipient) => {
    if (err || !recipient) return res.status(404).json({ error: 'Usuario no encontrado' });

    db.run('INSERT INTO chats (user1_id, user2_id) VALUES (?, ?) ON CONFLICT(user1_id, user2_id) DO NOTHING', [Math.min(req.user.id, recipientId), Math.max(req.user.id, recipientId)], () => {
      db.get('SELECT id FROM chats WHERE user1_id = ? AND user2_id = ?', [Math.min(req.user.id, recipientId), Math.max(req.user.id, recipientId)], (chatErr, chatRow) => {
        if (chatErr || !chatRow) return res.status(500).json({ error: 'No se pudo crear la conversación' });

        db.run('INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)', [chatRow.id, req.user.id, text], function (msgErr) {
          if (msgErr) return res.status(500).json({ error: 'No se pudo guardar el mensaje' });
          res.status(201).json({ ok: true, messageId: this.lastID, recipient: recipient.name });
        });
      });
    });
  });
});

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const startServer = async () => {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be configured in production.');
  }
  if (!process.env.DATABASE_URL) ensureDir();
  await db.initialize({ seed: process.env.NODE_ENV !== 'production' });
  await configureAdminAccount();
  await ensureExampleVideoPost();
  app.listen(port, () => {
    console.log(`ViveLink backend running on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Could not initialize the database:', error);
  process.exitCode = 1;
});
