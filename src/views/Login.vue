<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'vue-sonner'

const router = useRouter()
const username = ref('')
const recoveryEmail = ref('')
const password = ref('')
const loading = ref(false)
const isSignUp = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const formattedUsername = String(username.value).trim().toLowerCase()
    if (!formattedUsername) throw new Error('O usuário é obrigatório')

    if (isSignUp.value) {
      // 1. Check if username is valid format (no spaces, etc)
      if (/\s/.test(formattedUsername)) {
        throw new Error('O nome de usuário não pode conter espaços.')
      }

      // 2. Generate fake email for Supabase Auth
      const fakeEmail = `${formattedUsername}@condominiostore.local`
      
      const { error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password.value,
        options: {
          data: {
            username: formattedUsername,
            recovery_email: recoveryEmail.value || null
          }
        }
      })
      if (error) throw error

      toast.success('Conta criada com sucesso!')
      router.push('/')
    } else {
      // Login flow: Find the real underlying Auth user email for this username
      const { data: realEmail, error: rpcError } = await supabase.rpc('get_email_by_username', {
        p_username: formattedUsername
      })

      if (rpcError || !realEmail) {
        throw new Error('Usuário não encontrado ou senha incorreta.')
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: realEmail,
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

async function handleResetPassword() {
  if (!username.value) {
    errorMsg.value = 'Por favor, informe seu usuário acima para recuperar a senha.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const formattedUsername = String(username.value).trim().toLowerCase()

    const { data: realEmail, error: rpcError } = await supabase.rpc('get_email_by_username', {
      p_username: formattedUsername
    })

    if (rpcError || !realEmail) {
      throw new Error('Usuário não encontrado ou sem e-mail de recuperação cadastrado.')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(realEmail, {
      redirectTo: window.location.origin + '/reset-password',
    })
    if (error) throw error
    toast.success('As instruções para redefinir sua senha foram enviadas para o seu e-mail de recuperação!')
  } catch (err: any) {
    errorMsg.value = err.message || 'Erro ao solicitar redefinição'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-green-600 mb-2">Condomínio Store</h1>
        <p class="text-gray-600 font-medium mt-4 text-lg">
          {{ isSignUp ? 'Criar Nova Conta' : 'Entrar na sua conta' }}
        </p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div v-if="errorMsg" class="p-3 bg-red-100 text-red-700 text-sm rounded-lg">
          {{ errorMsg }}
        </div>
        
        <div>
          <label for="username_input" class="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
          <input 
            id="username_input"
            name="username"
            autocomplete="username"
            v-model="username" 
            type="text" 
            required 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition lowercase"
            placeholder="joao123"
          >
        </div>

        <div v-if="isSignUp">
          <label for="recovery_email_input" class="block text-sm font-medium text-gray-700 mb-1">E-mail de Recuperação (Opcional)</label>
          <input 
            id="recovery_email_input"
            name="recovery_email"
            autocomplete="email"
            v-model="recoveryEmail" 
            type="email" 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="seu@gemail.com"
          >
          <p class="text-[10px] text-gray-500 mt-1">Sugerimos informar um e-mail para conseguir redefinir sua senha caso esqueça.</p>
        </div>
        
        <div>
          <label for="password_input" class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input 
            id="password_input"
            name="password"
            autocomplete="current-password"
            v-model="password" 
            type="password" 
            required 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="••••••••"
          >
        </div>
        
          <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          <span v-if="loading">Aguarde...</span>
          <span v-else>{{ isSignUp ? 'Cadastrar' : 'Entrar' }}</span>
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-600">
        <button @click="isSignUp = !isSignUp" class="text-green-600 font-semibold hover:underline">
          {{ isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se' }}
        </button>
      </div>

      <div v-if="!isSignUp" class="mt-4 text-center text-sm text-gray-600">
        <button @click="handleResetPassword" class="text-gray-500 font-medium hover:text-gray-900 transition-colors hover:underline">
          Esqueci minha senha
        </button>
      </div>
      
    </div>
  </div>
</template>
