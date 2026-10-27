/* Supabase project settings for the M-RES ERP.
   Find both in Supabase: Project Settings > API (or "Connect" > App frameworks).
   The anon / publishable key is meant to be public. The data is protected by sign-in
   and by the row-level security rules in setup.sql. Never put the service_role key here. */
window.MRES_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT-ID.supabase.co",
  supabaseKey: "PASTE-THE-ANON-OR-PUBLISHABLE-KEY-HERE"
};
