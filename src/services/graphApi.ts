import type { AccountInfo, SilentRequest } from '@azure/msal-browser';
import { getMsalInstance, graphScopes } from '../config/msalConfig';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

async function getToken(account: AccountInfo, scopes: string[] = graphScopes.basic) {
  const instance = getMsalInstance();
  if (!instance) throw new Error('MSAL is not configured');

  const request: SilentRequest = {
    account,
    scopes,
  };
  try {
    const response = await instance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    // Fallback to interactive if silent fails
    const response = await instance.acquireTokenPopup(request);
    return response.accessToken;
  }
}

async function graphFetch(path: string, token: string) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Graph API error: ${res.status}`);
  }

  return res.json();
}

// --- User Profile ---

export async function getMe(account: AccountInfo) {
  const token = await getToken(account, graphScopes.basic);
  return graphFetch('/me', token);
}

// --- Education / Teams Assignments ---

export async function getEducationAssignments(account: AccountInfo) {
  const token = await getToken(account, graphScopes.edu);
  return graphFetch('/education/me/assignments', token);
}

export async function getEducationClasses(account: AccountInfo) {
  const token = await getToken(account, graphScopes.edu);
  return graphFetch('/education/me/classes', token);
}

// --- Teams / Channels ---

export async function getJoinedTeams(account: AccountInfo) {
  const token = await getToken(account, graphScopes.edu);
  return graphFetch('/me/joinedTeams', token);
}

export async function getTeamChannels(account: AccountInfo, teamId: string) {
  const token = await getToken(account, graphScopes.edu);
  return graphFetch(`/teams/${teamId}/channels`, token);
}

// --- Calendar ---

export async function getCalendarEvents(account: AccountInfo) {
  const token = await getToken(account, graphScopes.calendar);
  const now = new Date().toISOString();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return graphFetch(`/me/calendarview?startdatetime=${now}&enddatetime=${end}&$top=50`, token);
}

// --- Types ---

export interface GraphUser {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  mail?: string;
  userPrincipalName: string;
  jobTitle?: string;
  officeLocation?: string;
}

export interface GraphAssignment {
  id: string;
  displayName: string;
  instructions?: { content: string; contentType: string };
  dueDateTime?: string;
  assignedDateTime?: string;
  status?: string;
  classId?: string;
}

export interface GraphTeam {
  id: string;
  displayName: string;
  description?: string;
}

export interface GraphEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  bodyPreview?: string;
}
