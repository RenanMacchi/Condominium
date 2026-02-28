export interface Profile {
    id: string
    display_name: string
    apartment?: string
    block?: string
    whatsapp?: string
    avatar_url?: string
    house?: string
    site?: string
    is_admin: boolean
    is_banned: boolean
}

export type CategoryGroup = 'PRODUTO' | 'SERVICO' | 'GERAL'

export interface Category {
    id: number
    name: string
    category_group: CategoryGroup
    icon: string | null
}

export type ListingType = 'VENDA' | 'DOACAO' | 'SERVICO' | 'CAMPANHA'
export type ListingStatus = 'ATIVO' | 'INATIVO' | 'CONCLUIDO'
export type PricingType = 'FIXO' | 'POR_HORA' | 'A_COMBINAR'
export type ListingCondition = 'NOVO' | 'USADO'

export interface ListingPhoto {
    url: string
    sort_order?: number
}

export interface Listing {
    id: string
    created_at: string
    owner_id: string
    type: ListingType
    title: string
    description: string
    category_id: number
    status: ListingStatus
    condition?: ListingCondition
    price_cents?: number
    pricing_type?: PricingType
    show_contact: boolean
    favorites_count: number
    report_count: number
    photos?: ListingPhoto[]
    category?: Partial<Category>
    is_donation_request?: boolean
    campaign_link?: string
    campaign_location?: string
    has_business_hours?: boolean
    business_days?: number[]
    open_time?: string
    close_time?: string
}

export interface ListingWithOwner extends Listing {
    owner: Partial<Profile>
    reports?: Report[]
}

export interface Report {
    id?: number
    listing_id: string
    user_id: string
    reason: string
    created_at?: string
}

export interface CreateListingPayload {
    type: ListingType
    title: string
    description: string
    category_id: number
    condition?: ListingCondition | null
    price_cents?: number | null
    pricing_type?: PricingType | null
    show_contact: boolean
    owner_id: string
    status: ListingStatus
    is_donation_request?: boolean
    campaign_link?: string
    campaign_location?: string
    has_business_hours?: boolean
    business_days?: number[]
    open_time?: string
    close_time?: string
}

export interface UpdateListingPayload extends Partial<CreateListingPayload> {
    status?: ListingStatus
}
