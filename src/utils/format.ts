import type { Listing } from '../types'

export function formatPrice(listing: Listing): string {
    if (listing.type === 'DOACAO') return listing.is_donation_request ? 'Pedido de Doação' : 'Doação'
    if (listing.type === 'CAMPANHA') return 'Campanha'
    if (listing.type === 'SERVICO' && listing.pricing_type === 'A_COMBINAR') return 'A combinar'
    if (listing.price_cents == null) return ''

    const basePrice = (listing.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    if (listing.type === 'SERVICO' && listing.pricing_type === 'POR_HORA') {
        return `${basePrice}/h`
    }
    return basePrice
}

export const statusOptionsByType: Record<string, { label: string; value: string }[]> = {
    VENDA: [
        { label: 'Ativo', value: 'ATIVO' },
        { label: 'Pausado', value: 'INATIVO' },
        { label: 'Vendido', value: 'CONCLUIDO' }
    ],
    DOACAO: [
        { label: 'Ativo', value: 'ATIVO' },
        { label: 'Pausado', value: 'INATIVO' },
        { label: 'Doado', value: 'CONCLUIDO' }
    ],
    SERVICO: [
        { label: 'Ativo', value: 'ATIVO' },
        { label: 'Pausado', value: 'INATIVO' }
    ],
    CAMPANHA: [
        { label: 'Ativo', value: 'ATIVO' },
        { label: 'Pausado', value: 'INATIVO' },
        { label: 'Concluído', value: 'CONCLUIDO' }
    ]
}

export function getStatusOptions(type: string | undefined) {
    if (!type || !statusOptionsByType[type]) return []
    return statusOptionsByType[type]
}

export function isListingOpen(listing: Listing): boolean {
    if (!listing.has_business_hours) return true
    if (!listing.business_days || listing.business_days.length === 0) return true
    if (!listing.open_time || !listing.close_time) return true

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, ...

    // Check if open today
    if (!listing.business_days.includes(currentDay)) {
        return false
    }

    // Convert current time to string "HH:mm:ss"
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    const currentTimeStr = `${hours}:${minutes}:${seconds}`

    // Ensure open_time and close_time have seconds to compare correctly, supabase returns 'HH:mm:ss' but just in case
    const openTime = listing.open_time.length === 5 ? `${listing.open_time}:00` : listing.open_time
    const closeTime = listing.close_time.length === 5 ? `${listing.close_time}:00` : listing.close_time

    if (openTime <= closeTime) {
        // Normal case (e.g., 08:00 to 18:00)
        return currentTimeStr >= openTime && currentTimeStr <= closeTime
    } else {
        // Overnight case (e.g., 22:00 to 06:00)
        return currentTimeStr >= openTime || currentTimeStr <= closeTime
    }
}
