import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_ENABLED, SUPABASE_URL } from "./config";

export const supabase: SupabaseClient | null = SUPABASE_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export interface LeaderboardRow {
  user_id: string;
  username: string;
  points: number;
  avatar_id: number | null;
  friends: string[] | null;
  friend_requests: string[] | null;
  updated_at: string;
}

function ensure(): SupabaseClient {
  if (!supabase) throw new Error("Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env and restart Metro.");
  return supabase;
}

// Insert brand-new account row. Uniqueness is enforced on user_id (UUID) only —
// usernames may duplicate across accounts.
export async function registerUser(userId: string, username: string, avatarId?: number): Promise<void> {
  const sb = ensure();
  const { error } = await sb
    .from("leaderboard")
    .insert({
      user_id: userId,
      username,
      points: 0,
      avatar_id: avatarId ?? null,
      friends: [],
      friend_requests: [],
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}

// Updates name + avatar for an existing account (by user_id).
export async function updateProfileRow(userId: string, username: string, avatarId?: number): Promise<void> {
  const sb = ensure();
  const { error } = await sb
    .from("leaderboard")
    .update({ username, avatar_id: avatarId ?? null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function uploadScore(userId: string, username: string, points: number, avatarId?: number): Promise<void> {
  const sb = ensure();
  const { error } = await sb
    .from("leaderboard")
    .upsert(
      { user_id: userId, username, points, avatar_id: avatarId ?? null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}

export async function fetchTopScores(limit = 50): Promise<LeaderboardRow[]> {
  const sb = ensure();
  const { data, error } = await sb
    .from("leaderboard")
    .select("user_id, username, points, avatar_id, friends, friend_requests, updated_at")
    .order("points", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as LeaderboardRow[];
}

export async function fetchUserById(userId: string): Promise<LeaderboardRow | null> {
  const sb = ensure();
  const { data, error } = await sb
    .from("leaderboard")
    .select("user_id, username, points, avatar_id, friends, friend_requests, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data || null) as LeaderboardRow | null;
}

export async function fetchUsersByIds(ids: string[]): Promise<LeaderboardRow[]> {
  if (!ids.length) return [];
  const sb = ensure();
  const { data, error } = await sb
    .from("leaderboard")
    .select("user_id, username, points, avatar_id, friends, friend_requests, updated_at")
    .in("user_id", ids);
  if (error) throw error;
  return (data || []) as LeaderboardRow[];
}

// ---------- FRIENDS ----------

// Adds myId into targetId's friend_requests array (if not already there).
export async function sendFriendRequest(targetId: string, myId: string): Promise<void> {
  if (targetId === myId) throw new Error("Can't friend yourself.");
  const target = await fetchUserById(targetId);
  if (!target) throw new Error("No user with that ID.");
  const current = target.friend_requests || [];
  const friends = target.friends || [];
  if (friends.includes(myId)) throw new Error("You're already friends.");
  if (current.includes(myId)) throw new Error("Request already sent.");
  const sb = ensure();
  const { error } = await sb
    .from("leaderboard")
    .update({ friend_requests: [...current, myId] })
    .eq("user_id", targetId);
  if (error) throw error;
}

// Mutual add: otherId's request is accepted — each side's friends array gains the other's id,
// and otherId is removed from my friend_requests.
export async function acceptFriendRequest(myId: string, otherId: string): Promise<void> {
  const sb = ensure();
  const me = await fetchUserById(myId);
  const other = await fetchUserById(otherId);
  if (!me || !other) throw new Error("User not found.");

  const myFriends = me.friends || [];
  const otherFriends = other.friends || [];
  const myReqs = (me.friend_requests || []).filter(id => id !== otherId);

  await sb.from("leaderboard").update({
    friends: myFriends.includes(otherId) ? myFriends : [...myFriends, otherId],
    friend_requests: myReqs,
  }).eq("user_id", myId);

  await sb.from("leaderboard").update({
    friends: otherFriends.includes(myId) ? otherFriends : [...otherFriends, myId],
  }).eq("user_id", otherId);
}

export async function declineFriendRequest(myId: string, otherId: string): Promise<void> {
  const sb = ensure();
  const me = await fetchUserById(myId);
  if (!me) return;
  const myReqs = (me.friend_requests || []).filter(id => id !== otherId);
  const { error } = await sb.from("leaderboard").update({ friend_requests: myReqs }).eq("user_id", myId);
  if (error) throw error;
}

export async function removeFriend(myId: string, otherId: string): Promise<void> {
  const sb = ensure();
  const me = await fetchUserById(myId);
  const other = await fetchUserById(otherId);
  if (me) {
    const next = (me.friends || []).filter(id => id !== otherId);
    await sb.from("leaderboard").update({ friends: next }).eq("user_id", myId);
  }
  if (other) {
    const next = (other.friends || []).filter(id => id !== myId);
    await sb.from("leaderboard").update({ friends: next }).eq("user_id", otherId);
  }
}
