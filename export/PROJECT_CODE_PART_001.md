

---
## FILE: index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="data:," />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>condominio</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>

```


---
## FILE: package.json
```json
{
  "name": "condominio",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.97.0",
    "date-fns": "^4.1.0",
    "lucide-vue-next": "^0.575.0",
    "pinia": "^3.0.4",
    "vue": "^3.5.25",
    "vue-router": "^5.0.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.1",
    "@types/node": "^24.10.1",
    "@vitejs/plugin-vue": "^6.0.2",
    "@vue/tsconfig": "^0.8.1",
    "autoprefixer": "^10.4.24",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.2.1",
    "typescript": "~5.9.3",
    "vite": "^7.3.1",
    "vue-tsc": "^3.1.5"
  }
}

```


---
## FILE: postcss.config.js
```javascript
export default {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {},
    },
}

```


---
## FILE: src/App.vue
```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { supabase } from './lib/supabaseClient'
import BottomNavigation from './components/BottomNavigation.vue'

const authStore = useAuthStore()
const route = useRoute()

const visibilityHandler = () => {
  if (document.visibilityState === 'visible') {
    // Forcing a getSession call unblocks any suspended gotrue-js internal HTTP queues 
    // preventing the infinite "silent failed fetch" bug you experienced.
    supabase.auth.getSession().catch(console.error)
  }
}

onMounted(() => {
  // Initialization is now guaranteed by the Vue Router guard
console.log("To iniciando no App.vue")
  // Aggressive protection against Supabase auth token lock freezes on mobile tab-wake
  document.addEventListener('visibilitychange', visibilityHandler)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', visibilityHandler)
})
</script>

<template>
  <div class="min-h-[100dvh] w-full bg-gray-50 pb-[env(safe-area-inset-bottom,0)]">
    <div v-if="authStore.loading" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
    <main v-else class="pb-16">
      <RouterView />
    </main>
    
    <div v-if="!authStore.loading && route.path !== '/login' && route.path !== '/reset-password'" class="fixed bottom-0 left-0 w-full z-50">
      <BottomNavigation />
    </div>
  </div>
</template>

```


---
## FILE: src/components/BottomNavigation.vue
```vue
<script setup lang="ts">
import { Home, Search, PlusCircle, Heart, User } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { name: 'Início', path: '/', icon: Home },
  { name: 'Buscar', path: '/search', icon: Search },
  { name: 'Anunciar', path: '/new', icon: PlusCircle },
  { name: 'Favoritos', path: '/favorites', icon: Heart },
  { name: 'Perfil', path: '/profile', icon: User },
]
</script>

<template>
  <nav class="bg-white border-t border-gray-200 pb-safe">
    <div class="flex justify-around items-center h-16">
      <RouterLink 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors"
        :class="route.path === item.path ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'"
      >
        <component :is="item.icon" class="w-6 h-6 mb-1" :class="route.path === item.path ? 'stroke-[2.5px]' : 'stroke-2'" />
        <span>{{ item.name }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
/* Support for iOS safe area if needed */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>

```


---
## FILE: src/components/CategoryChips.vue
```vue
<script setup lang="ts">
import type { Category } from '../services/listings'

defineProps<{
  categories: Category[]
  selectedId: number | null
}>()

defineEmits<{
  (e: 'select', id: number | null): void
}>()
</script>

<template>
  <div class="flex overflow-x-auto hide-scrollbar gap-2 py-2 px-4">
    <button 
      @click="$emit('select', null)"
      class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors"
      :class="selectedId === null ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'"
    >
      Todos
    </button>
    <button 
      v-for="cat in categories" 
      :key="cat.id"
      @click="$emit('select', cat.id)"
      class="whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors"
      :class="selectedId === cat.id ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'"
    >
      {{ cat.name }}
    </button>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

```


---
## FILE: src/components/ListingCard.vue
```vue
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

```


---
## FILE: src/composables/useVisibilityRefetch.ts
```typescript
import { onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

export function useVisibilityRefetch(refetchFn: () => void | Promise<void>) {
    let isFetching = false

    const execute = async () => {
        if (isFetching) return
        isFetching = true
        try {
            // Force token refresh if needed BEFORE fetching data
            // This prevents race conditions where the fetch fails due to an expired token
            // right before the background session recovery completes.
            await supabase.auth.getSession()
            await refetchFn()
        } catch (e) {
            console.error('Visibility refetch error:', e)
        } finally {
            isFetching = false
        }
    }

    const handleVisibilityChange = () => {
        // Only trigger when document becomes visible and is not hidden
        if (document.visibilityState === 'visible' && !document.hidden) {
            execute()
        }
    }

    const handleFocus = () => {
        // Also handle window focus as a fallback for some browsers
        if (!document.hidden) {
            execute()
        }
    }

    const handlePageShow = (e: any) => {
        // Handle restoration from bfcache (Back-Forward Cache)
        if (e.persisted) {
            execute()
        }
    }

    onMounted(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)
        window.addEventListener('pageshow', handlePageShow)
    })

    onUnmounted(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('pageshow', handlePageShow)
    })
}

```


---
## FILE: src/lib/supabaseClient.ts
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Ensure .env is configured correctly.')
}

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    const isStorage = urlString.includes('/storage/v1/');
    const timeoutMs = isStorage ? 60000 : 12000; // Give uploads 60s, DB queries 12s

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (err: any) {
        clearTimeout(id);
        if (err.name === 'AbortError' && typeof window !== 'undefined') {
            console.error(`Supabase network freeze detected. Forcing recovery reload...`);
            // If the tab woke up and TCP connections are dead, force reloading the DOM cures it.
            window.location.reload();
        }
        throw err;
    }
};

const globalForSupabase = globalThis as unknown as {
    supabase: ReturnType<typeof createClient> | undefined
}

export const supabase = globalForSupabase.supabase || createClient(supabaseUrl || '', supabaseAnonKey || '', {
    global: {
        fetch: customFetch
    }
})

if (import.meta.env.DEV) {
    globalForSupabase.supabase = supabase
}

```


---
## FILE: src/main.ts
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')

```


---
## FILE: src/router/index.ts
```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabaseClient'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: () => import('../views/Home.vue') },
        { path: '/search', component: () => import('../views/Search.vue') },
        { path: '/login', component: () => import('../views/Login.vue') },
        { path: '/reset-password', component: () => import('../views/ResetPassword.vue'), meta: { requiresAuth: false } },
        { path: '/listing/:id', component: () => import('../views/ListingDetail.vue') },
        { path: '/edit/:id', component: () => import('../views/EditListing.vue'), meta: { requiresAuth: true } },
        { path: '/new', component: () => import('../views/NewListing.vue'), meta: { requiresAuth: true } },
        { path: '/me', component: () => import('../views/MyListings.vue'), meta: { requiresAuth: true } },
        { path: '/favorites', component: () => import('../views/Favorites.vue'), meta: { requiresAuth: true } },
        { path: '/profile', component: () => import('../views/Profile.vue'), meta: { requiresAuth: true } },
        { path: '/admin', component: () => import('../views/Admin.vue'), meta: { requiresAuth: true } }
    ]
})

// Route Guard
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // Ensure the app's auth state is loaded ONCE on hard refresh before evaluating any route.
    if (!authStore.initialized) {
        try {
            await Promise.race([
                authStore.initialize(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Init Timeout')), 5000))
            ])
        } catch (e) {
            console.warn('Auth initialization timed out, forcing reload to clear locks');
            window.location.reload();
            return;
        }
    }

    // Always use the store's user. If the store lost track (e.g. background tab), fallback to checking the local session synchronously.
    let user = authStore.user
    if (!user) {
        try {
            const { data: { session } } = await Promise.race([
                supabase.auth.getSession(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Session Timeout')), 3000))
            ]) as any
            user = session?.user || null
        } catch (e) {
            console.warn('Auth session check timed out, forcing reload to clear locks');
            window.location.reload();
            return;
        }
    }

    // Intercept Supabase Recovery Link (arrives as hash on root usually)
    if (to.hash.includes('type=recovery') && to.path !== '/reset-password') {
        return next({ path: '/reset-password', hash: to.hash })
    }

    // MVP rule: "Apenas usuários logados podem ver/interagir com listagens"
    const requiresAuth = to.meta.requiresAuth !== false && to.path !== '/login' && to.path !== '/reset-password'

    if (requiresAuth && !user) {
        return next('/login')
    } else if (to.path === '/login' && user) {
        return next('/')
    }

    return next()
})

export default router

```


---
## FILE: src/services/favorites.ts
```typescript
import { supabase } from '../lib/supabaseClient'

export const favoritesService = {
    async toggleFavorite(userId: string, listingId: string) {
        const { data: existing, error: checkError } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('listing_id', listingId)
            .single()

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError
        }

        if (existing) {
            // Remove
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('listing_id', listingId)
            if (error) throw error
            return false // is NOT favorited anymore
        } else {
            // Add
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: userId, listing_id: listingId })
            if (error) throw error
            return true // is favorited
        }
    },

    async isFavorited(userId: string, listingId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select('listing_id')
            .eq('user_id', userId)
            .eq('listing_id', listingId)
            .maybeSingle()

        if (error && error.code !== 'PGRST116') throw error
        return !!data
    },

    async getMyFavorites(userId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select(`
        listing_id,
        listing:listings(
          id, type, title, description, category_id, status, price_cents, condition, pricing_type,
          photos:listing_photos(url),
          category:categories(name)
        )
      `)
            .eq('user_id', userId)
            .neq('listing.status', 'INATIVO') // only return listings that are not inactive
            .order('created_at', { ascending: false })

        if (error) throw error
        // since we are filtering the joined table, Supabase might return null for `listing` if the condition fails. Let's filter those out too.
        return data.map((fav: any) => fav.listing).filter(Boolean)
    }
}

```


---
## FILE: src/services/listings.ts
```typescript
import { supabase } from '../lib/supabaseClient'

export interface Category {
    id: number
    name: string
    category_group: 'PRODUTO' | 'SERVICO' | 'GERAL'
    icon: string | null
}

export interface Listing {
    id: string
    created_at: string
    owner_id: string
    type: 'VENDA' | 'DOACAO' | 'SERVICO'
    title: string
    description: string
    category_id: number
    status: 'ATIVO' | 'INATIVO' | 'CONCLUIDO'
    condition?: 'NOVO' | 'USADO'
    price_cents?: number
    pricing_type?: 'FIXO' | 'POR_HORA' | 'A_COMBINAR'
    show_contact: boolean
    favorites_count?: number
    report_count?: number
    photos?: { url: string }[]
    category?: Category
}

export const listingsService = {
    async getCategories() {
        const { data, error } = await supabase.from('categories').select('*').order('name')
        if (error) throw error
        return data as Category[]
    },

    async getLatestActivListings(typeFilter?: string, categoryId?: number, statusFilter: string = 'ATIVO') {
        let query = supabase
            .from('listings')
            .select(`
        *,
        photos:listing_photos(url),
        category:categories(name, icon)
      `)
            .eq('status', statusFilter)
            .lt('report_count', 10)
            .order('favorites_count', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(20)

        if (typeFilter) {
            query = query.eq('type', typeFilter)
        }
        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        const { data, error } = await query
        if (error) throw error

        // Formatting data so photos are an array of objects
        return data as Listing[]
    },

    async getListingById(id: string) {
        const { data, error } = await supabase
            .from('listings')
            .select(`
        *,
        photos:listing_photos(url, sort_order),
        category:categories!left(name, icon),
        owner:profiles!owner_id(display_name, whatsapp, site, house, avatar_url)
      `)
            .eq('id', id)
            .maybeSingle()

        if (error) {
            console.error("Supabase Error on getListingById:", error)
            throw error
        }
        if (!data) throw new Error('PGRST116')

        return data as (Listing & { owner: any })
    },

    async getMyListings(userId: string) {
        const { data, error } = await supabase
            .from('listings')
            .select(`
                *,
                photos:listing_photos(url),
                category:categories(name)
            `)
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Listing[]
    },

    async searchListings(queryText: string, searchParams?: { type?: string, category_id?: number }) {
        let query = supabase
            .from('listings')
            .select(`
                *,
                photos:listing_photos(url),
                category:categories(name, icon)
            `)
            .eq('status', 'ATIVO')
            .lt('report_count', 10)

        if (queryText.trim()) {
            query = query.textSearch('search_tsv', queryText.trim(), { config: 'portuguese' })
        }

        if (searchParams?.type) {
            query = query.eq('type', searchParams.type)
        }
        if (searchParams?.category_id) {
            query = query.eq('category_id', searchParams.category_id)
        }

        query = query.order('favorites_count', { ascending: false }).order('created_at', { ascending: false }).limit(40)

        const { data, error } = await query
        if (error) throw error
        return data as Listing[]
    },

    async createListing(listingData: any, files: File[]) {
        // 1. Insert listing
        const { data: newListing, error: listingError } = await supabase
            .from('listings')
            .insert(listingData)
            .select()
            .single()

        if (listingError) throw listingError

        // 2. Upload photos
        if (files.length > 0) {
            const photoInserts = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]!
                const fileExt = file.name.split('.').pop() || 'jpg'
                const fileName = `${newListing.id}/${Math.random()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('listing-photos')
                    .upload(fileName, file)

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError)
                    continue
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('listing-photos')
                    .getPublicUrl(fileName)

                photoInserts.push({
                    listing_id: newListing.id,
                    url: publicUrl,
                    sort_order: i
                })
            }

            if (photoInserts.length > 0) {
                await supabase.from('listing_photos').insert(photoInserts)
            }
        }

        return newListing
    },

    async updateListing(id: string, listingData: any) {
        const { data, error } = await supabase
            .from('listings')
            .update(listingData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    },

    async updateStatus(id: string, status: string) {
        const { error } = await supabase
            .from('listings')
            .update({ status })
            .eq('id', id)

        if (error) throw error
    },

    async deleteListing(id: string) {
        // 1. Fetch photos attached to listing
        const { data: photos } = await supabase
            .from('listing_photos')
            .select('url')
            .eq('listing_id', id)

        // 2. Delete the listing from database (Cascades will handles the linked rows)
        const { error } = await supabase.from('listings').delete().eq('id', id)
        if (error) throw error

        // 3. Remove physical files from Storage Bucket
        if (photos && photos.length > 0) {
            const filesToRemove = photos.map(p => {
                // Extract 'listing-id/filename' from full URL
                const urlParts = p.url.split('/')
                const fileName = urlParts.pop()
                const folderName = urlParts.pop()
                return `${folderName}/${fileName}`
            })

            if (filesToRemove.length > 0) {
                await supabase.storage.from('listing-photos').remove(filesToRemove)
            }
        }
    },

    async reportListing(listingId: string, userId: string, reason: string) {
        const { error } = await supabase
            .from('reports')
            .insert({
                listing_id: listingId,
                user_id: userId,
                reason: reason
            })
        if (error) throw error
    },

    async getReportedListings() {
        // Only accessible by admins via RLS
        const { data, error } = await supabase
            .from('listings')
            .select(`
                *,
                photos:listing_photos(url),
                category:categories(name),
                owner:profiles!owner_id(id, display_name),
                reports:reports(reason, created_at)
            `)
            .gte('report_count', 1)
            .order('report_count', { ascending: false })

        if (error) throw error
        return data as (Listing & { owner: any, reports: any[] })[]
    },

    async dismissReports(listingId: string) {
        // Deltes the reports. The DB trigger will decrement the report_count back to 0.
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('listing_id', listingId)

        if (error) throw error
    },

    async banUser(userId: string) {
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: true })
            .eq('id', userId)

        if (error) throw error
    },

    async getAdminAnalytics() {
        const { data, error } = await supabase.rpc('get_admin_analytics')
        if (error) throw error
        return data as { activeListings: number; completedListings: number; totalUsers: number }
    }
}

```


---
## FILE: src/stores/auth.ts
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export interface Profile {
    id: string
    display_name: string
    apartment?: string
    block?: string
    whatsapp?: string
    avatar_url?: string
    house?: string
    site?: string
    is_admin: boolean
    is_banned: boolean
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const profile = ref<Profile | null>(null)
    const loading = ref(true)
    const initialized = ref(false)

    async function fetchProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
        if (!error && data) {
            if (data.is_banned) {
                // If the user profile is marked as banned, force sign out.
                await supabase.auth.signOut()
                user.value = null
                profile.value = null
                alert('Sua conta foi banida pelo administrador. Acesso revogado.')
                window.location.href = '/' // Force reload to trigger auth guards
                return
            }
            profile.value = data as Profile
        }
    }

    async function initialize() {
        if (initialized.value) return
        loading.value = true

        try {
            // Use getUser() to guarantee a fresh, verified session from the server on the initial app load.
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            if (currentUser) {
                user.value = currentUser
                await fetchProfile(currentUser.id)
            }
        } catch (error) {
            console.error('Fatal auth initialization error:', error)
        } finally {
            loading.value = false
            initialized.value = true
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                user.value = session.user
                try {
                    await fetchProfile(session.user.id)
                } catch (e) {
                    console.error('Failed to fetch profile aggressively:', e)
                }
            } else {
                user.value = null
                profile.value = null
            }
        })
    }

    async function signOut() {
        await supabase.auth.signOut()
        user.value = null
        profile.value = null
    }

    return {
        user,
        profile,
        loading,
        initialized,
        initialize,
        signOut
    }
})

```


---
## FILE: src/style.css
```css
@import "tailwindcss";

body {
  background-color: #f9fafb;
  /* bg-gray-50 */
  color: #111827;
  /* text-gray-900 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```


---
## FILE: src/views/Admin.vue
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listingsService, type Listing } from '../services/listings'
import { useAuthStore } from '../stores/auth'
import { ShieldAlert, Trash2, CheckCircle, Users, ShoppingBag, CheckSquare, UserX } from 'lucide-vue-next'
import { useVisibilityRefetch } from '../composables/useVisibilityRefetch'

const router = useRouter()
const authStore = useAuthStore()

useVisibilityRefetch(() => {
  if (authStore.profile?.is_admin) {
    loadData()
  }
})

const reportedListings = ref<(Listing & { owner: any, reports: any[] })[]>([])
const analytics = ref<{ activeListings: number; completedListings: number; totalUsers: number } | null>(null)
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const [listingsData, analyticsData] = await Promise.all([
      listingsService.getReportedListings(),
      listingsService.getAdminAnalytics()
    ])
    reportedListings.value = listingsData
    analytics.value = analyticsData
  } catch (err: any) {
    console.error(err)
    if (err.code === 'PGRST116' || String(err).includes('policy')) {
      alert('Acesso negado. Apenas administradores podem ver esta página.')
      router.replace('/')
    }
  } finally {
    loading.value = false
  }
}

async function dismiss(listingId: string) {
  if (!confirm('Deseja ignorar as denúncias e devolver a sanidade deste anúncio?')) return
  try {
    await listingsService.dismissReports(listingId)
    reportedListings.value = reportedListings.value.filter(l => l.id !== listingId)
  } catch (e) {
    console.error(e)
    alert('Erro ao perdoar denúncias')
  }
}

async function banListing(listingId: string) {
  if (!confirm('Deseja excluir DEFINITIVAMENTE este anúncio e suas fotos? Esta ação não pode ser desfeita.')) return
  try {
    await listingsService.deleteListing(listingId)
    reportedListings.value = reportedListings.value.filter(l => l.id !== listingId)
    alert('Anúncio excluído com sucesso.')
  } catch (e) {
    console.error(e)
    alert('Erro ao excluir anúncio')
  }
}

async function banResident(userId: string, userName: string) {
  if (!confirm(`TEM CERTEZA ABSOLUTA que deseja BANIR o inquilino "${userName}"? Ele perderá acesso ao aplicativo imediatamente e não poderá mais logar.`)) return
  try {
    await listingsService.banUser(userId)
    // Optional: Immediately remove all reported listings from this user from the screen
    reportedListings.value = reportedListings.value.filter(l => l.owner_id !== userId)
    alert(`O morador ${userName} foi banido com sucesso.`)
  } catch (e) {
    console.error(e)
    alert('Erro ao banir usuário')
  }
}

onMounted(() => {
  if (!authStore.profile?.is_admin) {
    router.replace('/')
    return
  }
  loadData()
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-20 md:pb-10">
    <div class="px-4 py-4 bg-red-600 text-white sticky top-0 z-10 flex items-center gap-2 shadow-md">
      <ShieldAlert class="w-6 h-6" />
      <h1 class="text-xl font-bold">Painel de Moderação</h1>
    </div>

    <!-- Analytics Dashboard -->
    <div v-if="analytics" class="grid grid-cols-3 gap-2 px-4 py-4 bg-white border-b border-gray-200 shadow-sm mb-4">
       <div class="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 flex flex-col items-center justify-center">
          <ShoppingBag class="w-5 h-5 text-indigo-500 mb-1" />
          <span class="text-2xl font-black text-gray-900 leading-none">{{ analytics.activeListings }}</span>
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Anúnc. Ativos</span>
       </div>
       <div class="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 flex flex-col items-center justify-center">
          <CheckSquare class="w-5 h-5 text-emerald-500 mb-1" />
          <span class="text-2xl font-black text-gray-900 leading-none">{{ analytics.completedListings }}</span>
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Negócios</span>
       </div>
       <div class="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 flex flex-col items-center justify-center">
          <Users class="w-5 h-5 text-blue-500 mb-1" />
          <span class="text-2xl font-black text-gray-900 leading-none">{{ analytics.totalUsers }}</span>
          <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Moradores</span>
       </div>
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
    </div>
    
    <div v-else-if="reportedListings.length === 0" class="text-center py-16 px-4">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
        <CheckCircle class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 mb-2">Comunidade Segura!</h3>
      <p class="text-sm text-gray-500">Não há nenhum anúncio com denúncias ativas no momento.</p>
    </div>

    <div v-else class="p-4 space-y-4">
      <div 
        v-for="listing in reportedListings" 
        :key="listing.id" 
        class="bg-white rounded-xl shadow-sm border overflow-hidden"
        :class="listing.report_count && listing.report_count >= 5 ? 'border-red-300' : 'border-gray-200'"
      >
        <!-- Header -->
        <div class="p-3 border-b flex justify-between items-center bg-gray-50" :class="listing.report_count && listing.report_count >= 5 ? 'bg-red-50' : ''">
          <div class="flex items-center gap-2">
             <span class="font-bold text-red-600 flex items-center gap-1">
               <ShieldAlert class="w-4 h-4" /> 
               {{ listing.report_count }} Denúncia{{ listing.report_count === 1 ? '' : 's' }}
             </span>
             <span v-if="listing.report_count && listing.report_count >= 10" class="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Restrito do Público
             </span>
          </div>
          <span class="text-xs text-gray-500 font-medium">Postado por: {{ listing.owner?.display_name }}</span>
        </div>

        <!-- Body -->
        <div class="p-4 flex gap-4">
          <div class="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
            <img v-if="listing.photos && listing.photos.length > 0" :src="listing.photos[0]?.url" class="w-full h-full object-cover">
            <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-400">Sem Foto</div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-900 truncate">{{ listing.title }}</h3>
            <p class="text-xs text-gray-500 mt-1 uppercase">{{ listing.type }} &bull; {{ listing.category?.name }}</p>
            <div class="mt-3">
              <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Motivos Recentes:</p>
              <ul class="text-xs text-gray-700 bg-gray-50 rounded p-2 italic space-y-1">
                 <li v-for="(rep, idx) in listing.reports.slice(0, 3)" :key="idx">- "{{ rep.reason }}"</li>
                 <li v-if="listing.reports.length > 3" class="text-[10px] text-gray-400 font-bold ml-1">... e mais {{ listing.reports.length - 3 }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
           <button @click="dismiss(listing.id)" class="w-full bg-white border border-gray-300 hover:bg-green-50 text-gray-700 hover:text-green-700 font-bold py-2 rounded-lg text-sm transition-colors shadow-sm">
             Perdoar Anúncio
           </button>
           <div class="flex gap-2">
             <button @click="banListing(listing.id)" class="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-3 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-1">
               <Trash2 class="w-4 h-4" />
               Excluir Anúncio 
             </button>
             <button @click="banResident(listing.owner_id, listing.owner?.display_name)" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-1">
               <UserX class="w-4 h-4" />
               Banir Inquilino
             </button>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/views/EditListing.vue
```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { listingsService, type Category } from '../services/listings'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const listingId = route.params.id as string

const type = ref<'VENDA' | 'DOACAO' | 'SERVICO'>('VENDA')
const categoryId = ref<number | null>(null)
const title = ref('')
const description = ref('')
const condition = ref<'NOVO' | 'USADO'>('USADO')
const price = ref('')
const pricingType = ref<'FIXO' | 'POR_HORA' | 'A_COMBINAR'>('FIXO')
const showContact = ref(true)
const status = ref('ATIVO')

const categories = ref<Category[]>([])
const submitting = ref(false)
const errorMsg = ref('')

const statusOptionsByModel: Record<string, { label: string, value: string }[]> = {
  'VENDA': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Concluído/Vendido', value: 'CONCLUIDO' },
    { label: 'Inativo', value: 'INATIVO' },
  ],
  'DOACAO': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Concluído/Doado', value: 'CONCLUIDO' },
    { label: 'Inativo', value: 'INATIVO' },
  ],
  'SERVICO': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Concluído/Pausado', value: 'CONCLUIDO' },
    { label: 'Inativo', value: 'INATIVO' },
  ]
}

const currentStatusOptions = computed(() => statusOptionsByModel[type.value] || statusOptionsByModel['VENDA'])

const filteredCategories = computed(() => {
  if (type.value === 'SERVICO') {
    return categories.value.filter(c => (c.category_group === 'SERVICO' || c.category_group === 'GERAL') && c.name !== 'Outros')
  }
  return categories.value.filter(c => c.category_group === 'PRODUTO' || c.category_group === 'GERAL')
})

// Photos locked for MVP editing

async function handleSubmit() {
  if (!authStore.user) return
  
  if (!categoryId.value) {
    errorMsg.value = 'Selecione uma categoria'
    return
  }
  
  if (type.value === 'VENDA' && !price.value) {
    errorMsg.value = 'Informe um preço para a venda'
    return
  }

  errorMsg.value = ''
  submitting.value = true
  
  try {
    const payload: any = {
      owner_id: authStore.user.id,
      title: title.value,
      description: description.value,
      category_id: categoryId.value,
      type: type.value,
      show_contact: showContact.value,
      status: status.value
    }
    
    if (type.value === 'VENDA') {
      // transform "100.50" string or 100.5 number to cents safely
      payload.price_cents = Math.round(parseFloat(String(price.value).replace(',', '.')) * 100)
      payload.condition = condition.value
    } else if (type.value === 'SERVICO') {
      payload.pricing_type = pricingType.value
      if (pricingType.value !== 'A_COMBINAR' && price.value) {
        payload.price_cents = Math.round(parseFloat(String(price.value).replace(',', '.')) * 100)
      }
    }
    
    const updated = await listingsService.updateListing(listingId, payload)
    router.replace(`/listing/${updated.id}`)
  } catch (err: any) {
    console.error(err)
    errorMsg.value = err.message || 'Erro ao atualizar anúncio.'
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!confirm('Deseja realmente excluir este anúncio? Não é possível desfazer.')) return
  try {
    await listingsService.deleteListing(listingId)
    router.replace('/me')
  } catch (e) {
    console.error(e)
    alert('Erro ao excluir anúncio')
  }
}

onMounted(async () => {
  categories.value = await listingsService.getCategories()
  
  // Load existing data
  try {
    const data = await listingsService.getListingById(listingId)
    if (data.owner_id !== authStore.user?.id) {
      router.push('/me')
      return
    }
    type.value = data.type
    categoryId.value = data.category_id
    title.value = data.title
    description.value = data.description
    showContact.value = data.show_contact
    status.value = data.status || 'ATIVO'
    
    if (data.type === 'VENDA') {
      condition.value = data.condition || 'USADO'
      if (data.price_cents) price.value = (data.price_cents / 100).toFixed(2)
    } else if (data.type === 'SERVICO') {
      pricingType.value = data.pricing_type || 'FIXO'
      if (data.price_cents) price.value = (data.price_cents / 100).toFixed(2)
    }
  } catch (e) {
    console.error(e)
    router.push('/me')
  }
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-20 md:pb-10">
    <div class="px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
      <h1 class="text-xl font-bold text-gray-900">Editar Anúncio</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="p-4 max-w-2xl mx-auto space-y-6">
      <div v-if="errorMsg" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
        {{ errorMsg }}
      </div>

      <!-- Type -->
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-2">O que você quer anunciar?</label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            type="button" 
            @click="type = 'VENDA'"
            class="py-3 px-2 rounded-xl text-xs font-bold transition-all border-2"
            :class="type === 'VENDA' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
          >
            Venda
          </button>
          <button 
             type="button" 
             @click="type = 'DOACAO'"
            class="py-3 px-2 rounded-xl text-xs font-bold transition-all border-2"
            :class="type === 'DOACAO' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
          >
            Doação
          </button>
          <button 
             type="button" 
             @click="type = 'SERVICO'"
            class="py-3 px-2 rounded-xl text-xs font-bold transition-all border-2"
            :class="type === 'SERVICO' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
          >
            Serviço
          </button>
        </div>
      </div>

      <!-- Status -->
      <div class="bg-gray-100 p-4 rounded-xl shadow-sm border border-gray-200">
        <label class="block text-sm font-bold text-gray-900 mb-2">Status do Anúncio</label>
        <select v-model="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-green-500 focus:border-green-500 outline-none font-semibold text-gray-800">
          <option v-for="opt in currentStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <p class="text-xs text-gray-500 mt-2">Mude o status para pausar ou encerrar a exibição no aplicativo.</p>
      </div>

      <!-- Basic Info -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Título do Anúncio</label>
          <input v-model="title" required maxlength="60" placeholder="Ex: Bicicleta Aro 29" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea v-model="description" required rows="4" placeholder="Descreva os detalhes..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none resize-none"></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select v-model="categoryId" required class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-green-500 focus:border-green-500 outline-none">
            <option :value="null" disabled>Selecione...</option>
            <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>

      <!-- Details specific to type -->
      <div v-if="type === 'VENDA'" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Condição</label>
          <div class="flex gap-4">
            <label class="flex items-center">
              <input type="radio" v-model="condition" value="NOVO" class="text-green-600 focus:ring-green-500" />
              <span class="ml-2">Novo</span>
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="condition" value="USADO" class="text-green-600 focus:ring-green-500" />
              <span class="ml-2">Usado</span>
            </label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
          <input v-model="price" type="number" step="0.01" min="0" required placeholder="0.00" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
      </div>

      <div v-if="type === 'SERVICO'" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Forma de Cobrança</label>
          <select v-model="pricingType" required class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-green-500 focus:border-green-500 outline-none">
            <option value="FIXO">Valor Fixo</option>
            <option value="POR_HORA">Por Hora</option>
            <option value="A_COMBINAR">A Combinar</option>
          </select>
        </div>
        <div v-if="pricingType !== 'A_COMBINAR'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Valor Referência (R$)</label>
          <input v-model="price" type="number" step="0.01" min="0" placeholder="Opcional" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
      </div>

      <!-- Specific Location -->
      <!-- Contact Options -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label class="flex items-start gap-3 cursor-pointer">
          <div class="flex items-center h-5">
            <input 
              v-model="showContact" 
              type="checkbox" 
              class="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            >
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-900">Exibir meu contato no anúncio</span>
            <span class="text-xs text-gray-500">Se desmarcado, os usuários não verão seu Perfil ou WhatsApp neste anúncio.</span>
          </div>
        </label>
      </div>

      <!-- Photos (Read-Only Info) -->
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
        <p class="text-sm text-gray-500 font-medium">As fotos não podem ser alteradas nesta versão.</p>
        <p class="text-xs text-gray-400 mt-1">Para mudar as fotos, crie um novo anúncio.</p>
      </div>

      <div class="flex flex-col gap-3 mt-4">
        <button 
          type="submit" 
          :disabled="submitting"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          <span v-if="submitting">Salvando...</span>
          <span v-else>Salvar Alterações</span>
        </button>

        <button 
          type="button" 
          @click="handleDelete"
          class="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold text-base py-3 px-4 rounded-xl shadow-sm transition-all active:scale-95"
        >
          Excluir Anúncio
        </button>
      </div>

    </form>
  </div>
</template>

```


---
## FILE: src/views/Favorites.vue
```vue
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

```


---
## FILE: src/views/Home.vue
```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { listingsService, type Listing, type Category } from '../services/listings'
import CategoryChips from '../components/CategoryChips.vue'
import ListingCard from '../components/ListingCard.vue'
import { useVisibilityRefetch } from '../composables/useVisibilityRefetch'

import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

useVisibilityRefetch(() => {
  loadData()
})

const tabs = [
  { label: 'Tudo', value: '' },
  { label: 'Vendas', value: 'VENDA' },
  { label: 'Doações', value: 'DOACAO' },
  { label: 'Serviços', value: 'SERVICO' },
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
    
    if (currentTab.value === 'CONCLUIDOS') {
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
console.log("To olhando no Home")

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
console.log("To iniciando no Home.vue")

  window.addEventListener('scroll', handleScroll, { passive: true })
  loadData()
})

onUnmounted(() => {
console.log("Eu desmontei no Home.vue")

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
        <div class="flex pb-2 items-center">
          <RouterLink
            v-if="authStore.user"
            to="/me"
            class="flex-shrink-0 mr-2 px-4 py-1.5 text-sm font-extrabold text-white bg-green-600 rounded-full shadow-sm hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Meus Anúncios
          </RouterLink>

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

```


---
## FILE: src/views/ListingDetail.vue
```vue
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

```


---
## FILE: src/views/Login.vue
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const isSignUp = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  
  try {
    if (isSignUp.value) {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      alert('Conta criada com sucesso!')
      router.push('/')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      router.push('/')
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Ocorreu um erro'
  } finally {
    loading.value = false
  }
}

async function handleResetPassword() {
  if (!email.value) {
    errorMsg.value = 'Por favor, informe seu e-mail acima para recuperar a senha.'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: window.location.origin + '/reset-password',
    })
    if (error) throw error
    alert('As instruções para redefinir sua senha foram enviadas para o seu e-mail!')
  } catch (err: any) {
    errorMsg.value = err.message || 'Erro ao solicitar redefinição'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8">
      
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-green-600 mb-2">Condomínio Store</h1>
        <p class="text-gray-600 font-medium mt-4 text-lg">
          {{ isSignUp ? 'Criar Nova Conta' : 'Entrar na sua conta' }}
        </p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div v-if="errorMsg" class="p-3 bg-red-100 text-red-700 text-sm rounded-lg">
          {{ errorMsg }}
        </div>
        
        <div>
          <label for="email_input" class="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input 
            id="email_input"
            name="email"
            autocomplete="email"
            v-model="email" 
            type="email" 
            required 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="seu@email.com"
          >
        </div>
        
        <div>
          <label for="password_input" class="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input 
            id="password_input"
            name="password"
            autocomplete="current-password"
            v-model="password" 
            type="password" 
            required 
            class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
            placeholder="••••••••"
          >
        </div>
        
          <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
        >
          <span v-if="loading">Aguarde...</span>
          <span v-else>{{ isSignUp ? 'Cadastrar' : 'Entrar' }}</span>
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-600">
        <button @click="isSignUp = !isSignUp" class="text-green-600 font-semibold hover:underline">
          {{ isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se' }}
        </button>
      </div>

      <div v-if="!isSignUp" class="mt-4 text-center text-sm text-gray-600">
        <button @click="handleResetPassword" class="text-gray-500 font-medium hover:text-gray-900 transition-colors hover:underline">
          Esqueci minha senha
        </button>
      </div>
      
    </div>
  </div>
</template>

```


---
## FILE: src/views/MyListings.vue
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listingsService, type Listing } from '../services/listings'
import { useAuthStore } from '../stores/auth'
import { Trash2, Edit2 } from 'lucide-vue-next'
import { useVisibilityRefetch } from '../composables/useVisibilityRefetch'

import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

useVisibilityRefetch(() => {
  if (authStore.user) {
    loadMyListings()
  }
})
const listings = ref<Listing[]>([])
const loading = ref(true)

async function loadMyListings() {
  if (!authStore.user) return
  loading.value = true
  try {
    listings.value = await listingsService.getMyListings(authStore.user.id)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function changeStatus(listing: Listing, newStatus: string) {
  try {
    listing.status = newStatus as any // UI optimistic config
    await listingsService.updateStatus(listing.id, newStatus)
  } catch (e) {
    console.error(e)
    alert('Erro ao atualizar status')
    loadMyListings() // reload
  }
}

async function deleteListing(id: string) {
  if (!confirm('Deseja realmente excluir este anúncio? Não é possível desfazer.')) return
  try {
    await listingsService.deleteListing(id)
    listings.value = listings.value.filter(l => l.id !== id)
  } catch (e) {
    console.error(e)
    alert('Erro ao excluir anúncio')
  }
}

const statusOptionsByModel: Record<string, { label: string, value: string }[]> = {
  'VENDA': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Concluído/Vendido', value: 'CONCLUIDO' },
    { label: 'Inativo', value: 'INATIVO' },
  ],
  'DOACAO': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Concluído/Doado', value: 'CONCLUIDO' },
    { label: 'Inativo', value: 'INATIVO' },
  ],
  'SERVICO': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Concluído/Pausado', value: 'CONCLUIDO' },
    { label: 'Inativo', value: 'INATIVO' },
  ]
}

function getOptions(type: string) {
  return statusOptionsByModel[type] || statusOptionsByModel['VENDA']
}

function statusColor(status: string) {
  switch (status) {
    case 'ATIVO': return 'bg-green-100 text-green-800'
    case 'CONCLUIDO': return 'bg-gray-100 text-gray-800'
    case 'INATIVO': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

onMounted(() => {
  if (authStore.user) {
    loadMyListings()
  }
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-20 md:pb-10">
    <div class="px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10 flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Meus Anúncios</h1>
      <RouterLink to="/new" class="text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-lg">Novo</RouterLink>
    </div>

    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
    </div>
    
    <div v-else-if="listings.length === 0" class="text-center py-16 px-4 bg-white m-4 rounded-2xl shadow-sm border border-gray-100">
      <h3 class="text-lg font-bold text-gray-900 mb-2">Você não tem anúncios</h3>
      <p class="text-sm text-gray-500 mb-6">Comece desapegando ou divulgando seus serviços pro condomínio!</p>
      <RouterLink to="/new" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm">
        Criar Primeiro Anúncio
      </RouterLink>
    </div>

    <div v-else class="p-4 space-y-4">
      <div v-for="listing in listings" :key="listing.id" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible p-4 flex gap-4 relative">
        <!-- Photo -->
        <div class="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
          <img v-if="listing.photos && listing.photos.length > 0" :src="listing.photos[0]?.url" class="w-full h-full object-cover">
          <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-400">Sem Foto</div>
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-start mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" :class="statusColor(listing.status)">
              {{ listing.status }}
            </span>
          </div>
          <h3 class="font-bold text-gray-900 truncate mb-1">{{ listing.title }}</h3>
          
          <!-- Quick Status Changer -->
          <div class="mt-2 flex gap-2 w-full max-w-[130px]">
            <select 
              :value="listing.status" 
              @change="(e) => changeStatus(listing, (e.target as HTMLSelectElement).value)"
              class="text-[11px] border border-gray-300 rounded px-2 py-1 flex-1 bg-gray-50 outline-none focus:border-green-500 font-medium"
            >
              <option v-for="opt in getOptions(listing.type)" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-2 items-end justify-between">
          <button @click="router.push(`/edit/${listing.id}`)" class="p-2 text-gray-400 hover:text-green-600 transition-colors bg-gray-50 hover:bg-green-50 rounded-lg" title="Editar Anúncio">
            <Edit2 class="w-4 h-4" />
          </button>
          <button @click="deleteListing(listing.id)" class="p-2 text-gray-400 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 rounded-lg" title="Excluir Anúncio">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

```


---
## FILE: src/views/NewListing.vue
```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { listingsService, type Category } from '../services/listings'
import { UploadCloud, X } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const type = ref<'VENDA' | 'DOACAO' | 'SERVICO'>('VENDA')
const categoryId = ref<number | null>(null)
const title = ref('')
const description = ref('')
const condition = ref<'NOVO' | 'USADO'>('USADO')
const price = ref('')
const pricingType = ref<'FIXO' | 'POR_HORA' | 'A_COMBINAR'>('FIXO')
const showContact = ref(true)

const files = ref<File[]>([])
const fileUrls = ref<string[]>([])
const categories = ref<Category[]>([])
const submitting = ref(false)
const errorMsg = ref('')

const filteredCategories = computed(() => {
  if (type.value === 'SERVICO') {
    return categories.value.filter(c => (c.category_group === 'SERVICO' || c.category_group === 'GERAL') && c.name !== 'Outros')
  }
  return categories.value.filter(c => c.category_group === 'PRODUTO' || c.category_group === 'GERAL')
})

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files) return
  
  for (let i = 0; i < target.files.length; i++) {
    if (files.value.length >= 6) break // max 6 photos
    const file = target.files[i]
    if (!file) continue
    files.value.push(file)
    fileUrls.value.push(URL.createObjectURL(file))
  }
  target.value = ''
}

function removeFile(index: number) {
  files.value.splice(index, 1)
  fileUrls.value.splice(index, 1)
}

async function handleSubmit() {
  if (!authStore.user) return
  
  if (!categoryId.value) {
    errorMsg.value = 'Selecione uma categoria'
    return
  }
  
  if (type.value === 'VENDA' && !price.value) {
    errorMsg.value = 'Informe um preço para a venda'
    return
  }

  errorMsg.value = ''
  submitting.value = true
  
  try {
    const payload: any = {
      owner_id: authStore.user.id,
      title: title.value,
      description: description.value,
      category_id: categoryId.value,
      type: type.value,
      show_contact: showContact.value
    }
    
    if (type.value === 'VENDA') {
      // transform "100.50" string or 100.5 number to cents safely
      payload.price_cents = Math.round(parseFloat(String(price.value).replace(',', '.')) * 100)
      payload.condition = condition.value
    } else if (type.value === 'SERVICO') {
      payload.pricing_type = pricingType.value
      if (pricingType.value !== 'A_COMBINAR' && price.value) {
        payload.price_cents = Math.round(parseFloat(String(price.value).replace(',', '.')) * 100)
      }
    }
    
    const newListing = await listingsService.createListing(payload, files.value)
    router.replace(`/listing/${newListing.id}`)
  } catch (err: any) {
    console.error(err)
    errorMsg.value = err.message || 'Erro ao criar anúncio.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  categories.value = await listingsService.getCategories()
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-20 md:pb-10">
    <div class="px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
      <h1 class="text-xl font-bold text-gray-900">Novo Anúncio</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="p-4 max-w-2xl mx-auto space-y-6">
      <div v-if="errorMsg" class="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
        {{ errorMsg }}
      </div>

      <!-- Type -->
      <div>
        <label class="block text-sm font-bold text-gray-700 mb-2">O que você quer anunciar?</label>
        <div class="grid grid-cols-3 gap-2">
          <button 
            type="button" 
            @click="type = 'VENDA'"
            class="py-3 px-2 rounded-xl text-xs font-bold transition-all border-2"
            :class="type === 'VENDA' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
          >
            Venda
          </button>
          <button 
             type="button" 
             @click="type = 'DOACAO'"
            class="py-3 px-2 rounded-xl text-xs font-bold transition-all border-2"
            :class="type === 'DOACAO' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
          >
            Doação
          </button>
          <button 
             type="button" 
             @click="type = 'SERVICO'"
            class="py-3 px-2 rounded-xl text-xs font-bold transition-all border-2"
            :class="type === 'SERVICO' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
          >
            Serviço
          </button>
        </div>
      </div>

      <!-- Basic Info -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label for="title_input" class="block text-sm font-medium text-gray-700 mb-1">Título do Anúncio</label>
          <input id="title_input" name="listing_title" v-model="title" required maxlength="60" placeholder="Ex: Bicicleta Aro 29" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
        
        <div>
          <label for="desc_input" class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea id="desc_input" name="listing_description" v-model="description" required rows="4" placeholder="Descreva os detalhes..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none resize-none"></textarea>
        </div>
        
        <div>
          <label for="cat_input" class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select id="cat_input" name="listing_category" v-model="categoryId" required class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-green-500 focus:border-green-500 outline-none">
            <option :value="null" disabled>Selecione...</option>
            <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>

      <!-- Details specific to type -->
      <div v-if="type === 'VENDA'" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Condição</label>
          <div class="flex gap-4">
            <label class="flex items-center">
              <input type="radio" v-model="condition" value="NOVO" class="text-green-600 focus:ring-green-500" />
              <span class="ml-2">Novo</span>
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="condition" value="USADO" class="text-green-600 focus:ring-green-500" />
              <span class="ml-2">Usado</span>
            </label>
          </div>
        </div>
        <div>
          <label for="price_venda_input" class="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
          <input id="price_venda_input" name="listing_price" v-model="price" type="number" step="0.01" min="0" required placeholder="0.00" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
      </div>

      <div v-if="type === 'SERVICO'" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Forma de Cobrança</label>
          <select v-model="pricingType" required class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-green-500 focus:border-green-500 outline-none">
            <option value="FIXO">Valor Fixo</option>
            <option value="POR_HORA">Por Hora</option>
            <option value="A_COMBINAR">A Combinar</option>
          </select>
        </div>
        <div v-if="pricingType !== 'A_COMBINAR'">
          <label for="price_servico_input" class="block text-sm font-medium text-gray-700 mb-1">Valor Referência (R$)</label>
          <input id="price_servico_input" name="service_price" v-model="price" type="number" step="0.01" min="0" placeholder="Opcional" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
      </div>

      <!-- Specific Location -->
      <!-- Contact Options -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label class="flex items-start gap-3 cursor-pointer">
          <div class="flex items-center h-5">
            <input 
              v-model="showContact" 
              type="checkbox" 
              class="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            >
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-900">Exibir meu contato no anúncio</span>
            <span class="text-xs text-gray-500">Se desmarcado, os usuários não verão seu Perfil ou WhatsApp neste anúncio.</span>
          </div>
        </label>
      </div>

      <!-- Photos -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label class="block text-sm font-medium text-gray-700 mb-2">Fotos (Máx 6)</label>
        
        <div class="grid grid-cols-3 gap-2 mb-3">
          <div v-for="(url, idx) in fileUrls" :key="idx" class="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group">
            <img :src="url" class="w-full h-full object-cover">
            <button @click.prevent="removeFile(idx)" class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <X class="w-3 h-3" />
            </button>
          </div>
          
          <label v-if="files.length < 6" class="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors cursor-pointer bg-gray-50 relative overflow-hidden">
            <UploadCloud class="w-6 h-6 mb-1" />
            <span class="text-xs font-medium">Add Foto</span>
            <input type="file" accept="image/*" multiple @change="handleFileSelect" class="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        </div>
      </div>

      <button 
        type="submit" 
        :disabled="submitting"
        class="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-4"
      >
        <span v-if="submitting">Publicando...</span>
        <span v-else>Publicar Anúncio</span>
      </button>

    </form>
  </div>
</template>

```


---
## FILE: src/views/Profile.vue
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const displayName = ref('')
const whatsapp = ref('')
const site = ref('')
const house = ref('')
const saving = ref(false)
const msg = ref('')

onMounted(() => {
  if (authStore.profile) {
    displayName.value = authStore.profile.display_name || ''
    whatsapp.value = authStore.profile.whatsapp || ''
    site.value = authStore.profile.site || ''
    house.value = authStore.profile.house || ''
  }
})

async function saveProfile() {
  if (!authStore.user) return
  saving.value = true
  msg.value = ''
  
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName.value,
      whatsapp: whatsapp.value,
      site: site.value,
      house: house.value,
    })
    .eq('id', authStore.user.id)
    
  if (error) {
    msg.value = 'Erro ao salvar: ' + error.message
  } else {
    msg.value = 'Perfil atualizado com sucesso!'
    await authStore.initialize() // refresh profile context
  }
  saving.value = false
}

async function handleSignOut() {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="p-4 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">Meus Dados</h1>
    
    <div v-if="msg" class="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
      {{ msg }}
    </div>
    
    <form @submit.prevent="saveProfile" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Nome de Exibição / Apelido</label>
        <input v-model="displayName" required class="mt-1 w-full px-3 py-2 border rounded-lg" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">WhatsApp (Opcional)</label>
        <input v-model="whatsapp" type="tel" placeholder="11999999999" class="mt-1 w-full px-3 py-2 border rounded-lg" />
      </div>
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700">Site Público (Opcional)</label>
          <input v-model="site" placeholder="ex: seussite.com.br" class="mt-1 w-full px-3 py-2 border rounded-lg" />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium text-gray-700">Casa (Opcional)</label>
          <input v-model="house" placeholder="ex: 12B" class="mt-1 w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>
      
      <button 
        type="submit" 
        :disabled="saving"
        class="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold text-lg py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
      >
        {{ saving ? 'Salvando...' : 'Salvar Alterações' }}
      </button>
      
      <button 
        type="button" 
        @click="handleSignOut"
        class="w-full bg-red-100 hover:bg-red-200 text-red-700 mt-4 py-3.5 rounded-xl font-bold transition-colors active:scale-95"
      >
        Sair da Conta
      </button>
    </form>
  </div>
</template>

```
