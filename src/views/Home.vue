<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { listingsService, type Listing, type Category } from '../services/listings'
import CategoryChips from '../components/CategoryChips.vue'
import ListingCard from '../components/ListingCard.vue'

const tabs = [
  { label: 'Tudo', value: '' },
  { label: 'Vendas', value: 'VENDA' },
  { label: 'Doações', value: 'DOACAO' },
  { label: 'Serviços', value: 'SERVICO' }
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
    listings.value = await listingsService.getLatestActivListings(currentTab.value, currentCategory.value || undefined)
  } catch (error) {
    console.error('Error loading listings', error)
  } finally {
    loading.value = false
  }
}

watch([currentTab, currentCategory], () => {
  loadData()
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="bg-gray-50 min-h-full">
    <!-- Header / Branding -->
    <div class="px-4 py-4 bg-white border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
      <h1 class="text-2xl font-black text-primary-600 tracking-tight">Condomínio Store</h1>
    </div>

    <!-- Tabs -->
    <div class="bg-white px-2 pt-2 border-b border-gray-100">
      <div class="flex">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          @click="currentTab = tab.value"
          class="flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors"
          :class="currentTab === tab.value ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Categories -->
    <div class="bg-white pb-3 pt-2">
      <CategoryChips 
        :categories="categories" 
        :selectedId="currentCategory" 
        @select="(id) => currentCategory = id" 
      />
    </div>

    <!-- Feed -->
    <div class="p-4">
      <div v-if="loading" class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
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
