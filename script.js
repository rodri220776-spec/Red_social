const networkStats = [
  { label: 'MAU', value: '2.281.553' },
  { label: 'DAU', value: '912.621' },
  { label: 'peakStats', value: '79.854' },
  { label: 'apiRate', value: '23.956' },
  { label: 'bandwidth', value: '7,65 Gbit/s' },
  { label: 'servers', value: '17' }
];

const state = {
  token: localStorage.getItem('vivelink-token') || '',
  language: localStorage.getItem('vivelink-language') || 'es',
  readingMode: localStorage.getItem('vivelink-reading-mode') === 'true',
  user: null,
  profiles: [],
  posts: [],
  matches: [],
  chats: [],
  adminUsers: [],
  searchQuery: '',
  isRegisterMode: false
};

const translations = {
  es: {
    languageLabel: 'Idioma', readingModeOn: 'Activar lectura', readingModeOff: 'Desactivar lectura',
    readingUnavailable: 'Lectura no disponible', loginTitle: 'Inicia sesión', loginSubtitle: 'Accede a tu perfil de ViveLink',
    name: 'Nombre', yourName: 'Tu nombre', email: 'Email', emailPlaceholder: 'tu@email.com',
    password: 'Contraseña', passwordPlaceholder: '••••••••', login: 'Entrar', createAccount: 'Crear cuenta',
    registerTitle: 'Crea tu cuenta', registerSubtitle: 'Únete a la comunidad de ViveLink', alreadyAccount: 'Ya tengo cuenta',
    social: 'Social', home: 'Inicio', discover: 'Descubrir', matches: 'Matches', messages: 'Mensajes',
    metrics: 'Métricas', networkSize: 'Dimensionado', spain: 'España', searchUsers: 'Buscar usuarios',
    searchPlaceholder: 'Buscar por nombre, ciudad o interés', publishTop: '+ Publicar', profile: 'Perfil',
    eyebrow: 'Conecta con personas reales', heroTitle: 'Encuentra coincidencias cerca de ti',
    heroText: 'Una red social nacional pensada para usuarios de 17 a 30 años con perfiles, likes, emparejamientos y chat en tiempo real.',
    discoverProfiles: 'Descubrir perfiles', viewCommunity: 'Ver comunidad', peak: 'Pico',
    composerTitle: '¿Qué te gustaría compartir hoy?', postPlaceholder: 'Cuenta algo sobre tu día, un plan, o un descubrimiento...',
    photo: '📷 Foto', location: '📍 Ubicación', status: '😊 Estado', publish: 'Publicar',
    nearbyProfiles: 'Perfiles cercanos', seeAll: 'Ver todo', refresh: 'Actualizar', new: 'Nuevo',
    noProfiles: 'No hay perfiles que coincidan con tu búsqueda.', message: 'Mensaje',
    comment: '💬 Comentar', share: '🔁 Compartir', peakStats: 'Picos', apiRate: 'API/s',
    bandwidth: 'Ancho de banda', servers: 'Servidores', siteTitle: 'ViveLink | Red social nacional',
    adminNav: 'Administración', adminTitle: 'Administración de usuarios',
    adminDescription: 'Solo el administrador puede consultar y crear cuentas.',
    logout: 'Cerrar sesión', city: 'Ciudad', age: 'Edad', createUser: 'Crear usuario',
    userId: 'ID', role: 'Rol', administrator: 'Administrador', standardUser: 'Usuario',
    userCreated: 'Usuario creado correctamente.', adminLoadError: 'No se pudieron cargar los usuarios.',
    noUsers: 'Todavía no hay usuarios.', youtubeUrlLabel: 'Vídeo de YouTube (opcional)',
    youtubeUrlPlaceholder: 'Pega aquí el enlace del vídeo', youtubeVideo: 'Vídeo de YouTube',
    watchOnYouTube: 'Ver en YouTube'
  },
  en: {
    languageLabel: 'Language', readingModeOn: 'Enable reading', readingModeOff: 'Disable reading',
    readingUnavailable: 'Reading unavailable', loginTitle: 'Log in', loginSubtitle: 'Access your ViveLink profile',
    name: 'Name', yourName: 'Your name', email: 'Email', emailPlaceholder: 'you@email.com',
    password: 'Password', passwordPlaceholder: '••••••••', login: 'Log in', createAccount: 'Create account',
    registerTitle: 'Create your account', registerSubtitle: 'Join the ViveLink community', alreadyAccount: 'I already have an account',
    social: 'Social', home: 'Home', discover: 'Discover', matches: 'Matches', messages: 'Messages',
    metrics: 'Metrics', networkSize: 'Network size', spain: 'Spain', searchUsers: 'Search users',
    searchPlaceholder: 'Search by name, city, or interest', publishTop: '+ Post', profile: 'Profile',
    eyebrow: 'Connect with real people', heroTitle: 'Find matches near you',
    heroText: 'A national social network for people aged 17 to 30, with profiles, likes, matches, and real-time chat.',
    discoverProfiles: 'Discover profiles', viewCommunity: 'View community', peak: 'Peak',
    composerTitle: 'What would you like to share today?', postPlaceholder: 'Share something about your day, a plan, or a discovery...',
    photo: '📷 Photo', location: '📍 Location', status: '😊 Status', publish: 'Post',
    nearbyProfiles: 'People nearby', seeAll: 'See all', refresh: 'Refresh', new: 'New',
    noProfiles: 'No profiles match your search.', message: 'Message',
    comment: '💬 Comment', share: '🔁 Share', peakStats: 'Peaks', apiRate: 'API/s',
    bandwidth: 'Bandwidth', servers: 'Servers', siteTitle: 'ViveLink | National social network',
    adminNav: 'Admin', adminTitle: 'User administration',
    adminDescription: 'Only the administrator can view and create accounts.',
    logout: 'Log out', city: 'City', age: 'Age', createUser: 'Create user',
    userId: 'ID', role: 'Role', administrator: 'Administrator', standardUser: 'User',
    userCreated: 'User created successfully.', adminLoadError: 'Could not load users.',
    noUsers: 'There are no users yet.', youtubeUrlLabel: 'YouTube video (optional)',
    youtubeUrlPlaceholder: 'Paste the video link here', youtubeVideo: 'YouTube video',
    watchOnYouTube: 'Watch on YouTube'
  },
  zh: {
    languageLabel: '语言', readingModeOn: '开启朗读', readingModeOff: '关闭朗读',
    readingUnavailable: '朗读不可用', loginTitle: '登录', loginSubtitle: '访问你的 ViveLink 个人资料',
    name: '姓名', yourName: '你的姓名', email: '电子邮箱', emailPlaceholder: 'you@email.com',
    password: '密码', passwordPlaceholder: '••••••••', login: '登录', createAccount: '创建账户',
    registerTitle: '创建账户', registerSubtitle: '加入 ViveLink 社区', alreadyAccount: '我已有账户',
    social: '社交', home: '首页', discover: '发现', matches: '配对', messages: '消息',
    metrics: '数据', networkSize: '网络规模', spain: '西班牙', searchUsers: '搜索用户',
    searchPlaceholder: '按姓名、城市或兴趣搜索', publishTop: '+ 发布', profile: '个人资料',
    eyebrow: '与真实的人建立联系', heroTitle: '发现你附近的匹配对象',
    heroText: '面向17至30岁用户的全国性社交网络，提供个人资料、点赞、配对和实时聊天。',
    discoverProfiles: '发现个人资料', viewCommunity: '查看社区', peak: '峰值',
    composerTitle: '今天想分享什么？', postPlaceholder: '分享你今天的生活、计划或新发现……',
    photo: '📷 照片', location: '📍 位置', status: '😊 状态', publish: '发布',
    nearbyProfiles: '附近的人', seeAll: '查看全部', refresh: '刷新', new: '新建',
    noProfiles: '没有符合搜索条件的个人资料。', message: '消息',
    comment: '💬 评论', share: '🔁 分享', peakStats: '峰值', apiRate: 'API/秒',
    bandwidth: '带宽', servers: '服务器', siteTitle: 'ViveLink | 全国社交网络',
    adminNav: '管理', adminTitle: '用户管理',
    adminDescription: '只有管理员可以查看和创建账户。',
    logout: '退出登录', city: '城市', age: '年龄', createUser: '创建用户',
    userId: '编号', role: '角色', administrator: '管理员', standardUser: '用户',
    userCreated: '用户创建成功。', adminLoadError: '无法加载用户。',
    noUsers: '目前还没有用户。', youtubeUrlLabel: 'YouTube 视频（可选）',
    youtubeUrlPlaceholder: '在此粘贴视频链接', youtubeVideo: 'YouTube 视频',
    watchOnYouTube: '在 YouTube 上观看'
  }
};

const translate = (key) => translations[state.language]?.[key] || translations.es[key] || key;

const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

const applyLanguage = () => {
  document.documentElement.lang = state.language === 'zh' ? 'zh-CN' : state.language;
  document.title = translate('siteTitle');
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = translate(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel));
  });
  document.getElementById('languageSelect').value = state.language;
  updateReadingModeControl();
  setAuthMode(state.isRegisterMode);
  renderApp();
  if (state.user?.isAdmin) renderAdminUsers(state.adminUsers);
};

const updateReadingModeControl = () => {
  const button = document.getElementById('readingModeToggle');
  const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  button.disabled = !speechAvailable;
  button.setAttribute('aria-pressed', String(state.readingMode));
  button.textContent = speechAvailable
    ? translate(state.readingMode ? 'readingModeOff' : 'readingModeOn')
    : translate('readingUnavailable');
};

const readClickedElement = (event) => {
  if (!state.readingMode || event.detail === 0 || !(event.target instanceof Element)) return;

  const clicked = event.target.closest(
    'button, a, input, select, textarea, [role="button"], [role="link"], label, .chat-item, .profile-card, .post-card'
  ) || event.target;
  if (clicked === document.body || clicked === document.documentElement) return;

  let text = clicked.getAttribute('aria-label') || clicked.getAttribute('title') || '';
  if (clicked.id === 'languageSelect') {
    text = clicked.selectedOptions[0]?.textContent || '';
  } else if (!text && (clicked instanceof HTMLInputElement || clicked instanceof HTMLTextAreaElement)) {
    const label = clicked.labels?.[0]?.textContent || '';
    text = clicked.type === 'password' ? label : [label, clicked.value || clicked.placeholder].filter(Boolean).join('. ');
  } else if (!text) {
    text = clicked.innerText || clicked.textContent || '';
  }

  text = text.trim();
  if (!text) return;

  window.setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = { es: 'es-ES', en: 'en-US', zh: 'zh-CN' }[state.language] || 'es-ES';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, 0);
};

const buildToast = (message) => {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2200);
};

const scrollToTarget = (targetId) => {
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const setActiveNav = (targetId) => {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.navTarget === targetId);
  });
  document.getElementById('admin-panel').classList.toggle('hidden', targetId !== 'admin-panel');
};

const setAdminAccess = (isAdmin) => {
  const adminNav = document.querySelector('[data-nav-target="admin-panel"]');
  if (adminNav) adminNav.classList.toggle('hidden', !isAdmin);
  if (!isAdmin) document.getElementById('admin-panel').classList.add('hidden');
};

const renderNetworkStats = () => {
  const list = document.getElementById('networkStats');
  if (!list) return;
  list.innerHTML = networkStats
    .map((stat) => `<li><span>${translate(stat.label)}</span><strong>${stat.value}</strong></li>`)
    .join('');
};

const renderProfiles = (query = state.searchQuery) => {
  const profilesContainer = document.getElementById('profilesList');
  if (!profilesContainer) return;

  state.searchQuery = query || '';
  const normalized = state.searchQuery.trim().toLowerCase();

  const filteredProfiles = state.profiles.filter((profile) => {
    if (!normalized) return true;
    return [profile.name, profile.city, profile.tags.join(' ')].join(' ').toLowerCase().includes(normalized);
  });

  if (!filteredProfiles.length) {
    profilesContainer.innerHTML = `<p class="empty-state">${translate('noProfiles')}</p>`;
    return;
  }

  profilesContainer.innerHTML = filteredProfiles.map((profile) => `
    <div class="profile-card">
      <div class="user-row">
        <div class="avatar" style="background-image: url('${escapeHTML(profile.image)}'); background-size: cover; background-position: center;"></div>
        <div class="info">
          <strong>${escapeHTML(profile.name)}, ${escapeHTML(profile.age)}</strong>
          <small>${escapeHTML(profile.city)} · ${escapeHTML(profile.distance)}</small>
        </div>
      </div>
      <div class="badge">${profile.match}%</div>
      <button class="like-btn" data-profile-id="${profile.id}" type="button">💜</button>
      <button class="message-btn" data-profile-id="${profile.id}" data-profile-name="${escapeHTML(profile.name)}" type="button">${translate('message')}</button>
    </div>
  `).join('');
};

const renderPosts = () => {
  const feed = document.getElementById('feed');
  if (!feed) return;

  feed.innerHTML = state.posts.map((post) => `
    <article class="panel post-card">
      <div class="post-header">
        <div class="user-meta">
          <div class="avatar large" style="background-image: url('${escapeHTML(post.userImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80')}'); background-size: cover; background-position: center;"></div>
          <div class="identity">
            <strong>${escapeHTML(post.user)}</strong>
            <small>${escapeHTML(post.handle)}</small>
          </div>
        </div>
        <span class="post-time">${escapeHTML(post.time)}</span>
      </div>

      <p class="post-body">${escapeHTML(post.text)}</p>

      ${/^[A-Za-z0-9_-]{11}$/.test(post.videoId || '')
    ? `<div class="post-video-wrapper"><div class="post-video"><iframe src="https://www.youtube-nocookie.com/embed/${post.videoId}?origin=${encodeURIComponent(window.location.origin)}&rel=0" title="${escapeHTML(translate('youtubeVideo'))}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="origin" allowfullscreen></iframe></div><a class="post-video-link" href="https://www.youtube.com/watch?v=${post.videoId}" target="_blank" rel="noopener noreferrer">${translate('watchOnYouTube')}</a></div>`
    : `<div class="post-image" style="background-image: url('${escapeHTML(post.image)}');"></div>`}

      <div class="post-actions">
        <button class="action-btn like ${post.liked ? 'liked' : ''}" data-post-id="${post.id}" type="button">💜 ${post.likes}</button>
        <button class="action-btn" data-post-id="${post.id}" type="button">${translate('comment')}</button>
        <button class="action-btn" data-post-id="${post.id}" type="button">${translate('share')}</button>
      </div>
    </article>
  `).join('');
};

const renderMatches = () => {
  const matchesList = document.getElementById('matchesList');
  if (!matchesList) return;
  matchesList.innerHTML = state.matches.map((match) => `
    <div class="match-card">
      <div class="avatar" style="background: linear-gradient(135deg, #d2f4e8, #d4d7ff);"></div>
      <div class="info">
        <strong>${escapeHTML(match.name)}</strong>
        <small>${escapeHTML(match.city)}</small>
      </div>
      <span class="badge">${match.percent}%</span>
    </div>
  `).join('');
};

const renderChats = () => {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;
  chatList.innerHTML = state.chats.map((chat) => `
    <div class="chat-item ${chat.unread ? 'unread' : ''}" data-chat-name="${escapeHTML(chat.name)}">
      <div class="user-row">
        <div class="avatar" style="background: linear-gradient(135deg, #d4f7ef, #c8d4ff);"></div>
        <div class="info">
          <strong>${escapeHTML(chat.name)}</strong>
          <small>${escapeHTML(chat.excerpt)}</small>
        </div>
      </div>
      ${chat.unread ? `<span class="badge">${chat.unread}</span>` : ''}
    </div>
  `).join('');
};

const renderAdminUsers = (users) => {
  const tableBody = document.getElementById('adminUsersBody');
  if (!tableBody) return;
  tableBody.replaceChildren();

  if (!users.length) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = translate('noUsers');
    return;
  }

  users.forEach((user) => {
    const row = tableBody.insertRow();
    [user.id, user.name, user.email, user.city, user.age, translate(user.isAdmin ? 'administrator' : 'standardUser')]
      .forEach((value) => {
        row.insertCell().textContent = String(value ?? '');
      });
  });
};

const loadAdminUsers = async () => {
  const message = document.getElementById('adminMessage');
  try {
    const users = await apiFetch('/api/admin/users');
    state.adminUsers = users;
    renderAdminUsers(users);
  } catch (error) {
    if (message) message.textContent = error.message || translate('adminLoadError');
  }
};

const renderApp = () => {
  renderNetworkStats();
  renderProfiles();
  renderPosts();
  renderMatches();
  renderChats();
};

const apiFetch = async (path, options = {}) => {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'same-origin'
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload?.error || 'Error de la petición');
  }

  return payload;
};

const showAuthScreen = (visible) => {
  const authScreen = document.getElementById('authScreen');
  const appShell = document.getElementById('appShell');
  if (!authScreen || !appShell) return;
  authScreen.classList.toggle('hidden', !visible);
  appShell.classList.toggle('hidden', visible);
};

const setAuthMode = (isRegister) => {
  state.isRegisterMode = isRegister;
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const submitButton = document.getElementById('authSubmit');
  const switchButton = document.getElementById('authSwitch');
  const nameWrap = document.getElementById('authNameWrap');
  const nameInput = document.getElementById('authName');

  if (title) title.textContent = translate(isRegister ? 'registerTitle' : 'loginTitle');
  if (subtitle) subtitle.textContent = translate(isRegister ? 'registerSubtitle' : 'loginSubtitle');
  if (submitButton) submitButton.textContent = translate(isRegister ? 'createAccount' : 'login');
  if (switchButton) switchButton.textContent = translate(isRegister ? 'alreadyAccount' : 'createAccount');
  if (nameWrap) nameWrap.classList.toggle('hidden', !isRegister);
  if (nameInput) nameInput.required = isRegister;
  document.getElementById('authMessage').textContent = '';
};

const handleAuthSubmit = async (event) => {
  event.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim();
  const messageEl = document.getElementById('authMessage');
  const submitButton = document.getElementById('authSubmit');
  const switchButton = document.getElementById('authSwitch');

  submitButton.disabled = true;
  switchButton.disabled = true;
  try {
    const endpoint = state.isRegisterMode ? '/api/register' : '/api/login';
    const payload = {
      email,
      password,
      ...(state.isRegisterMode ? { name } : {})
    };

    if (state.isRegisterMode && !name) {
      throw new Error('Introduce tu nombre para crear la cuenta.');
    }

    const result = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    state.token = result.token;
    state.user = result.user;
    localStorage.setItem('vivelink-token', result.token);
    if (messageEl) messageEl.textContent = '';
    await loadAppData();
    showAuthScreen(false);
    buildToast('Sesión iniciada correctamente.');
  } catch (error) {
    if (messageEl) {
      messageEl.textContent = error instanceof TypeError
        ? 'No se pudo conectar con ViveLink. Inicia el servidor con «npm start» y abre http://localhost:3000.'
        : error.message;
    }
  } finally {
    submitButton.disabled = false;
    switchButton.disabled = false;
  }
};

const logout = () => {
  state.token = '';
  state.user = null;
  localStorage.removeItem('vivelink-token');
  setAdminAccess(false);
  setActiveNav('feed');
  showAuthScreen(true);
  setAuthMode(false);
  document.getElementById('authForm').reset();
};

const loadAppData = async () => {
  const [profiles, posts, matches, chats] = await Promise.all([
    apiFetch('/api/profiles'),
    apiFetch('/api/posts'),
    apiFetch('/api/matches'),
    apiFetch('/api/chats')
  ]);

  state.profiles = profiles;
  state.posts = posts;
  state.matches = matches;
  state.chats = chats;

  renderApp();
  setAdminAccess(Boolean(state.user?.isAdmin));
  if (state.user?.isAdmin) await loadAdminUsers();
  const userName = state.user?.name || 'Tú';
  const avatarMini = document.querySelector('.avatar-mini');
  if (avatarMini && state.user?.image) {
    avatarMini.style.backgroundImage = `url('${state.user.image}')`;
    avatarMini.style.backgroundSize = 'cover';
    avatarMini.style.backgroundPosition = 'center';
    avatarMini.setAttribute('title', userName);
  }
};

const boot = async () => {
  setAuthMode(false);
  if (!state.token) {
    showAuthScreen(true);
    return;
  }

  try {
    const me = await apiFetch('/api/me');
    state.user = me.user;
    await loadAppData();
    showAuthScreen(false);
  } catch (_error) {
    logout();
  }
};

const publishPost = async () => {
  const input = document.getElementById('postInput');
  const videoInput = document.getElementById('videoUrlInput');
  const value = input.value.trim();

  if (!value) {
    input.focus();
    buildToast('Escribe algo para publicar.');
    return;
  }

  try {
    await apiFetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify({ text: value, videoUrl: videoInput.value.trim() })
    });
    input.value = '';
    videoInput.value = '';
    await loadAppData();
    setActiveNav('feed');
    scrollToTarget('feed');
    buildToast('Publicación creada con éxito.');
  } catch (error) {
    buildToast(error.message);
  }
};

const handleNavClick = (event) => {
  const button = event.target.closest('.nav-item');
  if (!button) return;

  const target = button.dataset.navTarget;
  setActiveNav(target);

  if (target === 'feed') scrollToTarget('feed');
  if (target === 'profiles') scrollToTarget('profiles');
  if (target === 'matches') scrollToTarget('matches');
  if (target === 'chatList') scrollToTarget('chatListPanel');
  if (target === 'stats-panel') scrollToTarget('stats-panel');
  if (target === 'admin-panel') scrollToTarget('admin-panel');
};

const handleGlobalClicks = async (event) => {
  const likeButton = event.target.closest('.like-btn');
  if (likeButton) {
    const id = Number(likeButton.dataset.profileId);
    const profile = state.profiles.find((item) => item.id === id);
    if (!profile) return;

    profile.match = Math.min(99, profile.match + 1);
    renderProfiles();
    buildToast(`Has dado like a ${profile.name}.`);
    return;
  }

  const messageButton = event.target.closest('.message-btn');
  if (messageButton) {
    const id = Number(messageButton.dataset.profileId);
    const profile = state.profiles.find((item) => item.id === id);
    if (!profile) return;

    const existingChat = state.chats.find((chat) => chat.name === profile.name);
    if (!existingChat) {
      state.chats.unshift({ name: profile.name, excerpt: '¡Hola! ¿Te apetece conocernos mejor?', active: true, unread: 0 });
    }

    renderChats();
    setActiveNav('chatList');
    scrollToTarget('chatListPanel');
    buildToast(`Iniciaste un chat con ${profile.name}.`);
    return;
  }

  const postAction = event.target.closest('.action-btn');
  if (postAction) {
    const actionText = postAction.textContent.trim();

    if (postAction.classList.contains('like')) {
      const postId = Number(postAction.dataset.postId);
      try {
        const result = await apiFetch(`/api/posts/${postId}/like`, { method: 'POST' });
        const updatedPost = state.posts.find((post) => Number(post.id) === postId);
        if (updatedPost) {
          updatedPost.liked = result.liked;
          updatedPost.likes = result.likes;
        }
        renderPosts();
        buildToast(result.liked ? 'Has dado like a la publicación.' : 'Has quitado tu like.');
      } catch (error) {
        buildToast(error.message);
      }
      return;
    }

    if (actionText.startsWith('💬')) {
      const input = document.getElementById('postInput');
      input.focus();
      input.value = '¡Me gustaría comentar esta publicación!';
      buildToast('Se ha preparado tu comentario.');
      return;
    }

    if (actionText.startsWith('🔁')) {
      buildToast('Publicación compartida.');
    }
  }

  const chatItem = event.target.closest('.chat-item');
  if (chatItem) {
    const name = chatItem.dataset.chatName;
    state.chats.forEach((chat) => {
      if (chat.name === name) chat.unread = 0;
    });
    renderChats();
    buildToast(`Abriendo conversación con ${name}.`);
  }
};

document.getElementById('authSwitch').addEventListener('click', () => setAuthMode(!state.isRegisterMode));
document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('languageSelect').addEventListener('change', (event) => {
  state.language = event.target.value;
  localStorage.setItem('vivelink-language', state.language);
  applyLanguage();
});
document.getElementById('readingModeToggle').addEventListener('click', () => {
  state.readingMode = !state.readingMode;
  localStorage.setItem('vivelink-reading-mode', String(state.readingMode));
  updateReadingModeControl();
});
document.getElementById('adminUserForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submitButton = document.getElementById('adminCreateUserBtn');
  const message = document.getElementById('adminMessage');
  submitButton.disabled = true;
  message.textContent = '';

  try {
    await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('adminUserName').value,
        email: document.getElementById('adminUserEmail').value,
        password: document.getElementById('adminUserPassword').value,
        city: document.getElementById('adminUserCity').value,
        age: document.getElementById('adminUserAge').value
      })
    });
    form.reset();
    message.textContent = translate('userCreated');
    await loadAdminUsers();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById('publishBtn').addEventListener('click', publishPost);
document.getElementById('topPublishBtn').addEventListener('click', () => {
  document.getElementById('postInput').focus();
  setActiveNav('feed');
  scrollToTarget('feed');
});

document.getElementById('searchInput').addEventListener('input', (event) => renderProfiles(event.target.value));
document.getElementById('showAllProfiles').addEventListener('click', () => {
  document.getElementById('searchInput').value = '';
  renderProfiles('');
  setActiveNav('profiles');
  scrollToTarget('profiles');
  buildToast('Mostrando todos los perfiles.');
});

document.getElementById('refreshMatchesBtn').addEventListener('click', async () => {
  try {
    const refreshed = await apiFetch('/api/matches');
    state.matches = refreshed;
    renderMatches();
    buildToast('Matches actualizados.');
  } catch (error) {
    buildToast(error.message);
  }
});

document.getElementById('newMessageBtn').addEventListener('click', () => {
  state.chats.unshift({ name: 'Nuevo contacto', excerpt: 'Escribe un mensaje para comenzar...', active: true, unread: 0 });
  renderChats();
  setActiveNav('chatList');
  scrollToTarget('chatListPanel');
  buildToast('Nuevo mensaje preparado.');
});

document.getElementById('discoverProfilesBtn').addEventListener('click', () => {
  setActiveNav('profiles');
  scrollToTarget('profiles');
  buildToast('Descubriendo perfiles cercanos.');
});

document.getElementById('communityBtn').addEventListener('click', () => {
  setActiveNav('feed');
  scrollToTarget('feed');
  buildToast('Bienvenido a la comunidad.');
});

document.querySelectorAll('.nav-item').forEach((button) => button.addEventListener('click', handleNavClick));
document.addEventListener('click', handleGlobalClicks);
document.addEventListener('click', readClickedElement);
document.getElementById('postInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    publishPost();
  }
});

applyLanguage();
boot();
