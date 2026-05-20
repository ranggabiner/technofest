export type ProfileFormSnapshot = Record<string, string[]>;

export function createProfileFormSnapshot(formData: FormData): ProfileFormSnapshot {
  const snapshot: ProfileFormSnapshot = {};

  for (const [key, value] of formData.entries()) {
    const normalized = normalizeProfileFormValue(value);
    if (normalized === null) continue;
    snapshot[key] ??= [];
    snapshot[key].push(normalized);
  }

  return snapshot;
}

export function isProfileFormSnapshotDirty(initial: ProfileFormSnapshot, current: ProfileFormSnapshot) {
  const keys = new Set([...Object.keys(initial), ...Object.keys(current)]);

  for (const key of keys) {
    const initialValues = initial[key] ?? [];
    const currentValues = current[key] ?? [];
    if (initialValues.length !== currentValues.length) return true;

    for (let index = 0; index < initialValues.length; index += 1) {
      if (initialValues[index] !== currentValues[index]) return true;
    }
  }

  return false;
}

function normalizeProfileFormValue(value: FormDataEntryValue) {
  if (typeof value === "string") return value.trim();
  if (value.size <= 0 && !value.name.trim()) return null;

  return `file:${value.name}:${value.size}:${value.type}:${value.lastModified}`;
}
