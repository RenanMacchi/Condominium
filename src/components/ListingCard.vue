<script setup lang="ts">
import { computed } from 'vue'
import type { Listing } from '../types'
import { formatPrice, isListingOpen } from '../utils/format'
import { useAuth } from '../composables/useAuth'
import { Edit2, Heart, Moon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const auth = useAuth()
const router = useRouter()

const props = defineProps<{
  listing: Listing
}>()

const formattedPrice = computed(() => {
  if (!props.listing.price_cents && props.listing.type === 'SERVICO' && props.listing.pricing_type !== 'A_COMBINAR') return 'Sob consulta'
  return formatPrice(props.listing)
})

const coverPhoto = computed(() => {
  if (props.listing.photos && props.listing.photos.length > 0) {
    return props.listing.photos[0]?.url
  }
  return 'https://via.placeholder.com/300?text=Sem+Foto'
})

const badgeColor = computed(() => {
  if (props.listing.type === 'DOACAO') return props.listing.is_donation_request ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'
  if (props.listing.type === 'CAMPANHA') return 'bg-yellow-100 text-yellow-800'
  if (props.listing.type === 'VENDA') return 'bg-blue-100 text-blue-800'
  return 'bg-purple-100 text-purple-800'
})

const isOpen = computed(() => isListingOpen(props.listing))
</script>

<template>
  <RouterLink :to="`/listing/${listing.id}`" class="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
    <div class="aspect-square w-full bg-gray-100 relative">
      <img :src="coverPhoto" :alt="listing.title" class="w-full h-full object-cover transition-all" :class="{'grayscale opacity-50': listing.status === 'CONCLUIDO' || !isOpen}" />
      <div class="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm" :class="badgeColor">
        {{ listing.type === 'DOACAO' && listing.is_donation_request ? 'PEDIDO DE DOAÇÃO' : listing.type }}
      </div>

      <!-- Closed Badge -->
      <div v-if="!isOpen && listing.status !== 'CONCLUIDO'" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-md text-white px-3 py-2 rounded-xl text-sm font-bold flex flex-col items-center gap-1 shadow-lg z-10">
        <Moon class="w-5 h-5 fill-white" />
        Fechado
      </div>

      <!-- Favorites Badge -->
      <div v-if="listing.favorites_count && listing.favorites_count > 0" class="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
        <Heart class="w-3 h-3 fill-white" />
        {{ listing.favorites_count }}
      </div>
      
      <!-- Edit Button overlay if Owner -->
      <button 
        v-if="auth.user.value && listing.owner_id === auth.user.value.id"
        @click.prevent="router.push(`/edit/${listing.id}`)"
        class="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-green-600 rounded-full shadow-sm backdrop-blur-sm transition-all active:scale-95 z-10"
        title="Editar Anúncio"
      >
        <Edit2 class="w-4 h-4" />
      </button>
    </div>
    
    <div class="p-3" :class="{'opacity-60': listing.status === 'CONCLUIDO' || !isOpen}">
      <p v-if="listing.category?.name" class="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">
        {{ listing.category.name }}
      </p>
      <h3 class="font-semibold text-gray-900 leading-tight mb-2 line-clamp-2" :class="{'line-through': listing.status === 'CONCLUIDO'}">
        {{ listing.title }}
      </h3>
      <div class="flex items-center justify-between">
        <span class="font-extrabold text-lg tracking-tight" :class="listing.status === 'CONCLUIDO' ? 'text-gray-500' : 'text-green-600'">
          {{ formattedPrice }}
        </span>
        <span v-if="listing.condition" class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {{ listing.condition }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
