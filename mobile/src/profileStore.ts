import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Profile {
  userId: string;        // stable UUID — primary identity; usernames may duplicate across accounts
  username: string;
  createdAt: number;
  avatarId?: number;     // preset 1-4 — synced to leaderboard
  avatarUri?: string;    // camera photo, local file URI — NOT synced (local display only)
  lastUploadedAt?: number;
  lastUploadedPoints?: number;
}

const KEY = "nextsteps_profile_v1";

// RFC4122 v4 UUID — avoids a crypto dep.
export function newUserId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function loadProfile(): Promise<Profile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export async function saveProfile(p: Profile) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}
export async function clearProfile() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}

// Trims leading/trailing whitespace. With user_id as the stable identity,
// usernames are display-only — case and spaces in the middle are preserved.
export function normalizeUsername(raw: string): string {
  return (raw || "").trim();
}

export function validateUsername(name: string): string | null {
  const trimmed = normalizeUsername(name);
  if (trimmed.length < 2) return "At least 2 characters";
  if (trimmed.length > 24) return "Max 24 characters";
  if (!/^[A-Za-z0-9_\- ]+$/.test(trimmed)) return "Letters, numbers, spaces, _ and - only";
  return null;
}
