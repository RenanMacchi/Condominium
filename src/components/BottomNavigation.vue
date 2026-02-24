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
