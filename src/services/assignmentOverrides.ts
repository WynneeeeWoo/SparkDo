const OVERRIDES_KEY = 'sparkdo_assignment_overrides';

export function getAssignmentOverrides(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveAssignmentOverrides(overrides: Record<string, boolean>) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // ignore storage errors
  }
}

export function clearAssignmentOverrides() {
  localStorage.removeItem(OVERRIDES_KEY);
}

export function applyAssignmentOverrides<T extends { id: string; completed: boolean }>(
  items: T[],
  overrides: Record<string, boolean>
): T[] {
  if (Object.keys(overrides).length === 0) return items;
  return items.map((item) => {
    const override = overrides[item.id];
    return override === undefined ? item : { ...item, completed: override };
  });
}
