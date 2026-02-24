<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import BottomNavigation from './components/BottomNavigation.vue'

const authStore = useAuthStore()
const route = useRoute()

onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <div class="h-screen w-full flex flex-col bg-gray-50">
    <div v-if="authStore.loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
    <main v-else class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
    
    <BottomNavigation v-if="!authStore.loading && route.path !== '/login' && route.path !== '/reset-password'" />
  </div>
</template>
