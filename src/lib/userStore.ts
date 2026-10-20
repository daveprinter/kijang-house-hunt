// Per-account local storage, so each signed-in user keeps their own saved hunt.
export function loadUserData<T>(userId: string | undefined, key: string, fallback: T): T {
  if (!userId || typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`keja-yangu:${userId}:${key}`);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveUserData(userId: string | undefined, key: string, value: unknown) {
  if (!userId || typeof window === "undefined") return;
  localStorage.setItem(`keja-yangu:${userId}:${key}`, JSON.stringify(value));
}
