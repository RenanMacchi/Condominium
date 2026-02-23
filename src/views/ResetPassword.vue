<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
    // Check if we have the hash in the URL containing the access token
    const hash = window.location.hash
    if (!hash || !hash.includes('type=recovery')) {
        errorMsg.value = 'Link de recuperação inválido ou expirado.'
    }
})

async function handleSetNewPassword() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })
    
    if (error) throw error
    
    alert('Senha atualizada com sucesso!')
    router.push('/')
  } catch (err: any) {
    errorMsg.value = err.message || 'Erro ao atualizar a senha'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
      
      <div class="text-center mb-8">
        <h1 class="text-2xl font-extrabold text-green-600 mb-2">Redefinir Senha</h1>
        <p class="text-gray-500">Digite sua nova senha abaixo</p>
      </div>
      
      <form @submit.prevent="handleSetNewPassword" class="space-y-5">
        <div v-if="errorMsg" class="p-3 bg-red-100 text-red-700 text-sm rounded-lg">
          {{ errorMsg }}
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            placeholder="••••••••"
          >
        </div>
        
        <button 
          type="submit" 
          :disabled="loading || !!errorMsg"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          <span v-if="loading">Aguarde...</span>
          <span v-else>Salvar Nova Senha</span>
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-600">
        <button @click="router.push('/login')" class="text-green-600 font-semibold hover:underline">
          Voltar para o login
        </button>
      </div>
      
    </div>
  </div>
</template>
