<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../lib/supabaseClient'
import { ShieldAlert } from 'lucide-vue-next'

const auth = useAuth()
const displayName = ref('')
const username = ref('')
const recoveryEmail = ref('')
const whatsapp = ref('')
const site = ref('')
const house = ref('')
const saving = ref(false)
const msg = ref('')

onMounted(() => {
  if (auth.profile.value) {
    displayName.value = auth.profile.value.display_name || ''
    username.value = auth.profile.value.username || ''
    recoveryEmail.value = auth.profile.value.recovery_email || ''
    whatsapp.value = auth.profile.value.whatsapp || ''
    site.value = auth.profile.value.site || ''
    house.value = auth.profile.value.house || ''
  }
})

async function saveProfile() {
  if (!auth.user.value) return
  saving.value = true
  msg.value = ''
  
  try {
    // Se o e-mail de recuperação for diferente da conta primária de Autenticação atual,
    // Sincroniza ele no banco de dados Auth User para que o "Recuperar de Senha" funcione
    // usando esse e-mail de verdade (já que o antigo casaX@local é inválido)
    if (recoveryEmail.value && recoveryEmail.value !== auth.user.value.email) {
      // Usando RPC customizada pois o Supabase bloqueia a troca simples se o email antigo (ex: .local)
      // for considerado inválido na checagem de formato interno do Auth.
      const { error: rpcError } = await supabase.rpc('update_user_email', {
        new_email: recoveryEmail.value
      })
      if (rpcError) throw rpcError

      // Como o email mudou "por baixo dos panos", o token de sessão local fica defasado (causando 403)
      // Precisamos forçar o cliente a buscar um JWT novo com o novo email:
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
         // Se falhar o refresh por algum motivo, desloga para forçar um relogin limpo
         await auth.signOut()
         throw new Error("Sessão expirou durante a troca de email. Por favor, faça login novamente.")
      }

      if (refreshData?.user && auth.user.value) {
        auth.user.value = refreshData.user
      } else if (auth.user.value) {
        auth.user.value.email = recoveryEmail.value
      }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.value,
        recovery_email: recoveryEmail.value,
        whatsapp: whatsapp.value,
        site: site.value,
        house: house.value,
      })
      .eq('id', auth.user.value.id)

    if (profileError) throw profileError

    msg.value = 'Perfil atualizado com sucesso!'
    if (auth.profile.value) {
      auth.profile.value.display_name = displayName.value
      auth.profile.value.recovery_email = recoveryEmail.value
      auth.profile.value.whatsapp = whatsapp.value
      auth.profile.value.site = site.value
      auth.profile.value.house = house.value
    }
  } catch (err: any) {
    msg.value = 'Erro ao salvar: ' + (err.message || 'Falha desconhecida')
  } finally {
    saving.value = false
  }
}

const sendingReset = ref(false)
const resetMsg = ref('')

async function sendResetPassword() {
  const savedEmail = auth.profile.value?.recovery_email;
  
  if (!savedEmail || savedEmail !== recoveryEmail.value) {
    resetMsg.value = 'Por favor, salve as alterações do seu e-mail de recuperação primeiro.'
    return
  }
  
  sendingReset.value = true
  resetMsg.value = ''
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(savedEmail, {
      redirectTo: window.location.origin + '/reset-password',
    })
    
    if (error) throw error
    resetMsg.value = 'E-mail de redefinição enviado com sucesso! Verifique sua caixa de entrada.'
  } catch (err: any) {
    resetMsg.value = 'Erro: ' + (err.message || 'Falha ao processar solicitação')
  } finally {
    sendingReset.value = false
  }
}

async function handleSignOut() {
  await auth.signOut()
}
</script>

<template>
  <div class="p-4 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">Meus Dados</h1>
    
    <div v-if="msg" class="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
      {{ msg }}
    </div>

    <form @submit.prevent="saveProfile" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Usuário (Login)</label>
        <input v-model="username" readonly class="mt-1 w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
        <p class="text-xs text-gray-500 mt-1">O seu usuário é único e não pode ser alterado.</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Nome de Exibição / Apelido</label>
        <input v-model="displayName" required class="mt-1 w-full px-3 py-2 border rounded-lg" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">E-mail de Recuperação</label>
        <input v-model="recoveryEmail" type="email" placeholder="Para recuperar senha se esquecer" class="mt-1 w-full px-3 py-2 border rounded-lg" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">WhatsApp (Opcional)</label>
        <input v-model="whatsapp" type="tel" placeholder="11999999999" class="mt-1 w-full px-3 py-2 border rounded-lg" />
      </div>
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700">Site Público (Opcional)</label>
          <input v-model="site" placeholder="ex: seussite.com.br" class="mt-1 w-full px-3 py-2 border rounded-lg" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700">Casa (Opcional)</label>
          <input v-model="house" placeholder="ex: 12B" class="mt-1 w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>
      
      <button 
        type="submit" 
        :disabled="saving"
        class="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
      >
        {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
      </button>

      <router-link
        v-if="auth.profile.value?.is_admin"
        to="/admin"
        class="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg mt-4 py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95"
      >
        <ShieldAlert class="w-5 h-5" />
        Painel de Moderação
      </router-link>

      <!-- Seção do botão de troca de senha (separada visualmente por uma linha/container) -->
      <div v-if="auth.profile.value?.recovery_email && auth.profile.value?.recovery_email === recoveryEmail" class="mt-8 pt-6 border-t border-gray-200">
        <h2 class="text-sm font-bold text-gray-800 mb-2">Segurança</h2>
        <div v-if="resetMsg" 
             class="mb-3 p-3 text-sm rounded-lg" 
             :class="resetMsg.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
          {{ resetMsg }}
        </div>
        <button 
          type="button" 
          @click="sendResetPassword"
          :disabled="sendingReset"
          class="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-3 px-4 rounded-xl shadow-sm transition-colors active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          {{ sendingReset ? 'Enviando...' : 'Solicitar Troca de Senha / Enviar Email' }}
        </button>
      </div>
      
      <button 
        type="button" 
        @click="handleSignOut"
        class="w-full bg-red-100 hover:bg-red-200 text-red-700 mt-4 py-3.5 rounded-xl font-bold transition-colors active:scale-95"
      >
        Sair da Conta
      </button>
    </form>
  </div>
</template>
