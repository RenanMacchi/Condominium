import { onMounted, onUnmounted } from 'vue'

export function useVisibilityRefetch(refetchFn: () => void | Promise<void>) {
    const handleVisibilityChange = () => {
        // Only trigger when document becomes visible and is not hidden
        if (document.visibilityState === 'visible' && !document.hidden) {
            refetchFn()
        }
    }

    const handleFocus = () => {
        // Also handle window focus as a fallback for some browsers
        if (!document.hidden) {
            refetchFn()
        }
    }

    onMounted(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)
    })

    onUnmounted(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
    })
}
