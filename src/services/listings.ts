import { supabase } from '../lib/supabaseClient'

export interface Category {
    id: number
    name: string
    category_group: 'PRODUTO' | 'SERVICO' | 'GERAL'
    icon: string | null
}

export interface Listing {
    id: string
    created_at: string
    type: 'VENDA' | 'DOACAO' | 'SERVICO'
    title: string
    description: string
    category_id: number
    status: 'ATIVO' | 'RESERVADO' | 'VENDIDO_DOADO' | 'CONCLUIDO' | 'INATIVO'
    condition?: 'NOVO' | 'USADO'
    price_cents?: number
    pricing_type?: 'FIXO' | 'POR_HORA' | 'A_COMBINAR'
    photos?: { url: string }[]
    category?: Category
}

export const listingsService = {
    async getCategories() {
        const { data, error } = await supabase.from('categories').select('*').order('name')
        if (error) throw error
        return data as Category[]
    },

    async getLatestActivListings(typeFilter?: string, categoryId?: number) {
        let query = supabase
            .from('listings')
            .select(`
        *,
        photos:listing_photos(url),
        category:categories(name, icon)
      `)
            .eq('status', 'ATIVO')
            .order('created_at', { ascending: false })
            .limit(20)

        if (typeFilter) {
            query = query.eq('type', typeFilter)
        }
        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        const { data, error } = await query
        if (error) throw error

        // Formatting data so photos are an array of objects
        return data as Listing[]
    },

    async getListingById(id: string) {
        const { data, error } = await supabase
            .from('listings')
            .select(`
        *,
        photos:listing_photos(url, sort_order),
        category:categories(name, icon),
        owner:profiles(display_name, whatsapp, block, apartment, avatar_url)
      `)
            .eq('id', id)
            .single()

        if (error) throw error
        return data as (Listing & { owner: any })
    },

    async getMyListings(userId: string) {
        const { data, error } = await supabase
            .from('listings')
            .select(`
                *,
                photos:listing_photos(url),
                category:categories(name)
            `)
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data as Listing[]
    },

    async searchListings(queryText: string, searchParams?: { type?: string, category_id?: number }) {
        let query = supabase
            .from('listings')
            .select(`
                *,
                photos:listing_photos(url),
                category:categories(name, icon)
            `)
            .eq('status', 'ATIVO')

        if (queryText.trim()) {
            query = query.textSearch('search_tsv', queryText.trim(), { config: 'portuguese' })
        }

        if (searchParams?.type) {
            query = query.eq('type', searchParams.type)
        }
        if (searchParams?.category_id) {
            query = query.eq('category_id', searchParams.category_id)
        }

        query = query.order('created_at', { ascending: false }).limit(40)

        const { data, error } = await query
        if (error) throw error
        return data as Listing[]
    },

    async createListing(listingData: any, files: File[]) {
        // 1. Insert listing
        const { data: newListing, error: listingError } = await supabase
            .from('listings')
            .insert(listingData)
            .select()
            .single()

        if (listingError) throw listingError

        // 2. Upload photos
        if (files.length > 0) {
            const photoInserts = []
            for (let i = 0; i < files.length; i++) {
                const file = files[i]!
                const fileExt = file.name.split('.').pop() || 'jpg'
                const fileName = `${newListing.id}/${Math.random()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('listing-photos')
                    .upload(fileName, file)

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError)
                    continue
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('listing-photos')
                    .getPublicUrl(fileName)

                photoInserts.push({
                    listing_id: newListing.id,
                    url: publicUrl,
                    sort_order: i
                })
            }

            if (photoInserts.length > 0) {
                await supabase.from('listing_photos').insert(photoInserts)
            }
        }

        return newListing
    },

    async updateStatus(id: string, status: string) {
        const { error } = await supabase
            .from('listings')
            .update({ status })
            .eq('id', id)

        if (error) throw error
    },

    async deleteListing(id: string) {
        // RLS handles the permissions, cascades will delete photos and favorites
        // Storage files might be left orphaned for MVP, or we can delete them.
        const { error } = await supabase.from('listings').delete().eq('id', id)
        if (error) throw error
    }
}
