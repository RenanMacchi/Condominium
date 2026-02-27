<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../lib/supabaseClient'
import { ShieldAlert } from 'lucide-vue-next'

const auth = useAuth()
const displayName = ref('')
const whatsapp = ref('')
const site = ref('')
const house = ref('')
const saving = ref(false)
const msg = ref('')

onMounted(() => {
  if (auth.profile.value) {
    displayName.value = auth.profile.value.display_name || ''
    whatsapp.value = auth.profile.value.whatsapp || ''
    site.value = auth.profile.value.site || ''
    house.value = auth.profile.value.house || ''
  }
})

async function saveProfile() {
  if (!auth.user.value) return
  saving.value = true
  msg.value = ''
  
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName.value,
      whatsapp: whatsapp.value,
      site: site.value,
      house: house.value,
    })
    .eq('id', auth.user.value.id)
    
  if (error) {
    msg.value = 'Erro ao salvar: ' + error.message
  } else {
    msg.value = 'Perfil atualizado com sucesso!'
    // update local state
    if (auth.profile.value) {
      auth.profile.value.display_name = displayName.value
      auth.profile.value.whatsapp = whatsapp.value
      auth.profile.value.site = site.value
      auth.profile.value.house = house.value
    }
  }
  saving.value = false
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
        <label class="block text-sm font-medium text-gray-700">Nome de Exibição / Apelido</label>
        <input v-model="displayName" required class="mt-1 w-full px-3 py-2 border rounded-lg" />
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
