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
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const profile = ref<Profile | null>(null)
    const loading = ref(true)

    async function fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (!error && data) {
            profile.value = data as Profile
        }
    }

    async function initialize() {
        loading.value = true
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
        initialize,
        signOut
    }
})
