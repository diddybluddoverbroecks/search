(() => {
  const googleView   = document.getElementById('google-view');
  const chatView     = document.getElementById('chat-view');
  const searchForm   = document.getElementById('search-form');
  const searchInput  = document.getElementById('search-input');

  const nameModal    = document.getElementById('name-modal');
  const nameInput    = document.getElementById('name-input');
  const nameSubmit   = document.getElementById('name-submit');

  const chatApp      = document.getElementById('chat-app');
  const messagesEl   = document.getElementById('messages');
  const composer     = document.getElementById('composer');
  const messageInput = document.getElementById('message-input');
  const imageBtn     = document.getElementById('image-btn');
  const chatSub      = document.getElementById('chat-sub');

  let socket = null;
  let myName = null;
  let inChat = false;

  const TRIGGER = 'messagetime';

  searchForm.addEventListener('submit', (e) => {
    const q = searchInput.value.trim();
    if (q.toLowerCase() === TRIGGER) {
      e.preventDefault();
      searchInput.value = '';
      enterChat();
    } else {
      searchForm.action = 'https://www.google.com/search';
    }
  });

  function enterChat() {
    inChat = true;
    googleView.classList.add('hidden');
    chatView.classList.remove('hidden');
    chatView.setAttribute('aria-hidden', 'false');

    nameModal.classList.remove('hidden');
    chatApp.classList.add('hidden');
    setTimeout(() => nameInput.focus(), 50);
  }

  function exitChat() {
    inChat = false;
    googleView.classList.remove('hidden');
    chatView.classList.add('hidden');
    chatView.setAttribute('aria-hidden', 'true');

    messagesEl.innerHTML = '';
    myName = null;
    nameInput.value = '';
    messageInput.value = '';

    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && inChat) {
      exitChat();
    }
  });

  window.addEventListener('pagehide', () => {
    if (inChat) exitChat();
  });

  nameSubmit.addEventListener('click', submitName);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitName(); }
  });

  function submitName() {
    const raw = nameInput.value.trim();
    myName = raw || 'Anonymous';
    nameModal.classList.add('hidden');
    chatApp.classList.remove('hidden');
    messageInput.focus();
    connect();
  }

  function connect() {
    socket = io();

    socket.on('connect', () => {
      socket.emit('join', { name: myName });
      chatSub.textContent = 'connected';
    });

    socket.on('disconnect', () => {
      chatSub.textContent = 'disconnected';
    });

    socket.on('joined', ({ name }) => {
      myName = name;
    });

    socket.on('message', (msg) => {
      renderMessage(msg);
    });
  }

  composer.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !socket) return;
    socket.emit('message', { type: 'text', text });
    messageInput.value = '';
  });

  imageBtn.addEventListener('click', () => {
    const url = prompt('Paste an image or GIF URL (https://...)');
    if (!url) return;
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
      if (!socket) return;
      socket.emit('message', { type: 'image', url: u.toString() });
    } catch (_) {}
  });

  function renderMessage(msg) {
    const mine = msg.name === myName;

    const row = document.createElement('div');
    row.className = 'msg-row ' + (mine ? 'out' : 'in');

    const nameEl = document.createElement('div');
    nameEl.className = 'msg-name';
    nameEl.textContent = mine ? 'You' : msg.name;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (msg.type === 'image' && msg.url) {
      const img = document.createElement('img');
      img.className = 'msg-image';
      img.src = msg.url;
      img.alt = 'shared image';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.onerror = () => {
        bubble.textContent = '[image failed to load]';
      };
      bubble.appendChild(img);
    } else {
      appendLinkedText(bubble, msg.text || '');
    }

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = formatTime(msg.time);

    row.appendChild(nameEl);
    row.appendChild(bubble);
    row.appendChild(time);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  const URL_RE = /https?:\/\/[^\s<>"']+/gi;

  function appendLinkedText(parent, text) {
    let last = 0;
    let match;
    URL_RE.lastIndex = 0;
    while ((match = URL_RE.exec(text)) !== null) {
      if (match.index > last) {
        parent.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      const raw = match[0];
      let safe = null;
      try {
        const u = new URL(raw);
        if (u.protocol === 'http:' || u.protocol === 'https:') safe = u.toString();
      } catch (_) {}

      if (safe) {
        const a = document.createElement('a');
        a.href = safe;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = raw;
        parent.appendChild(a);
      } else {
        parent.appendChild(document.createTextNode(raw));
      }
      last = match.index + raw.length;
    }
    if (last < text.length) {
      parent.appendChild(document.createTextNode(text.slice(last)));
    }
  }

  function formatTime(ts) {
    const d = new Date(ts || Date.now());
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
})();
