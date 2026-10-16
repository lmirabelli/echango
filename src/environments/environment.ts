export const environment = {
  production: true,
  supabaseUrl: (import.meta as any).env['NG_APP_SUPABASE_URL'] || 'https://luoniwjlxmailoojkfir.supabase.co',
  supabaseKey: (import.meta as any).env['NG_APP_SUPABASE_KEY'] || 'sb_publishable_X_QG2EGJoh6BLJMWVA8gpg_ibJnLtVL'
};