export interface SharePayload {
  assignments: any[];
  todos: any[];
  assignmentOverrides: Record<string, boolean>;
  posts: any[];
  classes: any[];
  events: any[];
}

export interface CreateShareResult {
  token: string;
  expiresAt: string;
}

export interface ShareResult {
  token: string;
  expiresAt: string;
  payload: SharePayload;
}

export async function createShare(
  userId: string,
  pin: string,
  payload: SharePayload
): Promise<CreateShareResult> {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, pin, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create share.');
  return data;
}

export async function fetchShare(token: string, pin: string): Promise<ShareResult> {
  const res = await fetch(`/api/share/${encodeURIComponent(token)}?pin=${encodeURIComponent(pin)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch share.');
  return data;
}

export async function updateShare(
  token: string,
  pin: string,
  payload: SharePayload
): Promise<void> {
  const res = await fetch(`/api/share/${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update share.');
}

export async function deleteShare(token: string, pin: string): Promise<void> {
  const res = await fetch(`/api/share/${encodeURIComponent(token)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete share.');
}
