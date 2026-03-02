<script setup lang="ts">
import { Home, Search, PlusCircle, Heart, User, LogOut } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { computed } from 'vue'

const route = useRoute()
const auth = useAuth()

const navItems = computed(() => {
  const items: Array<{ name: string, path: string, icon: any, action?: () => void | Promise<void> }> = [
    { name: 'Início', path: '/', icon: Home },
    { name: 'Buscar', path: '/search', icon: Search },
  ]
  
  if (!auth.profile.value?.is_visitor) {
    items.push(
      { name: 'Anunciar', path: '/new', icon: PlusCircle },
      { name: 'Perfil', path: '/profile', icon: User }
    )
  }

  items.push(
    { name: 'Favoritos', path: '/favorites', icon: Heart }
  )

  if (auth.profile.value?.is_visitor) {
    items.push({ name: 'Sair', path: '', icon: LogOut, action: () => auth.signOut() })
  }

  return items
})
</script>

<template>
  <nav class="bg-white border-t border-gray-200 pb-safe">
    <div class="flex justify-around items-center h-16">
      <template v-for="item in navItems" :key="item.name">
        <button 
          v-if="item.action"
          @click="item.action()"
          class="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors text-gray-500 hover:text-gray-900"
        >
          <component :is="item.icon" class="w-6 h-6 mb-1 stroke-2" />
          <span>{{ item.name }}</span>
        </button>
        <RouterLink 
          v-else
          :to="item.path"
          class="flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors"
          :class="route.path === item.path ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'"
        >
          <component :is="item.icon" class="w-6 h-6 mb-1" :class="route.path === item.path ? 'stroke-[2.5px]' : 'stroke-2'" />
          <span>{{ item.name }}</span>
        </RouterLink>
      </template>
    </div>
  </nav>
</template>

<style scoped>
/* Support for iOS safe area if needed */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
