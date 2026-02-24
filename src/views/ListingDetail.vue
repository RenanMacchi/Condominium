<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listingsService, type Listing } from '../services/listings'
import { favoritesService } from '../services/favorites'
import { useAuthStore } from '../stores/auth'
import { ChevronLeft, Heart, MessageCircle, MapPin } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const id = route.params.id as string
const listing = ref<(Listing & { owner: any }) | null>(null)
const loading = ref(true)
const isFavorite = ref(false)
const togglingFavorite = ref(false)
const currentImageIndex = ref(0)
const notFound = ref(false)

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
    <header class="fixed top-0 w-full z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <button @click="router.back()" class="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
        <ChevronLeft class="w-6 h-6 text-gray-700" />
      </button>
      <div class="font-bold text-gray-900 truncate px-4 flex-1 text-center">
        {{ listing?.title || 'Detalhes' }}
      </div>
      <button @click="handleFavorite" :disabled="togglingFavorite" class="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50">
        <Heart class="w-6 h-6 transition-colors" :class="isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'" />
      </button>
    </header>

    <div v-if="loading" class="pt-24 flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else-if="notFound || !listing" class="pt-24 text-center py-16 px-4">
      <h3 class="text-xl font-bold text-gray-900 mb-6">Anúncio não encontrado</h3>
      <button @click="router.push('/')" class="w-full max-w-xs mx-auto bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95">
        Voltar para o Início
      </button>
    </div>

    <div v-else class="pt-[60px] max-w-2xl mx-auto bg-white min-h-screen shadow-sm">
      <!-- Image Gallery -->
      <div class="aspect-[4/3] bg-gray-100 relative group">
        <img 
          v-if="listing.photos && listing.photos.length > 0"
          :src="listing.photos[currentImageIndex]?.url" 
          :alt="listing.title"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
           Sem imagens
        </div>
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex gap-2">
          <span class="px-2 py-1 rounded bg-black/60 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
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
          <span v-if="listing.category" class="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
            {{ listing.category.name }}
          </span>
          <span class="text-xs text-gray-500 font-medium">
            Postado em {{ new Date(listing.created_at).toLocaleDateString('pt-BR') }}
          </span>
        </div>
        
        <h1 class="text-2xl font-black text-gray-900 mb-2 line-clamp-2 leading-tight">
          {{ listing.title }}
        </h1>
        
        <div class="text-3xl font-extrabold text-primary-600 mb-6 tracking-tight">
          {{ formattedPrice }}
        </div>

        <div class="prose prose-sm max-w-none text-gray-600 mb-8 whitespace-pre-line">
          {{ listing.description }}
        </div>

        <!-- Vendor Info -->
        <div class="border border-gray-100 rounded-2xl p-4 flex items-center gap-4 bg-gray-50/50 mb-8" v-if="listing.owner">
          <div class="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-500 text-lg">
            {{ listing.owner.avatar_url ? '' : (listing.owner.display_name?.charAt(0)?.toUpperCase() || 'U') }}
            <img v-if="listing.owner.avatar_url" :src="listing.owner.avatar_url" class="w-full h-full object-cover">
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-900">{{ listing.owner.display_name || 'Usuário' }}</h3>
            <div class="flex text-xs text-gray-500 mt-1" v-if="listing.owner.block || listing.owner.apartment">
              <MapPin class="w-3 h-3 mr-1 inline" />
              <span v-if="listing.owner.block">Bloco {{ listing.owner.block }} </span>
              <span v-if="listing.owner.apartment" class="ml-1">Apto {{ listing.owner.apartment }}</span>
            </div>
          </div>
        </div>
        
        <div class="border border-gray-100 rounded-2xl p-4 flex items-center gap-4 bg-gray-50/50 mb-8" v-else>
          <div class="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-gray-500 text-lg">
            U
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-gray-900">Usuário Desconhecido</h3>
          </div>
        </div>

      </div>

      <!-- Fixed bottom CTA -->
      <div class="fixed bottom-16 md:bottom-0 md:sticky md:mt-10 left-0 w-full bg-white border-t border-gray-200 p-4 pb-safe flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <button 
          v-if="listing.owner?.whatsapp"
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
          Telefone não informado
        </button>
      </div>

    </div>
  </div>
</template>
