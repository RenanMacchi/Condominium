<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listingsService } from '../services/listings'
import type { ListingWithOwner } from '../types'
import { favoritesService } from '../services/favorites'
import { useAuth } from '../composables/useAuth'
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, MapPin, AlertTriangle, Moon, Sun } from 'lucide-vue-next'
import { useVisibilityRefetch } from '../composables/useVisibilityRefetch'
import { toast } from 'vue-sonner'
import { isListingOpen } from '../utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

useVisibilityRefetch(() => {
  loadListing()
})

const id = computed(() => route.params.id as string)
const listing = ref<ListingWithOwner | null>(null)
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
    const data = await listingsService.getListingById(id.value)
    listing.value = data
    if (auth.user.value) {
      isFavorite.value = await favoritesService.isFavorited(auth.user.value.id, id.value)
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
  if (!auth.user.value || !listing.value) return
  togglingFavorite.value = true
  try {
    const newState = await favoritesService.toggleFavorite(auth.user.value.id, listing.value.id)
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
  if (!auth.user.value || !listing.value || !reportingReason.value.trim()) return
  reporting.value = true
  try {
    await listingsService.reportListing(listing.value.id, auth.user.value.id, reportingReason.value.trim())
    toast.success('Denúncia enviada com sucesso ao síndico. Obrigado!')
    showReportModal.value = false
    reportingReason.value = ''
  } catch(e: any) {
    console.error(e)
    if (e.code === '23505') { // Unique constraint violation
       toast.error('Você já denunciou este anúncio.')
    } else {
       toast.error(`Erro ao enviar denúncia. Detalhes: ${e.message || 'Desconhecido'} (Código: ${e.code || 'N/A'})`)
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
  if (listing.value.type === 'VENDA' && !listing.value.price_cents) {
    return 'Preço sob consulta'
  }
  if (listing.value.price_cents) {
    return (listing.value.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  return ''
})

const isOpen = computed(() => {
  if (!listing.value) return true
  return isListingOpen(listing.value)
})

const businessDaysText = computed(() => {
  if (!listing.value || !listing.value.has_business_hours || !listing.value.business_days?.length) return ''
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const sortedDays = [...listing.value.business_days].sort()
  
  if (sortedDays.length === 7) return 'Todos os dias'
  if (sortedDays.length === 5 && sortedDays[0] === 1 && sortedDays[4] === 5) return 'Segunda a Sexta'
  
  return sortedDays.map(d => weekDays[d]).join(', ')
})

const openTimeText = computed(() => {
  if (!listing.value || !listing.value.open_time) return ''
  return listing.value.open_time.substring(0, 5)
})

const closeTimeText = computed(() => {
  if (!listing.value || !listing.value.close_time) return ''
  return listing.value.close_time.substring(0, 5)
})

watch(id, () => {
  loadListing()
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
        <button v-if="auth.user.value && listing?.owner_id !== auth.user.value.id" @click="showReportModal = true" class="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Reportar Anúncio">
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
            {{ listing.type === 'DOACAO' && listing.is_donation_request ? 'PEDIDO DE DOAÇÃO' : listing.type }}
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

        <div v-if="listing.has_business_hours && (listing.type === 'VENDA' || listing.type === 'SERVICO')" class="mb-6 p-4 rounded-xl shadow-sm border" :class="isOpen ? 'bg-green-50 border-green-100' : 'bg-gray-100 border-gray-200'">
          <div class="flex items-center gap-2 mb-2">
             <Sun v-if="isOpen" class="w-5 h-5 text-green-600" />
             <Moon v-else class="w-5 h-5 text-gray-500" />
             <span class="font-bold" :class="isOpen ? 'text-green-800' : 'text-gray-700'">{{ isOpen ? 'Aberto Agora' : 'Fechado Agora' }}</span>
          </div>
          <div class="text-sm" :class="isOpen ? 'text-green-700' : 'text-gray-600'">
            <p><span class="font-semibold">Dias:</span> {{ businessDaysText }}</p>
            <p><span class="font-semibold">Horário:</span> {{ openTimeText }} às {{ closeTimeText }}</p>
          </div>
        </div>

        <div class="prose prose-sm max-w-none text-gray-600 mb-8 whitespace-pre-line">
          {{ listing.description }}
        </div>

        <!-- Campanhas Info -->
        <div v-if="listing.type === 'CAMPANHA' && (listing.campaign_link || listing.campaign_location)" class="bg-blue-50 p-4 rounded-xl mb-8 space-y-3 border border-blue-100">
           <h3 class="font-bold text-blue-900 flex items-center gap-2">Detalhes da Campanha</h3>
           <a v-if="listing.campaign_link" :href="listing.campaign_link.startsWith('http') ? listing.campaign_link : 'https://' + listing.campaign_link" target="_blank" class="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-800 hover:underline">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              Acessar Link da Campanha
           </a>
           <div v-if="listing.campaign_location" class="flex items-center gap-2 text-sm text-blue-700 w-full overflow-hidden">
              <MapPin class="w-4 h-4 flex-shrink-0" />
              <span class="truncate" :title="listing.campaign_location">{{ listing.campaign_location }}</span>
              <a v-if="listing.campaign_location.startsWith('http')" :href="listing.campaign_location" target="_blank" class="underline flex-shrink-0 font-semibold hover:text-blue-800">(Ver no Mapa)</a>
           </div>
        </div>

        <!-- Extra Contacts -->
        <div v-if="listing.extra_links?.length || listing.extra_whatsapps?.length" class="mb-8 mt-8 space-y-4">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Contatos Adicionais</h3>
          <div class="flex flex-wrap gap-2">
            <a v-for="(link, idx) in listing.extra_links" :key="'ex-link-'+idx" :href="link.startsWith('http') ? link : 'https://' + link" target="_blank" class="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors border border-blue-100">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              Link {{ idx + 1 }}
            </a>
            <a v-for="(wpp, idx) in listing.extra_whatsapps" :key="'ex-wpp-'+idx" :href="`https://wa.me/55${wpp.replace(/\D/g, '')}`" target="_blank" class="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors border border-green-100">
              <MessageCircle class="w-4 h-4" />
              {{ wpp }}
            </a>
          </div>
        </div>

        <!-- Vendor Info -->
        <div class="mb-8 mt-10">
          <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">Sobre o Anunciante</h3>
          
          <div v-if="listing.status === 'CONCLUIDO'" class="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-center gap-4 shadow-sm">
            <div class="text-center">
               <h3 class="font-bold text-gray-700">Anúncio Concluído</h3>
               <p class="text-xs text-gray-500 mt-1">Este anúncio não está mais recebendo ofertas ou contatos.</p>
            </div>
          </div>
          
          <template v-else>
            <div class="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm" v-if="listing.owner && listing.show_contact !== false">
              <div class="w-14 h-14 bg-gray-100 border border-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-500 text-xl shadow-inner">
                {{ listing.owner.avatar_url ? '' : (listing.owner.display_name?.charAt(0)?.toUpperCase() || 'U') }}
                <img v-if="listing.owner.avatar_url" :src="listing.owner.avatar_url" class="w-full h-full object-cover">
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-900 text-lg leading-tight truncate">{{ listing.owner.display_name || 'Usuário' }}</h3>
                <div class="flex flex-col gap-1.5 text-sm text-gray-600 mt-2" v-if="listing.owner.house || listing.owner.site">
                  <div v-if="listing.owner.house" class="flex items-center gap-1.5">
                    <MapPin class="w-4 h-4 text-gray-400" />
                    <span>Casa <strong class="text-gray-900">{{ listing.owner.house }}</strong></span>
                  </div>
                  <a v-if="listing.owner.site" :href="listing.owner.site.startsWith('http') ? listing.owner.site : 'https://' + listing.owner.site" target="_blank" class="text-green-600 hover:text-green-700 font-medium hover:underline flex items-center gap-1.5 truncate">
                    <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                    <span class="truncate">{{ listing.owner.site.replace(/^https?:\/\//, '') }}</span>
                  </a>
                </div>
              </div>
            </div>
            
            <div class="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm" v-else>
              <div class="w-14 h-14 bg-gray-100 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-400 text-xl border border-gray-200 shadow-inner">
                ?
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-gray-900 text-lg">Contato Oculto</h3>
                <p class="text-sm text-gray-500 mt-1">O anunciante optou por não exibir o seu perfil neste anúncio.</p>
              </div>
            </div>
          </template>
        </div>
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
