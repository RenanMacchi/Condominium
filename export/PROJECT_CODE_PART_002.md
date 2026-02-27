

---
## FILE: src/views/ResetPassword.vue
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const success = ref(false)

onMounted(async () => {
    // Check if we have the hash in the URL containing the access token
    const hash = window.location.hash
    if (!hash || !hash.includes('type=recovery')) {
        errorMsg.value = 'Link de recuperação inválido ou expirado.'
    }
})

async function handleSetNewPassword() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value
    })
    
    if (error) throw error
    
    await supabase.auth.signOut()
    success.value = true
  } catch (err: any) {
    errorMsg.value = err.message || 'Erro ao atualizar a senha'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
      
      <div v-if="success" class="text-center py-4">
        <h2 class="text-3xl font-extrabold text-green-600 mb-4">Sucesso!</h2>
        <p class="text-gray-700 mb-6 font-medium text-lg">Sua senha foi alterada com sucesso.</p>
        <p class="text-sm text-gray-500 mb-4">Clique no link abaixo para efetuar o login:</p>
        <a href="https://condominium-hazel.vercel.app/login" class="text-green-600 font-bold hover:underline break-all">
          https://condominium-hazel.vercel.app/login
        </a>
      </div>

      <div v-else>
        <div class="text-center mb-8">
          <h1 class="text-2xl font-extrabold text-green-600 mb-2">Redefinir Senha</h1>
          <p class="text-gray-500">Digite sua nova senha abaixo</p>
        </div>
      
      <form @submit.prevent="handleSetNewPassword" class="space-y-5">
        <div v-if="errorMsg" class="p-3 bg-red-100 text-red-700 text-sm rounded-lg">
          {{ errorMsg }}
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="••••••••"
          >
        </div>
        
        <button 
          type="submit" 
          :disabled="loading || !!errorMsg"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          <span v-if="loading">Aguarde...</span>
          <span v-else>Salvar Nova Senha</span>
        </button>
      </form>
      
        <div class="mt-6 text-center text-sm text-gray-600">
          <button @click="router.push('/login')" class="text-green-600 font-semibold hover:underline">
            Voltar para o login
          </button>
        </div>
      </div>
      
    </div>
  </div>
</template>

```


---
## FILE: src/views/Search.vue
```vue
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

```


---
## FILE: tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        }
      }
    },
  },
  plugins: [],
}

```


---
## FILE: tsconfig.app.json
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "types": ["vite/client"],

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}

```


---
## FILE: tsconfig.json
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```


---
## FILE: tsconfig.node.json
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "types": ["node"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}

```


---
## FILE: vercel.json
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}

```


---
## FILE: vite.config.ts
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
})

```
