import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'bot-store.json');

const initial = {
  users: {},
  challenges: {},
  joins: {},
  stats: {
    createdAt: new Date().toISOString(),
  },
};

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
}

function read() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch {
    return structuredClone(initial);
  }
}

function write(data) {
  ensure();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

export function createChallenge({ telegramId, username }) {
  const data = read();
  const nonce = randomUUID();
  const token = randomUUID();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  data.challenges[token] = {
    token,
    nonce,
    telegramId: String(telegramId),
    username: username || '',
    issuedAt,
    expiresAt,
    used: false,
  };
  write(data);
  return data.challenges[token];
}

export function getChallenge(token) {
  const data = read();
  return data.challenges[token] || null;
}

export function markChallengeUsed(token) {
  const data = read();
  if (data.challenges[token]) data.challenges[token].used = true;
  write(data);
}

export function upsertUser(user) {
  const data = read();
  const id = String(user.telegramId);
  data.users[id] = {
    ...(data.users[id] || {}),
    ...user,
    telegramId: id,
    updatedAt: new Date().toISOString(),
  };
  write(data);
  return data.users[id];
}

export function getUser(telegramId) {
  const data = read();
  return data.users[String(telegramId)] || null;
}

export function listUsers() {
  return Object.values(read().users || {});
}

export function isVerified(telegramId) {
  const user = getUser(telegramId);
  return Boolean(user?.verifiedAt && user?.wallet);
}

export function rememberJoin(telegramId, chatId) {
  const data = read();
  data.joins[String(telegramId)] = {
    telegramId: String(telegramId),
    chatId: String(chatId),
    joinedAt: new Date().toISOString(),
  };
  write(data);
}
