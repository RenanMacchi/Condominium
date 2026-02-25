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

        // Use getUser() to guarantee a fresh, verified session from the server on the initial app load.
        // Since we decoupled the Vue Router, this will ONLY ever run once per session, avoiding any tab-switch hanging.
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (currentUser) {
            user.value = currentUser
            await fetchProfile(currentUser.id)
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                user.value = session.user
                await fetchProfile(session.user.id)
            } else {
                user.value = null
                profile.value = null
            }
        })
        loading.value = false
        initialized.value = true
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
