import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export interface Profile {
    id: string
    display_name: string
    apartment?: string
    block?: string
    whatsapp?: string
    avatar_url?: string
    house?: string
    site?: string
    is_admin: boolean
    is_banned: boolean
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const profile = ref<Profile | null>(null)
    const loading = ref(true)
    const initialized = ref(false)

    async function fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (!error && data) {
            if (data.is_banned) {
                // If the user profile is marked as banned, force sign out.
                await supabase.auth.signOut()
                user.value = null
                profile.value = null
                alert('Sua conta foi banida pelo administrador. Acesso revogado.')
                window.location.href = '/' // Force reload to trigger auth guards
                return
            }
            profile.value = data as Profile
        }
    }

    async function initialize() {
        if (initialized.value) return
        loading.value = true

        try {
            // Use getUser() to guarantee a fresh, verified session from the server on the initial app load.
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            if (currentUser) {
                user.value = currentUser
                await fetchProfile(currentUser.id)
            }
        } catch (error) {
            console.error('Fatal auth initialization error:', error)
        } finally {
            loading.value = false
            initialized.value = true
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                user.value = session.user
                try {
                    await fetchProfile(session.user.id)
                } catch (e) {
                    console.error('Failed to fetch profile aggressively:', e)
                }
            } else {
                user.value = null
                profile.value = null
            }
        })
    }

    async function signOut() {
        await supabase.auth.signOut()
        user.value = null
        profile.value = null
    }

    return {
        user,
        profile,
        loading,
        initialized,
        initialize,
        signOut
    }
})
