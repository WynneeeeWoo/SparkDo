import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
  createShare,
  fetchShare,
  updateShare,
  deleteShare,
  type SharePayload,
  type CreateShareResult,
} from '../services/shareApi';

interface ActiveShare {
  token: string;
  pin: string;
  expiresAt: string;
}

interface SharedViewState {
  token: string;
  pin: string;
  payload: SharePayload;
  expiresAt: string;
}

interface ShareContextValue {
  activeShare: ActiveShare | null;
  sharedView: SharedViewState | null;
  isSharedView: boolean;
  create: (userId: string, pin: string, payload: SharePayload) => Promise<CreateShareResult>;
  revoke: () => Promise<void>;
  sync: (payload: SharePayload) => Promise<void>;
  loadShared: (token: string, pin: string) => Promise<SharePayload>;
  clearShared: () => void;
}

const ACTIVE_SHARE_KEY = 'sparkdo_active_share';

const ShareContext = createContext<ShareContextValue | null>(null);

function getStoredActiveShare(): ActiveShare | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SHARE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveShare;
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(ACTIVE_SHARE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function storeActiveShare(share: ActiveShare | null) {
  try {
    if (share) localStorage.setItem(ACTIVE_SHARE_KEY, JSON.stringify(share));
    else localStorage.removeItem(ACTIVE_SHARE_KEY);
  } catch {
    // ignore
  }
}

export function ShareProvider({ children }: { children: React.ReactNode }) {
  const [activeShare, setActiveShare] = useState<ActiveShare | null>(() => getStoredActiveShare());
  const [sharedView, setSharedView] = useState<SharedViewState | null>(null);

  useEffect(() => {
    storeActiveShare(activeShare);
  }, [activeShare]);

  const create = useCallback(async (userId: string, pin: string, payload: SharePayload) => {
    const result = await createShare(userId, pin, payload);
    const share: ActiveShare = { token: result.token, pin, expiresAt: result.expiresAt };
    setActiveShare(share);
    return result;
  }, []);

  const revoke = useCallback(async () => {
    if (!activeShare) return;
    await deleteShare(activeShare.token, activeShare.pin);
    setActiveShare(null);
  }, [activeShare]);

  const sync = useCallback(
    async (payload: SharePayload) => {
      if (!activeShare) return;
      await updateShare(activeShare.token, activeShare.pin, payload);
    },
    [activeShare]
  );

  const loadShared = useCallback(async (token: string, pin: string) => {
    const result = await fetchShare(token, pin);
    setSharedView({ token, pin, payload: result.payload, expiresAt: result.expiresAt });
    return result.payload;
  }, []);

  const clearShared = useCallback(() => {
    setSharedView(null);
  }, []);

  const value = useMemo(
    () => ({
      activeShare,
      sharedView,
      isSharedView: !!sharedView,
      create,
      revoke,
      sync,
      loadShared,
      clearShared,
    }),
    [activeShare, sharedView, create, revoke, sync, loadShared, clearShared]
  );

  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>;
}

export function useShare() {
  const ctx = useContext(ShareContext);
  if (!ctx) {
    throw new Error('useShare must be used within ShareProvider');
  }
  return ctx;
}
