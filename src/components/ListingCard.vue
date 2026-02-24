<script setup lang="ts">
import { computed } from 'vue'
import type { Listing } from '../services/listings'
import { useAuthStore } from '../stores/auth'
import { Edit2, Heart } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const props = defineProps<{
  listing: Listing
}>()

const formattedPrice = computed(() => {
  if (props.listing.type === 'DOACAO') return 'Doação'
  if (props.listing.type === 'SERVICO') {
    if (props.listing.pricing_type === 'A_COMBINAR') return 'A combinar'
    if (!props.listing.price_cents) return 'Sob consulta'
    const value = (props.listing.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    return props.listing.pricing_type === 'POR_HORA' ? `${value}/h` : value
  }
  if (props.listing.price_cents) {
    return (props.listing.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
  return ''
})

const coverPhoto = computed(() => {
  if (props.listing.photos && props.listing.photos.length > 0) {
    return props.listing.photos[0]?.url
  }
  return 'https://via.placeholder.com/300?text=Sem+Foto'
})

const badgeColor = computed(() => {
  if (props.listing.type === 'VENDA') return 'bg-blue-100 text-blue-800'
  if (props.listing.type === 'DOACAO') return 'bg-emerald-100 text-emerald-800'
  return 'bg-purple-100 text-purple-800'
})
</script>

<template>
  <RouterLink :to="`/listing/${listing.id}`" class="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow active:scale-[0.98]">
    <div class="aspect-square w-full bg-gray-100 relative">
      <img :src="coverPhoto" :alt="listing.title" class="w-full h-full object-cover transition-all" :class="{'grayscale opacity-50': listing.status === 'CONCLUIDO'}" />
      <div class="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm" :class="badgeColor">
        {{ listing.type }}
      </div>

      <!-- Favorites Badge -->
      <div v-if="listing.favorites_count && listing.favorites_count > 0" class="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
        <Heart class="w-3 h-3 fill-white" />
        {{ listing.favorites_count }}
      </div>
      
      <!-- Edit Button overlay if Owner -->
      <button 
        v-if="authStore.user && listing.owner_id === authStore.user.id"
        @click.prevent="router.push(`/edit/${listing.id}`)"
        class="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-green-600 rounded-full shadow-sm backdrop-blur-sm transition-all active:scale-95 z-10"
        title="Editar Anúncio"
      >
        <Edit2 class="w-4 h-4" />
      </button>
    </div>
    
    <div class="p-3" :class="{'opacity-60': listing.status === 'CONCLUIDO'}">
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
