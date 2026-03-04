<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth'
import BottomNavigation from './components/BottomNavigation.vue'
import { Toaster } from 'vue-sonner'
import { analyticsService } from './services/analytics'
import { watch, onMounted } from 'vue'

const route = useRoute()
const auth = useAuth()

// Log access when the app is initialized
onMounted(() => {
  analyticsService.logAccess(auth.user.value?.id)
})

watch(() => auth.initialized.value, (isInit) => {
  if (isInit) {
    analyticsService.logAccess(auth.user.value?.id)
  }
})
</script>

<template>
  <div class="min-h-[100dvh] w-full bg-gray-50 pb-[env(safe-area-bottom,0)]">
    <!-- Exibe um spinner de carregamento global até que o roteador/supabase resolvam -->
    <div v-if="!auth.initialized.value" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
    
    <main v-else class="pb-16">
      <RouterView />
    </main>
    
    <div v-if="auth.initialized.value && route.path !== '/login' && route.path !== '/reset-password'" class="fixed bottom-0 left-0 w-full z-50">
      <BottomNavigation />
    </div>
    
    <div class="relative z-[100]">
      <Toaster position="top-center" richColors />
    </div>
  </div>
</template>
