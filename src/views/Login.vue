<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const isSignUp = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    if (isSignUp.value) {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      alert('Verifique seu e-mail para confirmar o cadastro!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      router.push('/')
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Ocorreu um erro'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-primary-600 mb-2">Condomínio Store</h1>
        <p class="text-gray-500">O seu marketplace interno</p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div v-if="errorMsg" class="p-3 bg-red-100 text-red-700 text-sm rounded-lg">
          {{ errorMsg }}
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            placeholder="seu@email.com"
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
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
          :disabled="loading"
          class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          <span v-if="loading">Aguarde...</span>
          <span v-else>{{ isSignUp ? 'Criar Conta' : 'Entrar' }}</span>
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-600">
        <button @click="isSignUp = !isSignUp" class="text-primary-600 font-semibold hover:underline">
          {{ isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se' }}
        </button>
      </div>
      
    </div>
  </div>
</template>
