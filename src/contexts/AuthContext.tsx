import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AccountInfo } from '@azure/msal-browser';
import type { User } from '../types';
import { hasMsalConfig, getMsalInstance, loginRequest, adminConsentUrl } from '../config/msalConfig';
import { getMe, type GraphUser } from '../services/graphApi';

interface StoredUser extends User {
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  msalEnabled: boolean;
  msalAccount: AccountInfo | null;
  adminConsentRequired: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<Omit<User, 'id'>>) => void;
  loginWithMicrosoft: () => Promise<{ success: boolean; error?: string; adminConsent?: boolean }>;
  requestAdminConsent: () => void;
}

const AUTH_STORAGE_KEY = 'sparkdo_auth_user';
const USERS_STORAGE_KEY = 'sparkdo_users';

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [msalAccount, setMsalAccount] = useState<AccountInfo | null>(null);
  const [adminConsentRequired, setAdminConsentRequired] = useState(false);

  const msalEnabled = hasMsalConfig;
  const msalInstance = getMsalInstance();

  // Hydrate from localStorage / MSAL on mount
  useEffect(() => {
    async function init() {
      // Check MSAL first
      if (msalInstance) {
        try {
          await msalInstance.initialize();
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            const account = accounts[0];
            setMsalAccount(account);
            // Build user from MSAL account
            const msalUser: User = {
              id: account.homeAccountId,
              email: account.username,
              displayName: account.name || account.username.split('@')[0],
            };
            // Try to enrich with Graph profile
            try {
              const profile: GraphUser = await getMe(account);
              if (profile.displayName) msalUser.displayName = profile.displayName;
              if (profile.mail) msalUser.email = profile.mail;
            } catch {
              // Graph may fail if admin consent is missing — still keep the MSAL login
            }
            setUser(msalUser);
            saveCurrentUser(msalUser);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.error('MSAL init error:', err);
        }
      }

      // Fallback to local auth
      const current = getCurrentUser();
      if (current) {
        setUser(current);
      }
      setIsLoading(false);
    }

    init();
  }, [msalInstance]);

  // --- Local Auth ---

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const users = getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      return { success: false, error: 'No account found with this email.' };
    }
    if (found.password !== password) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    const { password: _, ...userWithoutPassword } = found;
    setUser(userWithoutPassword);
    saveCurrentUser(userWithoutPassword);
    setMsalAccount(null);
    setAdminConsentRequired(false);
    return { success: true };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 800));
    const users = getStoredUsers();

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      email: email.toLowerCase().trim(),
      displayName: name.trim(),
      password,
    };

    users.push(newUser);
    saveStoredUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    saveCurrentUser(userWithoutPassword);
    setMsalAccount(null);
    setAdminConsentRequired(false);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    if (msalInstance && msalAccount) {
      msalInstance.logoutRedirect({ account: msalAccount }).catch(() => {
        // If redirect fails, clear manually
      });
    }
    setUser(null);
    setMsalAccount(null);
    setAdminConsentRequired(false);
    saveCurrentUser(null);
  }, [msalInstance, msalAccount]);

  const resetPassword = useCallback(async (email: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const users = getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      return { success: false, error: 'No account found with this email.' };
    }
    return { success: true };
  }, []);

  const updateProfile = useCallback((updates: Partial<Omit<User, 'id'>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      saveCurrentUser(next);

      const users = getStoredUsers();
      const idx = users.findIndex((u) => u.id === prev.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...updates };
        saveStoredUsers(users);
      }
      return next;
    });
  }, []);

  // --- Microsoft Auth ---

  const loginWithMicrosoft = useCallback(async () => {
    if (!msalInstance) {
      return { success: false, error: 'Microsoft login is not configured. Add VITE_MSAL_CLIENT_ID to your .env file.' };
    }

    try {
      setAdminConsentRequired(false);
      const response = await msalInstance.loginPopup(loginRequest);
      const account = response.account;

      if (!account) {
        return { success: false, error: 'Login was cancelled or no account was returned.' };
      }

      // Build user from MSAL + Graph
      const msalUser: User = {
        id: account.homeAccountId,
        email: account.username,
        displayName: account.name || account.username.split('@')[0],
      };

      try {
        const profile: GraphUser = await getMe(account);
        if (profile.displayName) msalUser.displayName = profile.displayName;
        if (profile.mail) msalUser.email = profile.mail;
      } catch (graphErr: any) {
        // Check for admin consent error
        const errMsg = graphErr?.message || '';
        if (errMsg.includes('403') || errMsg.includes('Consent')) {
          setAdminConsentRequired(true);
          // Still log them in with basic info
        }
      }

      setMsalAccount(account);
      setUser(msalUser);
      saveCurrentUser(msalUser);
      return { success: true };
    } catch (err: any) {
      const errorCode = err?.errorCode || err?.message || '';
      const errorMessage = err?.message || 'Microsoft login failed.';

      // Detect admin consent required
      if (
        errorCode.includes('AADSTS65001') ||
        errorCode.includes('AADSTS90094') ||
        errorMessage.includes('admin') ||
        errorMessage.includes('consent')
      ) {
        setAdminConsentRequired(true);
        return { success: false, error: 'Admin approval required. Ask your IT admin to approve SparkDo, or click below to send a request.', adminConsent: true };
      }

      return { success: false, error: errorMessage };
    }
  }, [msalInstance]);

  const requestAdminConsent = useCallback(() => {
    const url = adminConsentUrl();
    window.open(url, '_blank');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        msalEnabled,
        msalAccount,
        adminConsentRequired,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        loginWithMicrosoft,
        requestAdminConsent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
