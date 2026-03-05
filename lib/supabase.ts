// Singleton rimosso: usare createSupabaseServerClient() per server actions/components
// e createSupabaseBrowserClient() per client components.
export { createSupabaseServerClient } from './supabase-server';
export { createSupabaseBrowserClient } from './supabase-browser';
