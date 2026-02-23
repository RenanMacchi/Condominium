import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const profile = ref<any>(null)
    const loading = ref(true)

    async function fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (!error && data) {
            profile.value = data
        }
    }

    async function initialize() {
        loading.value = true
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
            user.value = session.user
            await fetchProfile(session.user.id)
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
