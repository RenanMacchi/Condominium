<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import BottomNavigation from './components/BottomNavigation.vue'

const authStore = useAuthStore()
const route = useRoute()

onMounted(() => {
  // Initialization is now guaranteed by the Vue Router guard
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
