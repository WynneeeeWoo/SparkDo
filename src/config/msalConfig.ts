import { LogLevel, PublicClientApplication, type Configuration } from '@azure/msal-browser';

// MSAL Configuration
// Fill these in from your Azure AD app registration:
// https://portal.azure.com -> Microsoft Entra ID -> App registrations

const CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID || '';
const TENANT_ID = import.meta.env.VITE_MSAL_TENANT_ID || 'common';
const REDIRECT_URI = import.meta.env.VITE_MSAL_REDIRECT_URI || window.location.origin;

export const hasMsalConfig = Boolean(CLIENT_ID);

export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage' as const,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string, containsPii: boolean) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error('[MSAL]', message);
        else if (level === LogLevel.Warning) console.warn('[MSAL]', message);
        else if (import.meta.env.DEV) console.log('[MSAL]', message);
      },
      logLevel: import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error,
    },
  },
};

export const graphScopes = {
  basic: ['User.Read', 'openid', 'profile'],
  edu: ['EduAssignments.Read', 'TeamMember.Read.All', 'Channel.ReadBasic.All'],
  calendar: ['Calendars.Read'],
};

export const loginRequest = {
  scopes: [...graphScopes.basic, ...graphScopes.edu],
  prompt: 'select_account' as const,
};

export const adminConsentUrl = (tenantId: string = TENANT_ID) =>
  `https://login.microsoftonline.com/${tenantId}/adminconsent?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

// Lazy singleton — only instantiate if configured
let _instance: PublicClientApplication | null = null;

export function getMsalInstance(): PublicClientApplication | null {
  if (!hasMsalConfig) return null;
  if (!_instance) {
    _instance = new PublicClientApplication(msalConfig);
  }
  return _instance;
}
