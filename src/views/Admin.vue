<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listingsService, type Listing } from '../services/listings'
import { useAuthStore } from '../stores/auth'
import { ShieldAlert, Trash2, CheckCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const reportedListings = ref<(Listing & { owner: any, reports: any[] })[]>([])
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    reportedListings.value = await listingsService.getReportedListings()
  } catch (err: any) {
    console.error(err)
    if (err.code === 'PGRST116' || String(err).includes('policy')) {
      alert('Acesso negado. Apenas administradores podem ver esta página.')
      router.replace('/')
    }
  } finally {
    loading.value = false
  }
}

async function dismiss(listingId: string) {
  if (!confirm('Deseja ignorar as denúncias e devolver a sanidade deste anúncio?')) return
  try {
    await listingsService.dismissReports(listingId)
    reportedListings.value = reportedListings.value.filter(l => l.id !== listingId)
  } catch (e) {
    console.error(e)
    alert('Erro ao perdoar denúncias')
  }
}

async function ban(listingId: string) {
  if (!confirm('Deseja excluir DEFINITIVAMENTE este anúncio e suas fotos? Esta ação não pode ser desfeita.')) return
  try {
    await listingsService.deleteListing(listingId)
    reportedListings.value = reportedListings.value.filter(l => l.id !== listingId)
    alert('Anúncio banido com sucesso.')
  } catch (e) {
    console.error(e)
    alert('Erro ao banir anúncio')
  }
}

onMounted(() => {
  if (!authStore.profile?.is_admin) {
    router.replace('/')
    return
  }
  loadData()
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-20 md:pb-10">
    <div class="px-4 py-4 bg-red-600 text-white sticky top-0 z-10 flex items-center gap-2 shadow-md">
      <ShieldAlert class="w-6 h-6" />
      <h1 class="text-xl font-bold">Painel de Moderação</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
    </div>
    
    <div v-else-if="reportedListings.length === 0" class="text-center py-16 px-4">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
        <CheckCircle class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 mb-2">Comunidade Segura!</h3>
      <p class="text-sm text-gray-500">Não há nenhum anúncio com denúncias ativas no momento.</p>
    </div>

    <div v-else class="p-4 space-y-4">
      <div 
        v-for="listing in reportedListings" 
        :key="listing.id" 
        class="bg-white rounded-xl shadow-sm border overflow-hidden"
        :class="listing.report_count && listing.report_count >= 5 ? 'border-red-300' : 'border-gray-200'"
      >
        <!-- Header -->
        <div class="p-3 border-b flex justify-between items-center bg-gray-50" :class="listing.report_count && listing.report_count >= 5 ? 'bg-red-50' : ''">
          <div class="flex items-center gap-2">
             <span class="font-bold text-red-600 flex items-center gap-1">
               <ShieldAlert class="w-4 h-4" /> 
               {{ listing.report_count }} Denúncia{{ listing.report_count === 1 ? '' : 's' }}
             </span>
             <span v-if="listing.report_count && listing.report_count >= 10" class="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Restrito do Público
             </span>
          </div>
          <span class="text-xs text-gray-500 font-medium">Postado por: {{ listing.owner?.display_name }}</span>
        </div>

        <!-- Body -->
        <div class="p-4 flex gap-4">
          <div class="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
            <img v-if="listing.photos && listing.photos.length > 0" :src="listing.photos[0]?.url" class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-400">Sem Foto</div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-900 truncate">{{ listing.title }}</h3>
            <p class="text-xs text-gray-500 mt-1 uppercase">{{ listing.type }} &bull; {{ listing.category?.name }}</p>
            <div class="mt-3">
              <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Motivos Recentes:</p>
              <ul class="text-xs text-gray-700 bg-gray-50 rounded p-2 italic space-y-1">
                 <li v-for="(rep, idx) in listing.reports.slice(0, 3)" :key="idx">- "{{ rep.reason }}"</li>
                 <li v-if="listing.reports.length > 3" class="text-[10px] text-gray-400 font-bold ml-1">... e mais {{ listing.reports.length - 3 }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
           <button @click="dismiss(listing.id)" class="flex-1 bg-white border border-gray-300 hover:bg-green-50 text-gray-700 hover:text-green-700 font-bold py-2 rounded-lg text-sm transition-colors shadow-sm">
             Perdoar Anúncio
           </button>
           <button @click="ban(listing.id)" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-1">
             <Trash2 class="w-4 h-4" />
             Banir 
           </button>
        </div>
      </div>
    </div>
  </div>
</template>
