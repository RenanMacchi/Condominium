import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Ensure .env is configured correctly.')
}

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    const isStorage = urlString.includes('/storage/v1/');
    const timeoutMs = isStorage ? 60000 : 12000; // Give uploads 60s, DB queries 12s

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err: any) {
        clearTimeout(id);
        if (err.name === 'AbortError' && typeof window !== 'undefined') {
            console.error(`Supabase network freeze detected. Forcing recovery reload...`);
            // If the tab woke up and TCP connections are dead, force reloading the DOM cures it.
            window.location.reload();
        }
        throw err;
    }
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    global: {
        fetch: customFetch
    }
})
