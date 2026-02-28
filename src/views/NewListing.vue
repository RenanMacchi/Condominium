<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { listingsService } from '../services/listings'
import type { Category, ListingType, ListingCondition, PricingType, CreateListingPayload } from '../types'
import { UploadCloud, X } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuth()

const type = ref<ListingType>('VENDA')
const categoryId = ref<number | null>(null)
const title = ref('')
const description = ref('')
const condition = ref<ListingCondition>('USADO')
const price = ref('')
const pricingType = ref<PricingType>('FIXO')
const showContact = ref(true)

const isDonationRequest = ref(false)
const campaignLink = ref('')
const campaignLocation = ref('')

const files = ref<File[]>([])
const fileUrls = ref<string[]>([])
const categories = ref<Category[]>([])
const submitting = ref(false)
const errorMsg = ref('')

const filteredCategories = computed(() => {
  if (type.value === 'SERVICO') {
    return categories.value.filter(c => (c.category_group === 'SERVICO' || c.category_group === 'GERAL') && c.name !== 'Outros')
  }
  if (type.value === 'CAMPANHA') {
    return categories.value.filter(c => c.category_group === 'GERAL')
  }
  return categories.value.filter(c => c.category_group === 'PRODUTO' || c.category_group === 'GERAL')
})

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files) return
  
  for (let i = 0; i < target.files.length; i++) {
    if (type.value !== 'CAMPANHA' && files.value.length >= 6) break // max 6 photos for non-campaigns
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
  if (!auth.user.value) return
  
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
    const payload: CreateListingPayload = {
      type: type.value,
      title: title.value,
      description: description.value,
      category_id: categoryId.value,
      show_contact: showContact.value,
      owner_id: auth.user.value.id,
      status: 'ATIVO' as any,
      is_donation_request: type.value === 'DOACAO' ? isDonationRequest.value : false,
    }
    
    if (type.value === 'CAMPANHA') {
      payload.campaign_link = campaignLink.value || undefined
      payload.campaign_location = campaignLocation.value || undefined
      payload.price_cents = null
      payload.condition = null
      payload.pricing_type = null
    } else if (type.value === 'VENDA') {
      // transform "100.50" string or 100.5 number to cents safely
      payload.price_cents = Math.round(parseFloat(String(price.value).replace(',', '.')) * 100)
      payload.condition = condition.value
      payload.pricing_type = null
    } else if (type.value === 'SERVICO') {
      payload.pricing_type = pricingType.value
      payload.condition = null
      if (pricingType.value !== 'A_COMBINAR' && price.value) {
        payload.price_cents = Math.round(parseFloat(String(price.value).replace(',', '.')) * 100)
      } else {
        payload.price_cents = null
      }
    } else if (type.value === 'DOACAO') {
      payload.price_cents = null
      payload.condition = null
      payload.pricing_type = null
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
        <div :class="auth.profile.value?.is_admin ? 'grid grid-cols-2 md:grid-cols-4 gap-2' : 'grid grid-cols-3 gap-2'">
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
          <button 
             v-if="auth.profile.value?.is_admin"
             type="button" 
             @click="type = 'CAMPANHA'"
            class="py-3 px-2 rounded-xl text-xs font-bold transition-all border-2"
            :class="type === 'CAMPANHA' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
          >
            Campanha
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

      <!-- Types Specific Content -->
      <div v-if="type === 'DOACAO'" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label class="flex items-start gap-3 cursor-pointer">
          <div class="flex items-center h-5">
            <input 
              v-model="isDonationRequest" 
              type="checkbox" 
              class="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            >
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-900">Este anúncio é um pedido de doação</span>
            <span class="text-xs text-gray-500">Marque se você está precisando de doações, em vez de oferecer algo.</span>
          </div>
        </label>
      </div>

      <div v-if="type === 'CAMPANHA'" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label for="campaign_link_input" class="block text-sm font-medium text-gray-700 mb-1">Link de Redirecionamento</label>
          <input id="campaign_link_input" name="campaign_link" v-model="campaignLink" placeholder="https://" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
        <div>
          <label for="campaign_location_input" class="block text-sm font-medium text-gray-700 mb-1">Localização (Maps)</label>
          <input id="campaign_location_input" name="campaign_location" v-model="campaignLocation" placeholder="Endereço ou link do Maps..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
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
        <label class="block text-sm font-medium text-gray-700 mb-2">Fotos {{ type === 'CAMPANHA' ? '(Ilimitadas)' : '(Máx 6)' }}</label>
        
        <div class="grid grid-cols-3 gap-2 mb-3">
          <div v-for="(url, idx) in fileUrls" :key="idx" class="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group">
            <img :src="url" class="w-full h-full object-cover">
            <button @click.prevent="removeFile(idx)" class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <X class="w-3 h-3" />
            </button>
          </div>
          
          <label v-if="type === 'CAMPANHA' || files.length < 6" class="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors cursor-pointer bg-gray-50 relative overflow-hidden">
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
