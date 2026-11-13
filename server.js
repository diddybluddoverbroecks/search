const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const {
  RegExpMatcher,
  TextCensor,
  englishDataset,
  englishRecommendedTransformers,
} = require('obscenity');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});
const censor = new TextCensor();

function clean(text) {
  if (typeof text !== 'string') return '';
  return censor.applyTo(text, matcher.getAllMatches(text));
}

const users = new Map();

function safeUrl(url) {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
  } catch (_) {}
  return null;
}

io.on('connection', (socket) => {
  socket.on('join', (payload) => {
    const rawName = payload && typeof payload.name === 'string' ? payload.name : '';
    const name = clean(rawName).trim().slice(0, 24) || 'Anonymous';
    users.set(socket.id, name);
    socket.emit('joined', { name });
  });

  socket.on('message', (payload) => {
    if (!payload || typeof payload !== 'object') return;
    const name = users.get(socket.id) || 'Anonymous';

    if (payload.type === 'image') {
      const url = safeUrl(payload.url);
      if (!url) return;
      io.emit('message', { type: 'image', url, name, time: Date.now() });
      return;
    }

    const text = clean(String(payload.text || '')).slice(0, 2000);
    if (!text.trim()) return;
    io.emit('message', { type: 'text', text, name, time: Date.now() });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on ${PORT}`);
});
