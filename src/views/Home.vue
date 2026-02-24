<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { listingsService, type Listing, type Category } from '../services/listings'
import CategoryChips from '../components/CategoryChips.vue'
import ListingCard from '../components/ListingCard.vue'

import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const tabs = [
  { label: 'Tudo', value: '' },
  { label: 'Vendas', value: 'VENDA' },
  { label: 'Doações', value: 'DOACAO' },
  { label: 'Serviços', value: 'SERVICO' },
  { label: 'Meus', value: 'MEUS' },
  { label: 'Concluídos', value: 'CONCLUIDOS' }
]

const currentTab = ref('')
const categories = ref<Category[]>([])
const currentCategory = ref<number | null>(null)
const listings = ref<Listing[]>([])
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    if (categories.value.length === 0) {
      categories.value = await listingsService.getCategories()
    }
    
    if (currentTab.value === 'MEUS' && authStore.user) {
      // Load user specific listings (bypassing active only filter)
      listings.value = await listingsService.getMyListings(authStore.user.id)
    } else if (currentTab.value === 'CONCLUIDOS') {
      listings.value = await listingsService.getLatestActivListings(undefined, currentCategory.value || undefined, 'CONCLUIDO')
    } else {
      listings.value = await listingsService.getLatestActivListings(currentTab.value, currentCategory.value || undefined, 'ATIVO')
    }
  } catch (error) {
    console.error('Error loading listings', error)
  } finally {
    loading.value = false
  }
}

watch([currentTab, currentCategory], () => {
  loadData()
})

const showFilters = ref(true)
let lastScrollY = 0

function handleScroll() {
  const currentScrollY = window.scrollY
  if (currentScrollY <= 60) {
    showFilters.value = true
  } else if (currentScrollY > lastScrollY) {
    showFilters.value = false // scrolling down
  } else {
    showFilters.value = true // scrolling up
  }
  lastScrollY = currentScrollY
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  loadData()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="bg-gray-50 min-h-full">
    <!-- Header / Branding -->
    <div class="px-4 py-4 bg-white flex justify-between items-center text-center border-b border-gray-100">
      <h1 class="text-2xl font-black text-green-600 tracking-tight w-full">Condomínio Store</h1>
    </div>

    <!-- Sticky Filters -->
    <div 
      class="sticky top-0 z-20 bg-white transition-transform duration-300 ease-in-out shadow-sm"
      :class="showFilters ? 'translate-y-0' : '-translate-y-full'"
    >
      <!-- Tabs -->
      <div class="px-2 pt-2 border-b border-gray-100 overflow-x-auto hide-scrollbar">
        <div class="flex pb-2">
          <button 
            v-for="tab in tabs" 
            :key="tab.value"
            @click="currentTab = tab.value"
            class="flex-shrink-0 px-4 py-2 text-sm font-bold text-center border-b-2 transition-colors whitespace-nowrap"
            :class="currentTab === tab.value ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Categories -->
      <div class="pb-3 pt-2">
        <CategoryChips 
          :categories="categories" 
          :selectedId="currentCategory" 
          @select="(id) => currentCategory = id" 
        />
      </div>
    </div>

    <!-- Feed -->
    <div class="p-4">
      <div v-if="loading" class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
      
      <div v-else-if="listings.length === 0" class="text-center py-16 px-4">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Nenhum anúncio encontrado</h3>
        <p class="text-sm text-gray-500">Tente mudar os filtros ou categorias para ver mais resultados.</p>
      </div>
      
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ListingCard 
          v-for="listing in listings" 
          :key="listing.id" 
          :listing="listing" 
        />
      </div>
    </div>
  </div>
</template>
