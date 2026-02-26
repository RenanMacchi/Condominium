<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { favoritesService } from '../services/favorites'
import { useAuthStore } from '../stores/auth'
import type { Listing } from '../services/listings'
import ListingCard from '../components/ListingCard.vue'
import { useVisibilityRefetch } from '../composables/useVisibilityRefetch'

const authStore = useAuthStore()

useVisibilityRefetch(() => {
  if (authStore.user) {
    loadFavorites()
  }
})
const favorites = ref<Listing[]>([])
const loading = ref(true)

async function loadFavorites() {
  if (!authStore.user) return
  loading.value = true
  try {
    favorites.value = await favoritesService.getMyFavorites(authStore.user.id)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.user) {
    loadFavorites()
  }
})
</script>

<template>
  <div class="bg-gray-50 min-h-full p-4 pb-20 md:pb-4">
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Meus Favoritos</h1>
    
    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
    </div>
    
    <div v-else-if="favorites.length === 0" class="text-center py-16 px-4 bg-white rounded-2xl shadow-sm">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Heart class="w-8 h-8 text-gray-300" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 mb-2">Sem favoritos ainda</h3>
      <p class="text-sm text-gray-500 mb-6">Você ainda não curtiu nenhum anúncio.</p>
      <RouterLink to="/" class="bg-green-50 text-green-700 font-bold py-2 px-6 rounded-lg">
        Explorar Anúncios
      </RouterLink>
    </div>
    
    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <ListingCard 
        v-for="listing in favorites" 
        :key="listing.id" 
        :listing="listing" 
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Heart } from 'lucide-vue-next'
export default {
  components: { Heart }
}
</script>
