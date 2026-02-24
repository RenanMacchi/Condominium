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
    { label: 'Reservado', value: 'RESERVADO' },
    { label: 'Vendido', value: 'VENDIDO_DOADO' },
    { label: 'Inativo', value: 'INATIVO' },
  ],
  'DOACAO': [
    { label: 'Ativo', value: 'ATIVO' },
    { label: 'Reservado', value: 'RESERVADO' },
    { label: 'Doado', value: 'VENDIDO_DOADO' },
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
