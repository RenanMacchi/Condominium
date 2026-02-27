import { onMounted, onUnmounted } from 'vue'

export function useVisibilityRefetch(refetchFn: () => void | Promise<void>) {
    let isFetching = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const execute = async () => {
        if (isFetching) return
        isFetching = true
        try {
            await refetchFn()
        } catch (e) {
            console.error('Visibility refetch error:', e)
        } finally {
            isFetching = false
        }
    }

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !document.hidden) {
            if (timeoutId) clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                execute()
            }, 2000) // 2s debounce
        }
    }

    onMounted(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange)
    })

    onUnmounted(() => {
        if (timeoutId) clearTimeout(timeoutId)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
}
