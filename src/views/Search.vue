<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listingsService, type Listing, type Category } from '../services/listings'
import ListingCard from '../components/ListingCard.vue'
import { Search as SearchIcon, Filter } from 'lucide-vue-next'
import { useVisibilityRefetch } from '../composables/useVisibilityRefetch'

const query = ref('')
const selectedType = ref('')
const selectedCategory = ref<number | null>(null)

useVisibilityRefetch(() => {
  if (hasSearched.value || query.value) {
    doSearch()
  }
})

const categories = ref<Category[]>([])
const results = ref<Listing[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const showFilters = ref(false)

async function doSearch() {
  loading.value = true
  hasSearched.value = true
  try {
    results.value = await listingsService.searchListings(query.value, {
      type: selectedType.value || undefined,
      category_id: selectedCategory.value || undefined
    })
  } catch (error) {
    console.error('Search error', error)
  } finally {
    loading.value = false
    showFilters.value = false
  }
}

function clearFilters() {
  selectedType.value = ''
  selectedCategory.value = null
  query.value = ''
  results.value = []
  hasSearched.value = false
}

onMounted(async () => {
  categories.value = await listingsService.getCategories()
  // auto trigger search if needed, or empty state
  doSearch()
})
</script>

<template>
  <div class="bg-gray-50 min-h-full pb-20 md:pb-10 font-sans">
    
    <!-- Header Component & Search Input -->
    <div class="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm px-4 pt-4 pb-3">
      <form @submit.prevent="doSearch" class="flex gap-2">
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon class="h-5 w-5 text-gray-400" />
          </div>
          <input 
            v-model="query" 
            type="search" 
            class="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            placeholder="Buscar produtos, serviços..." 
          />
        </div>
        <button 
          type="button" 
          @click="showFilters = !showFilters"
          class="p-3 bg-gray-100 hover:bg-gray-200 border-none text-gray-600 font-bold rounded-xl transition-colors relative"
        >
          <Filter class="w-5 h-5" />
          <span v-if="selectedType || selectedCategory" class="absolute top-1 right-1 w-2.5 h-2.5 bg-green-600 rounded-full border border-white"></span>
        </button>
      </form>

      <!-- Expandable Filters Panel -->
      <div v-if="showFilters" class="mt-4 pt-4 border-t border-gray-100 space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Tipo</label>
          <div class="flex gap-2">
            <button type="button" @click="selectedType = ''" :class="!selectedType ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'" class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1">Tudo</button>
            <button type="button" @click="selectedType = 'VENDA'" :class="selectedType === 'VENDA' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'" class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1">Venda</button>
            <button type="button" @click="selectedType = 'SERVICO'" :class="selectedType === 'SERVICO' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'" class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1">Serviços</button>
            <button type="button" @click="selectedType = 'DOACAO'" :class="selectedType === 'DOACAO' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'" class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1">Doações</button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Categoria</label>
          <select v-model="selectedCategory" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-green-500">
            <option :value="null">Todas as Categorias</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button @click="clearFilters" class="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Limpar</button>
          <button @click="doSearch" class="flex-[2] py-3 text-sm font-bold text-white bg-green-600 rounded-xl shadow-md hover:bg-green-700">Aplicar Filtros</button>
        </div>
      </div>
    </div>

    <!-- Results Area -->
    <div class="p-4">
      <div v-if="loading" class="flex justify-center py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
      
      <div v-else-if="hasSearched && results.length === 0" class="text-center py-16 px-4">
        <div class="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4">
          <SearchIcon class="w-8 h-8 text-gray-300" />
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-2">Nenhum resultado</h3>
        <p class="text-sm text-gray-500 mb-6">Não encontramos nada para a sua busca ou filtros atuais.</p>
        <button @click="clearFilters(); doSearch()" class="text-green-600 font-bold hover:underline">Limpar busca</button>
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <ListingCard 
          v-for="listing in results" 
          :key="listing.id" 
          :listing="listing" 
        />
      </div>
    </div>
  </div>
</template>
