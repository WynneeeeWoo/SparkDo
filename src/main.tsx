import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AccountModeProvider } from './contexts/AccountModeContext';
import { MsalProvider } from '@azure/msal-react';
import { getMsalInstance, hasMsalConfig } from './config/msalConfig';
import App from './App.tsx';
import './index.css';

const msalInstance = getMsalInstance();

const AppWrapper = () => (
  <ThemeProvider>
    <AuthProvider>
      <AccountModeProvider>
        <SyncProvider>
          <App />
        </SyncProvider>
      </AccountModeProvider>
    </AuthProvider>
  </ThemeProvider>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {msalInstance && hasMsalConfig ? (
      <MsalProvider instance={msalInstance}>
        <AppWrapper />
      </MsalProvider>
    ) : (
      <AppWrapper />
    )}
  </StrictMode>,
);
