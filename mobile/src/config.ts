// Supabase credentials. Expo inlines any variable prefixed with EXPO_PUBLIC_
// at build time. Put these in a .env file at mobile/ and restart Metro:
//
//   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi.......
//
// Without them, the leaderboard UI still renders but gracefully disables remote sync.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";
export const SUPABASE_ENABLED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
