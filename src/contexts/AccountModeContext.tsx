import React, { createContext, useContext, useState, useEffect } from 'react';

export type AccountMode = 'child' | 'parent' | 'personal';

interface AccountModeContextValue {
  mode: AccountMode;
  setMode: (mode: AccountMode) => void;
  label: string;
  canSync: boolean;
  isReadOnly: boolean;
}

const STORAGE_KEY = 'sparkdo_account_mode';

const labels: Record<AccountMode, string> = {
  child: 'Student',
  parent: 'Parent',
  personal: 'Personal',
};

const AccountModeContext = createContext<AccountModeContextValue>({
  mode: 'child',
  setMode: () => {},
  label: 'Student',
  canSync: true,
  isReadOnly: false,
});

export function AccountModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AccountMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AccountMode;
      if (stored && ['child', 'parent', 'personal'].includes(stored)) return stored;
    } catch { /* ignore */ }
    return 'child';
  });

  const setMode = (next: AccountMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch { /* ignore */ }
  };

  const value: AccountModeContextValue = {
    mode,
    setMode,
    label: labels[mode],
    canSync: mode === 'child',
    isReadOnly: mode === 'parent',
  };

  return (
    <AccountModeContext.Provider value={value}>
      {children}
    </AccountModeContext.Provider>
  );
}

export function useAccountMode() {
  return useContext(AccountModeContext);
}
