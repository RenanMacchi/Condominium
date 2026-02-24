<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listingsService, type Listing } from '../services/listings'
import { useAuthStore } from '../stores/auth'
import { Trash2, Edit2 } from 'lucide-vue-next'

import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const listings = ref<Listing[]>([])
const loading = ref(true)

async function loadMyListings() {
  if (!authStore.user) return
  loading.value = true
  try {
    listings.value = await listingsService.getMyListings(authStore.user.id)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function changeStatus(listing: Listing, newStatus: string) {
  try {
    listing.status = newStatus as any // UI optimistic config
    await listingsService.updateStatus(listing.id, newStatus)
  } catch (e) {
    console.error(e)
    alert('Erro ao atualizar status')
    loadMyListings() // reload
  }
}

async function deleteListing(id: string) {
  if (!confirm('Deseja realmente excluir este anúncio? Não é possível desfazer.')) return
  try {
    await listingsService.deleteListing(id)
    listings.value = listings.value.filter(l => l.id !== id)
  } catch (e) {
    console.error(e)
    alert('Erro ao excluir anúncio')
  }
}

const statusOptionsByModel: Record<string, { label: string, value: string }[]> = {
  'VENDA': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Reservado', value: 'RESERVADO' },
    { label: 'Vendido', value: 'VENDIDO_DOADO' },
    { label: 'Inativo', value: 'INATIVO' },
  ],
  'DOACAO': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Reservado', value: 'RESERVADO' },
    { label: 'Doado', value: 'VENDIDO_DOADO' },
    { label: 'Inativo', value: 'INATIVO' },
  ],
  'SERVICO': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Concluído/Pausado', value: 'CONCLUIDO' },
    { label: 'Inativo', value: 'INATIVO' },
  ]
}

function getOptions(type: string) {
  return statusOptionsByModel[type] || statusOptionsByModel['VENDA']
}

function statusColor(status: string) {
  switch (status) {
    case 'ATIVO': return 'bg-green-100 text-green-800'
    case 'RESERVADO': return 'bg-yellow-100 text-yellow-800'
    case 'VENDIDO_DOADO':
    case 'CONCLUIDO': return 'bg-gray-100 text-gray-800'
    case 'INATIVO': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

onMounted(() => {
  if (authStore.user) {
    loadMyListings()
  }
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-20 md:pb-10">
    <div class="px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10 flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Meus Anúncios</h1>
      <RouterLink to="/new" class="text-primary-600 font-bold text-sm bg-primary-50 px-3 py-1.5 rounded-lg">Novo</RouterLink>
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else-if="listings.length === 0" class="text-center py-16 px-4 bg-white m-4 rounded-2xl shadow-sm border border-gray-100">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Você não tem anúncios</h3>
      <p class="text-sm text-gray-500 mb-6">Comece desapegando ou divulgando seus serviços pro condomínio!</p>
      <RouterLink to="/new" class="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm">
        Criar Primeiro Anúncio
      </RouterLink>
    </div>

    <div v-else class="p-4 space-y-4">
      <div v-for="listing in listings" :key="listing.id" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible p-4 flex gap-4 relative">
        <!-- Photo -->
        <div class="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
          <img v-if="listing.photos && listing.photos.length > 0" :src="listing.photos[0]?.url" class="w-full h-full object-cover">
          <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-400">Sem Foto</div>
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" :class="statusColor(listing.status)">
              {{ listing.status }}
            </span>
          </div>
          <h3 class="font-bold text-gray-900 truncate mb-1">{{ listing.title }}</h3>
          
          <!-- Quick Status Changer -->
          <div class="mt-2 flex gap-2 w-full max-w-[200px]">
            <select 
              :value="listing.status" 
              @change="(e) => changeStatus(listing, (e.target as HTMLSelectElement).value)"
              class="text-xs border border-gray-300 rounded px-2 py-1 flex-1 bg-gray-50 outline-none focus:border-primary-500"
            >
              <option v-for="opt in getOptions(listing.type)" :key="opt.value" :value="opt.value">
                Mudar p/ {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2 items-end justify-between">
          <button @click="router.push(`/edit/${listing.id}`)" class="p-2 text-gray-400 hover:text-primary-600 transition-colors bg-gray-50 hover:bg-primary-50 rounded-lg" title="Editar Anúncio">
            <Edit2 class="w-4 h-4" />
          </button>
          <button @click="deleteListing(listing.id)" class="p-2 text-gray-400 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 rounded-lg" title="Excluir Anúncio">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
