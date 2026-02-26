import { onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

export function useVisibilityRefetch(refetchFn: () => void | Promise<void>) {
    let isFetching = false

    const execute = async () => {
        if (isFetching) return
        isFetching = true
        try {
            // Force token refresh if needed BEFORE fetching data
            // This prevents race conditions where the fetch fails due to an expired token
            // right before the background session recovery completes.
            await supabase.auth.getSession()
            await refetchFn()
        } catch (e) {
            console.error('Visibility refetch error:', e)
        } finally {
            isFetching = false
        }
    }

    const handleVisibilityChange = () => {
        // Only trigger when document becomes visible and is not hidden
        if (document.visibilityState === 'visible' && !document.hidden) {
            execute()
        }
    }

    const handleFocus = () => {
        // Also handle window focus as a fallback for some browsers
        if (!document.hidden) {
            execute()
        }
    }

    const handlePageShow = (e: any) => {
        // Handle restoration from bfcache (Back-Forward Cache)
        if (e.persisted) {
            execute()
        }
    }

    onMounted(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)
        window.addEventListener('pageshow', handlePageShow)
    })

    onUnmounted(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('pageshow', handlePageShow)
    })
}
