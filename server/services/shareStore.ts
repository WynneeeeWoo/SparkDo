import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SHARES_DIR = path.resolve(__dirname, '../../data/shares');

export interface SharePayload {
  assignments: any[];
  todos: any[];
  assignmentOverrides: Record<string, boolean>;
  posts: any[];
  classes: any[];
  events: any[];
}

export interface Share {
  token: string;
  pin: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  payload: SharePayload;
}

const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function ensureSharesDir() {
  try {
    await fs.mkdir(SHARES_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

function getSharePath(token: string) {
  return path.join(SHARES_DIR, `${token}.json`);
}

export async function createShare(
  userId: string,
  pin: string,
  payload: SharePayload
): Promise<Share> {
  await ensureSharesDir();
  const token = crypto.randomUUID();
  const now = new Date();
  const share: Share = {
    token,
    pin,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SHARE_TTL_MS).toISOString(),
    payload,
  };
  await fs.writeFile(getSharePath(token), JSON.stringify(share, null, 2));
  return share;
}

export async function getShare(token: string): Promise<Share | null> {
  try {
    const raw = await fs.readFile(getSharePath(token), 'utf-8');
    const share = JSON.parse(raw) as Share;
    if (new Date(share.expiresAt).getTime() < Date.now()) {
      await deleteShare(token);
      return null;
    }
    return share;
  } catch {
    return null;
  }
}

export async function validateShare(token: string, pin: string): Promise<Share | null> {
  const share = await getShare(token);
  if (!share || share.pin !== pin) return null;
  return share;
}

export async function updateSharePayload(
  token: string,
  pin: string,
  payload: SharePayload
): Promise<boolean> {
  const share = await getShare(token);
  if (!share || share.pin !== pin) return false;
  share.payload = payload;
  await fs.writeFile(getSharePath(token), JSON.stringify(share, null, 2));
  return true;
}

export async function deleteShare(token: string): Promise<void> {
  try {
    await fs.unlink(getSharePath(token));
  } catch {
    // ignore
  }
}
