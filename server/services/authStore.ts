import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.resolve(directory, '../../data/sparkdo.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)`);

type StoredUser = { id: string; email: string; displayName: string; passwordHash: string };
const normalizeEmail = (email: string) => email.trim().toLowerCase();
const toPublicUser = ({ id, email, displayName }: StoredUser) => ({ id, email, displayName });
function hashPassword(password: string) { const salt = randomBytes(16).toString('hex'); return salt + ':' + scryptSync(password, salt, 64).toString('hex'); }
function verifyPassword(password: string, stored: string) { const [salt, hash] = stored.split(':'); const actual = scryptSync(password, salt, 64); return timingSafeEqual(actual, Buffer.from(hash, 'hex')); }
export function registerUser(displayName: string, email: string, password: string) { const normalized = normalizeEmail(email); if (db.prepare('SELECT id FROM users WHERE email = ?').get(normalized)) throw new Error('An account with this email already exists.'); const user: StoredUser = { id: crypto.randomUUID(), email: normalized, displayName: displayName.trim(), passwordHash: hashPassword(password) }; db.prepare('INSERT INTO users (id, email, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(user.id, user.email, user.displayName, user.passwordHash, new Date().toISOString()); return toPublicUser(user); }
export function authenticateUser(email: string, password: string) { const row = db.prepare('SELECT id, email, display_name as displayName, password_hash as passwordHash FROM users WHERE email = ?').get(normalizeEmail(email)) as StoredUser | undefined; if (!row || !verifyPassword(password, row.passwordHash)) return null; return toPublicUser(row); }
