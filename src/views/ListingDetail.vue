<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listingsService, type Listing } from '../services/listings'
import { favoritesService } from '../services/favorites'
import { useAuthStore } from '../stores/auth'
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, MapPin, AlertTriangle } from 'lucide-vue-next'
import { useVisibilityRefetch } from '../composables/useVisibilityRefetch'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

useVisibilityRefetch(() => {
  loadListing()
})

const id = route.params.id as string
const listing = ref<(Listing & { owner: any }) | null>(null)
const loading = ref(true)
const isFavorite = ref(false)
const togglingFavorite = ref(false)
const currentImageIndex = ref(0)
const notFound = ref(false)
const showImageModal = ref(false)

const showReportModal = ref(false)
const reportingReason = ref('')
const reporting = ref(false)

const hasMultiplePhotos = computed(() => !!listing.value?.photos && listing.value.photos.length > 1)
const photosLength = computed(() => listing.value?.photos?.length || 0)
const activePhotoUrl = computed(() => {
  if (!listing.value?.photos) return ''
  return listing.value.photos[currentImageIndex.value]?.url || ''
})

function nextImage() {
  if (!listing.value || !listing.value.photos) return
  currentImageIndex.value = (currentImageIndex.value + 1) % listing.value.photos.length
}

function prevImage() {
  if (!listing.value || !listing.value.photos) return
  currentImageIndex.value = (currentImageIndex.value - 1 + listing.value.photos.length) % listing.value.photos.length
}

function openModal() {
  if (listing.value?.photos?.length) {
    showImageModal.value = true
  }
}

async function loadListing() {
  loading.value = true
  try {
    const data = await listingsService.getListingById(id)
    listing.value = data
    if (authStore.user) {
      isFavorite.value = await favoritesService.isFavorited(authStore.user.id, id)
    }
  } catch (error: any) {
    if (error.code === 'PGRST116') {
      notFound.value = true
    } else {
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

async function handleFavorite() {
  if (!authStore.user || !listing.value) return
  togglingFavorite.value = true
  try {
    const newState = await favoritesService.toggleFavorite(authStore.user.id, listing.value.id)
    isFavorite.value = newState
  } catch (err) {
    console.error(err)
  } finally {
    togglingFavorite.value = false
  }
}

function contactOwner() {
  if (!listing.value || !listing.value.owner.whatsapp) return
  const number = listing.value.owner.whatsapp.replace(/\D/g, '')
  const text = encodeURIComponent(`Olá, ${listing.value.owner.display_name}! Vi seu anúncio "${listing.value.title}" no Condomínio Store. Ainda está disponível?`)
  window.open(`https://wa.me/55${number}?text=${text}`, '_blank')
}

async function submitReport() {
  if (!authStore.user || !listing.value || !reportingReason.value.trim()) return
  reporting.value = true
  try {
    await listingsService.reportListing(listing.value.id, authStore.user.id, reportingReason.value.trim())
    alert('Denúncia enviada com sucesso ao síndico. Obrigado!')
    showReportModal.value = false
    reportingReason.value = ''
  } catch(e: any) {
    console.error(e)
    if (e.code === '23505') { // Unique constraint violation
       alert('Você já denunciou este anúncio.')
    } else {
       alert(`Erro ao enviar denúncia. Detalhes: ${e.message || 'Desconhecido'} (Código: ${e.code || 'N/A'})`)
    }
  } finally {
    reporting.value = false
  }
}

const formattedPrice = computed(() => {
  if (!listing.value) return ''
  if (listing.value.type === 'DOACAO') return 'Doação'
  if (listing.value.type === 'SERVICO') {
    if (listing.value.pricing_type === 'A_COMBINAR') return 'A combinar'
    if (!listing.value.price_cents) return 'Sob consulta'
    const value = (listing.value.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    return listing.value.pricing_type === 'POR_HORA' ? `${value}/h` : value
  }
  if (listing.value.price_cents) {
    return (listing.value.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  return ''
})

onMounted(() => {
  loadListing()
})
</script>

<template>
  <div class="bg-gray-50 min-h-full pb-20 md:pb-0">
    <!-- Header -->
    <header class="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <button @click="router.back()" class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
        <ChevronLeft class="w-6 h-6 text-gray-700" />
      </button>
      <div class="font-bold text-gray-900 truncate px-2 flex-1 text-center">
        {{ listing?.title || 'Detalhes' }}
      </div>
      <div class="flex items-center flex-shrink-0 -mr-2">
        <button v-if="authStore.user && listing?.owner_id !== authStore.user.id" @click="showReportModal = true" class="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Reportar Anúncio">
           <AlertTriangle class="w-5 h-5" />
        </button>
        <button @click="handleFavorite" :disabled="togglingFavorite" class="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50">
          <Heart class="w-6 h-6 transition-colors" :class="isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'" />
        </button>
      </div>
    </header>

    <div v-if="loading" class="pt-24 flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
    </div>
    
    <div v-else-if="notFound || !listing" class="pt-24 text-center py-16 px-4">
      <h3 class="text-xl font-bold text-gray-900 mb-6">Anúncio não encontrado</h3>
      <button @click="router.push('/')" class="w-full max-w-xs mx-auto bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95">
        Voltar para o Início
      </button>
    </div>

    <div v-else class="pt-[60px] max-w-2xl mx-auto bg-white min-h-screen shadow-sm">
      <!-- Image Gallery -->
      <div class="aspect-[4/3] bg-gray-100 relative group overflow-hidden" :class="{'grayscale opacity-60': listing.status === 'CONCLUIDO'}">
        <template v-if="listing.photos && listing.photos.length > 0">
          <img 
            :src="listing.photos[currentImageIndex]?.url" 
            :alt="listing.title"
            class="w-full h-full object-cover cursor-pointer transition-transform duration-500 hover:scale-105"
            @click="openModal"
          />
          
          <!-- Navigation Arrows -->
          <button v-if="hasMultiplePhotos" @click.stop="prevImage" class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 active:scale-95">
            <ChevronLeft class="w-6 h-6 -ml-1 text-white" />
          </button>
          <button v-if="hasMultiplePhotos" @click.stop="nextImage" class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 active:scale-95">
            <ChevronRight class="w-6 h-6 -mr-1 text-white" />
          </button>

          <!-- Dots -->
          <div v-if="hasMultiplePhotos" class="absolute bottom-3 left-0 w-full flex justify-center gap-1.5 z-10">
            <button 
              v-for="(_, idx) in listing.photos" 
              :key="idx" 
              @click.stop="currentImageIndex = idx"
              class="w-2 h-2 rounded-full transition-all"
              :class="currentImageIndex === idx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/90 shadow-sm'"
            ></button>
          </div>
        </template>
        <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
           Sem imagens
        </div>
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex gap-2 pointer-events-none z-10">
          <span class="px-2 py-1 rounded bg-black/60 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            {{ listing.type }}
          </span>
          <span v-if="listing.condition" class="px-2 py-1 rounded bg-white text-gray-900 text-xs font-bold uppercase tracking-wider shadow-sm">
            {{ listing.condition }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-5">
        <div class="flex items-center gap-2 mb-3">
          <span v-if="listing.category" class="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
            {{ listing.category.name }}
          </span>
          <span class="text-xs text-gray-500 font-medium">
            Postado em {{ new Date(listing.created_at).toLocaleDateString('pt-BR') }}
          </span>
        </div>
        
        <h1 class="text-2xl font-black text-gray-900 mb-2 line-clamp-2 leading-tight" :class="{'line-through': listing.status === 'CONCLUIDO'}">
          {{ listing.title }}
        </h1>
        
        <div class="text-3xl font-extrabold mb-6 tracking-tight" :class="listing.status === 'CONCLUIDO' ? 'text-gray-500' : 'text-green-600'">
          {{ formattedPrice }}
        </div>

        <div class="prose prose-sm max-w-none text-gray-600 mb-8 whitespace-pre-line">
          {{ listing.description }}
        </div>

        <!-- Vendor Info -->
        <div v-if="listing.status === 'CONCLUIDO'" class="border border-gray-100 rounded-2xl p-4 flex items-center justify-center gap-4 bg-gray-50/50 mb-8">
          <div class="text-center">
             <h3 class="font-bold text-gray-700">Anúncio Concluído</h3>
             <p class="text-xs text-gray-500 mt-1">Este anúncio não está mais recebendo ofertas ou contatos.</p>
          </div>
        </div>
        <template v-else>
          <div class="border border-gray-100 rounded-2xl p-4 flex items-center gap-4 bg-gray-50/50 mb-8" v-if="listing.owner && listing.show_contact !== false">
          <div class="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-500 text-lg">
            {{ listing.owner.avatar_url ? '' : (listing.owner.display_name?.charAt(0)?.toUpperCase() || 'U') }}
            <img v-if="listing.owner.avatar_url" :src="listing.owner.avatar_url" class="w-full h-full object-cover">
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-900 truncate">{{ listing.owner.display_name || 'Usuário' }}</h3>
            <div class="flex flex-col gap-1 text-xs text-gray-500 mt-1" v-if="listing.owner.house || listing.owner.site">
              <div v-if="listing.owner.house" class="flex items-center">
                <MapPin class="w-3 h-3 mr-1 inline" />
                <span>Casa {{ listing.owner.house }}</span>
              </div>
              <a v-if="listing.owner.site" :href="listing.owner.site.startsWith('http') ? listing.owner.site : 'https://' + listing.owner.site" target="_blank" class="text-green-600 hover:underline truncate break-all block">
                {{ listing.owner.site }}
              </a>
            </div>
          </div>
        </div>
        
        <div class="border border-gray-100 rounded-2xl p-4 flex items-center gap-4 bg-gray-50/50 mb-8" v-else>
          <div class="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-500 text-lg">
            U
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-900">Contato Oculto</h3>
            <p class="text-xs text-gray-500 mt-1">O anunciante optou por não exibir o contato.</p>
          </div>
          </div>
        </template>
        <!-- Removed Old Report Action from here -->
      </div>

      <!-- Fixed bottom CTA -->
      <div class="fixed bottom-16 md:bottom-0 md:sticky md:mt-10 left-0 w-full bg-white border-t border-gray-200 p-4 pb-safe flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <button 
          v-if="listing.status === 'CONCLUIDO'"
          disabled
          class="flex-1 bg-gray-200 text-gray-500 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm"
        >
          Anúncio Finalizado
        </button>
        <button 
          v-else-if="listing.owner?.whatsapp && listing.show_contact !== false"
          @click="contactOwner"
          class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
        >
          <MessageCircle class="w-5 h-5" />
          Whatsapp
        </button>
        <button 
          v-else
          disabled
          class="flex-1 bg-gray-200 text-gray-500 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition-colors"
        >
          Contato Indisponível
        </button>
      </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-xl">
      <!-- Close -->
      <button @click="showImageModal = false" class="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 z-[110]">
        <X class="w-6 h-6" />
      </button>
      
      <!-- Modal Navigation -->
      <button v-if="hasMultiplePhotos" @click.stop="prevImage" class="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 z-[110]">
        <ChevronLeft class="w-8 h-8 -ml-1 text-white" />
      </button>
      <button v-if="hasMultiplePhotos" @click.stop="nextImage" class="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-95 z-[110]">
        <ChevronRight class="w-8 h-8 -mr-1 text-white" />
      </button>

      <!-- Main Image inside Modal -->
      <div class="w-full h-full p-4 md:p-12 flex items-center justify-center relative" @click="showImageModal = false">
        <img 
          :src="activePhotoUrl" 
          class="max-w-full max-h-full object-contain select-none cursor-default"
          @click.stop
        />
      </div>
      
      <!-- Counter -->
      <div v-if="hasMultiplePhotos" class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white font-medium bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md text-sm z-[110]">
        {{ currentImageIndex + 1 }} / {{ photosLength }}
      </div>
    </div>

    <!-- Report Modal -->
    <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm" @click.self="showReportModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-5 animate-in fade-in zoom-in duration-200">
        <h3 class="text-lg font-black text-gray-900 mb-2 flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-red-500" /> Denunciar Anúncio
        </h3>
        <p class="text-sm text-gray-500 mb-4 leading-relaxed">
          Tem certeza que deseja denunciar este anúncio para o síndico? Por favor, descreva o motivo brevemente.
        </p>
        
        <textarea 
          v-model="reportingReason" 
          rows="3" 
          class="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4 resize-none"
          placeholder="Ex: Spam, Conteúdo Inadequado, Fraude..."
        ></textarea>
        
        <div class="flex gap-2">
          <button @click="showReportModal = false" class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">
            Cancelar
          </button>
          <button @click="submitReport" :disabled="reporting || !reportingReason.trim()" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center">
             <span v-if="reporting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
             <span v-else>Denunciar</span>
          </button>
        </div>
      </div>
    </div>
    </div> <!-- Close main v-else block -->
  </div>
</template>
