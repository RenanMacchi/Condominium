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
