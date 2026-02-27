import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types'
import router from '../router'

// Estado Global "Puro" em Reactivity Vue (Singleton)
const user = ref<User | null>(null)
const profile = ref<Profile | null>(null)
const initialized = ref(false)

async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data?.is_banned) {
        await supabase.auth.signOut()
        alert('Sua conta foi banida pelo administrador. Acesso revogado.')
        return
    }
    profile.value = data as Profile
}

// Inicia o listener global assim que o arquivo é importado pela primeira vez.
supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user || null

    if (user.value) {
        loadProfile(user.value.id)
    } else {
        profile.value = null
    }

    initialized.value = true
})

export function useAuth() {
    return {
        user,
        profile,
        initialized,
        signOut: async () => {
            await supabase.auth.signOut()
            router.push('/login')
        }
    }
}
