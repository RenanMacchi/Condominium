<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { listingsService } from '../services/listings'
import type { Category, ListingType, ListingStatus, ListingCondition, PricingType, UpdateListingPayload, ListingPhoto } from '../types'
import { getStatusOptions } from '../utils/format'
import { UploadCloud, X, Plus, Trash2 } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const listingId = computed(() => route.params.id as string)

const type = ref<'VENDA' | 'DOACAO' | 'SERVICO' | 'CAMPANHA'>('VENDA')
const categoryId = ref<number | null>(null)
const title = ref('')
const description = ref('')
const condition = ref<'NOVO' | 'USADO'>('USADO')
const price = ref('')
const pricingType = ref<'FIXO' | 'POR_HORA' | 'A_COMBINAR'>('FIXO')
const showContact = ref(true)
const status = ref('ATIVO')

const isDonationRequest = ref(false)
const campaignLink = ref('')
const campaignLocation = ref('')

const extraLinks = ref<string[]>([])
const extraWhatsapps = ref<string[]>([])

function addExtraLink() {
  extraLinks.value.push('')
}
function removeExtraLink(index: number) {
  extraLinks.value.splice(index, 1)
}

function addExtraWhatsapp() {
  extraWhatsapps.value.push('')
}
function removeExtraWhatsapp(index: number) {
  extraWhatsapps.value.splice(index, 1)
}

// Horário de Atendimento
const hasBusinessHours = ref(false)
const businessDays = ref<number[]>([1, 2, 3, 4, 5])
const openTime = ref('08:00')
const closeTime = ref('18:00')

const weekDays = [
  { id: 0, label: 'D', name: 'Domingo' },
  { id: 1, label: 'S', name: 'Segunda-feira' },
  { id: 2, label: 'T', name: 'Terça-feira' },
  { id: 3, label: 'Q', name: 'Quarta-feira' },
  { id: 4, label: 'Q', name: 'Quinta-feira' },
  { id: 5, label: 'S', name: 'Sexta-feira' },
  { id: 6, label: 'S', name: 'Sábado' }
]

function toggleDay(dayId: number) {
  const index = businessDays.value.indexOf(dayId)
  if (index === -1) {
    businessDays.value.push(dayId)
    businessDays.value.sort()
  } else {
    businessDays.value.splice(index, 1)
  }
}

const categories = ref<Category[]>([])
const submitting = ref(false)
const errorMsg = ref('')

const currentStatusOptions = computed(() => getStatusOptions(type.value))

const filteredCategories = computed(() => {
  if (type.value === 'SERVICO') {
    return categories.value.filter(c => (c.category_group === 'SERVICO' || c.category_group === 'GERAL') && c.name !== 'Outros')
  }
  if (type.value === 'CAMPANHA') {
    return categories.value.filter(c => c.category_group === 'GERAL')
  }
  return categories.value.filter(c => c.category_group === 'PRODUTO' || c.category_group === 'GERAL')
})

const existingPhotos = ref<ListingPhoto[]>([])
const newFiles = ref<File[]>([])
const newFileUrls = ref<string[]>([])

const totalPhotosCount = computed(() => existingPhotos.value.length + newFiles.value.length)

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files) return
  
  for (let i = 0; i < target.files.length; i++) {
    if (type.value !== 'CAMPANHA' && totalPhotosCount.value >= 2) break
    const file = target.files[i]
    if (!file) continue
    newFiles.value.push(file)
    newFileUrls.value.push(URL.createObjectURL(file))
  }
  target.value = ''
}

function removeExistingPhoto(index: number) {
  existingPhotos.value.splice(index, 1)
}

function removeNewFile(index: number) {
  newFiles.value.splice(index, 1)
  newFileUrls.value.splice(index, 1)
}

async function handleSubmit() {
  if (!auth.user.value) return
  
  if (!categoryId.value) {
    errorMsg.value = 'Selecione uma categoria'
    return
  }
  
  if (hasBusinessHours.value) {
    if (businessDays.value.length === 0) {
      errorMsg.value = 'Selecione pelo menos um dia de atendimento'
      return
    }
    if (!openTime.value || !closeTime.value) {
      errorMsg.value = 'Informe o horário de abertura e fechamento'
      return
    }
  }

  errorMsg.value = ''
  submitting.value = true
  
  try {
    const payload: UpdateListingPayload = {
      title: title.value,
      description: description.value,
      category_id: categoryId.value,
      type: type.value as ListingType,
      show_contact: showContact.value,
      status: status.value as ListingStatus,
      is_donation_request: type.value === 'DOACAO' ? isDonationRequest.value : false,
      has_business_hours: hasBusinessHours.value,
      business_days: hasBusinessHours.value ? businessDays.value : [],
      open_time: hasBusinessHours.value ? openTime.value : undefined,
      close_time: hasBusinessHours.value ? closeTime.value : undefined
    }
    
    if (type.value === 'CAMPANHA') {
      payload.campaign_link = campaignLink.value || undefined
      payload.campaign_location = campaignLocation.value || undefined
      payload.price_cents = null
      payload.condition = null
      payload.pricing_type = null
    } else if (type.value === 'VENDA') {
      if (price.value) {
        payload.price_cents = Math.round(parseFloat(String(price.value).replace(',', '.')) * 100)
      } else {
        payload.price_cents = null
      }
      payload.condition = condition.value as ListingCondition
      payload.pricing_type = null
    } else if (type.value === 'SERVICO') {
      payload.pricing_type = pricingType.value as PricingType
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
    
    payload.extra_links = extraLinks.value.filter(link => link.trim() !== '')
    payload.extra_whatsapps = extraWhatsapps.value.filter(wpp => wpp.trim() !== '')
    
    const updated = await listingsService.updateListing(
       listingId.value, 
       payload, 
       existingPhotos.value, 
       newFiles.value
    )
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
    await listingsService.deleteListing(listingId.value)
    router.replace('/me')
  } catch (e) {
    console.error(e)
    alert('Erro ao excluir anúncio')
  }
}

async function loadListingData() {
  categories.value = await listingsService.getCategories()
  
  // Load existing data
  try {
    const data = await listingsService.getListingById(listingId.value)
    if (data.owner_id !== auth.user.value?.id) {
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
    } else if (data.type === 'DOACAO') {
      isDonationRequest.value = data.is_donation_request ?? false
    } else if (data.type === 'CAMPANHA') {
      campaignLink.value = data.campaign_link || ''
      campaignLocation.value = data.campaign_location || ''
    }

    if (data.extra_links) {
      extraLinks.value = [...data.extra_links]
    }
    if (data.extra_whatsapps) {
      extraWhatsapps.value = [...data.extra_whatsapps]
    }

    if (data.has_business_hours) {
      hasBusinessHours.value = true
      if (data.business_days?.length) businessDays.value = data.business_days
      
      // Handle the fact that open_time can be a full 'HH:mm:ss' Postgres string, we only want HH:mm for the input type="time"
      if (data.open_time) openTime.value = data.open_time.substring(0, 5)
      if (data.close_time) closeTime.value = data.close_time.substring(0, 5)
    }

    if (data.photos) {
      existingPhotos.value = [...data.photos]
    }
  } catch (e) {
    console.error(e)
    router.push('/me')
  }
}

watch(listingId, () => {
  loadListingData()
})

onMounted(() => {
  loadListingData()
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
          <input v-model="price" type="number" step="0.01" min="0" placeholder="Opcional" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Link de Redirecionamento</label>
          <input v-model="campaignLink" placeholder="https://" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Localização (Maps)</label>
          <input v-model="campaignLocation" placeholder="Endereço ou link do Maps..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
        </div>
      </div>

      <!-- Horário de Atendimento -->
      <div v-if="type === 'VENDA' || type === 'SERVICO'" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <label class="flex items-start gap-3 cursor-pointer">
          <div class="flex items-center h-5">
            <input 
              v-model="hasBusinessHours" 
              type="checkbox" 
              class="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            >
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-900">Definir horário de atendimento</span>
            <span class="text-xs text-gray-500">Fora do horário, o anúncio aparecerá como "Fechado" e terá menor prioridade nas buscas.</span>
          </div>
        </label>

        <div v-if="hasBusinessHours" class="pt-2 border-t border-gray-100 flex flex-col gap-4">
          <!-- Dias da semana -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Dias de Funcionamento</label>
            <div class="flex gap-1.5 flex-wrap">
              <button 
                v-for="day in weekDays" 
                :key="day.id"
                type="button"
                @click="toggleDay(day.id)"
                class="w-10 h-10 rounded-full font-bold text-sm transition-colors"
                :class="businessDays.includes(day.id) ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
                :title="day.name"
              >
                {{ day.label }}
              </button>
            </div>
            <p v-if="businessDays.length === 0" class="text-xs text-red-500 mt-1">Selecione pelo menos um dia.</p>
          </div>

          <!-- Horários -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Abertura</label>
              <input v-model="openTime" type="time" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Fechamento</label>
              <input v-model="closeTime" type="time" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <!-- Specific Location -->
      <!-- Contact Options -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
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

        <div class="pt-4 border-t border-gray-100 space-y-4">
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">Links Adicionais</label>
              <button type="button" @click="addExtraLink" class="text-green-600 hover:bg-green-50 p-1 rounded-md transition-colors" title="Adicionar link">
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <div v-for="(_link, idx) in extraLinks" :key="'link-'+idx" class="flex items-center gap-2 mb-2">
              <input v-model="extraLinks[idx]" placeholder="https://" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none text-sm" />
              <button type="button" @click="removeExtraLink(idx)" class="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors" title="Remover link">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">WhatsApp Adicionais</label>
              <button type="button" @click="addExtraWhatsapp" class="text-green-600 hover:bg-green-50 p-1 rounded-md transition-colors" title="Adicionar WhatsApp">
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <div v-for="(_wpp, idx) in extraWhatsapps" :key="'wpp-'+idx" class="flex items-center gap-2 mb-2">
              <input v-model="extraWhatsapps[idx]" placeholder="Ex: 11999999999" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none text-sm" />
              <button type="button" @click="removeExtraWhatsapp(idx)" class="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors" title="Remover WhatsApp">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Photos -->
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label class="block text-sm font-medium text-gray-700 mb-2">Fotos {{ type === 'CAMPANHA' ? '(Ilimitadas)' : '(Máx 2)' }}</label>
        
        <div class="grid grid-cols-3 gap-2 mb-3">
          <!-- Existing Photos from DB -->
          <div v-for="(photo, idx) in existingPhotos" :key="photo.url" class="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group">
            <img :src="photo.url" class="w-full h-full object-cover">
            <button @click.prevent="removeExistingPhoto(idx)" class="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <X class="w-3 h-3" />
            </button>
          </div>

          <!-- New Photos staged for upload -->
          <div v-for="(url, idx) in newFileUrls" :key="url" class="relative aspect-square rounded-lg border border-blue-200 overflow-hidden group">
             <div class="absolute top-0 right-0 left-0 h-1 bg-blue-500 z-10"></div>
            <img :src="url" class="w-full h-full object-cover">
            <button @click.prevent="removeNewFile(idx)" class="absolute top-2 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <X class="w-3 h-3" />
            </button>
          </div>
          
          <!-- Upload Button -->
          <label v-if="type === 'CAMPANHA' || totalPhotosCount < 2" class="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors cursor-pointer bg-gray-50 relative overflow-hidden">
            <UploadCloud class="w-6 h-6 mb-1" />
            <span class="text-xs font-medium">Add Foto</span>
            <input type="file" accept="image/*" multiple @change="handleFileSelect" class="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        </div>
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
