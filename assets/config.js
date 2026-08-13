/* ==========================================================================
   FITLYTIX — site configuration
   Single source of truth for values that appear on more than one page.

   The Supabase anon key is safe to ship in the browser: it is the public
   client key and every table is guarded by row level security. Never put the
   service_role key in this file.
   ========================================================================== */

window.FITLYTIX = {
  supabase: {
    url: 'https://fsbnfvjqndcevygqhxkt.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzYm5mdmpxbmRjZXZ5Z3FoeGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTM3NTMsImV4cCI6MjA5MjY4OTc1M30.5GkQPCbaaD5SGBDmWjsp1bLQ8gZHnJ0Ez2xJN0neOgg',
  },

  site: {
    origin: 'https://fitlytix.in',
    supportEmail: 'support@fitlytix.in',
  },

  // Minimum password length. Keep in sync with the Supabase Auth setting
  // (Dashboard, Authentication, Providers, Email, Minimum password length).
  minPasswordLength: 8,

  // Tables the public forms write into. Both must exist in Supabase with an
  // anon insert policy before the forms will work. The SQL is in the comment
  // at the bottom of /demo/index.html and /delete-account/index.html.
  leadsTable: 'demo_requests',
  deletionTable: 'deletion_requests',
};
