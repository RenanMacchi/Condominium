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
