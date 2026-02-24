<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const displayName = ref('')
const whatsapp = ref('')
const block = ref('')
const apartment = ref('')
const saving = ref(false)
const msg = ref('')

onMounted(() => {
  if (authStore.profile) {
    displayName.value = authStore.profile.display_name || ''
    whatsapp.value = authStore.profile.whatsapp || ''
    block.value = authStore.profile.block || ''
    apartment.value = authStore.profile.apartment || ''
  }
})

async function saveProfile() {
  if (!authStore.user) return
  saving.value = true
  msg.value = ''
  
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName.value,
      whatsapp: whatsapp.value,
      block: block.value,
      apartment: apartment.value,
    })
    .eq('id', authStore.user.id)
    
  if (error) {
    msg.value = 'Erro ao salvar: ' + error.message
  } else {
    msg.value = 'Perfil atualizado com sucesso!'
    await authStore.initialize() // refresh profile context
  }
  saving.value = false
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/login')
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
        <label class="block text-sm font-medium text-gray-700">Nome de Exibição / Apelido</label>
        <input v-model="displayName" required class="mt-1 w-full px-3 py-2 border rounded-lg" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">WhatsApp (Opcional)</label>
        <input v-model="whatsapp" type="tel" placeholder="11999999999" class="mt-1 w-full px-3 py-2 border rounded-lg" />
      </div>
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700">Bloco (Opcional)</label>
          <input v-model="block" class="mt-1 w-full px-3 py-2 border rounded-lg" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700">Apto (Opcional)</label>
          <input v-model="apartment" class="mt-1 w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>
      
      <button 
        type="submit" 
        :disabled="saving"
        class="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
      >
        {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
      </button>
      
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
