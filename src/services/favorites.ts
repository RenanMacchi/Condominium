import { supabase } from '../lib/supabaseClient'

export const favoritesService = {
    async toggleFavorite(userId: string, listingId: string) {
        const { data: existing, error: checkError } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('listing_id', listingId)
            .single()

        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError
        }

        if (existing) {
            // Remove
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq('listing_id', listingId)
            if (error) throw error
            return false // is NOT favorited anymore
        } else {
            // Add
            const { error } = await supabase
                .from('favorites')
                .insert({ user_id: userId, listing_id: listingId })
            if (error) throw error
            return true // is favorited
        }
    },

    async isFavorited(userId: string, listingId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select('listing_id')
            .eq('user_id', userId)
            .eq('listing_id', listingId)
            .maybeSingle()

        if (error && error.code !== 'PGRST116') throw error
        return !!data
    },

    async getMyFavorites(userId: string) {
        const { data, error } = await supabase
            .from('favorites')
            .select(`
        listing_id,
        listing:listings(
          id, type, title, description, category_id, status, price_cents, condition, pricing_type,
          photos:listing_photos(url),
          category:categories(name)
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data.map((fav: any) => fav.listing)
    }
}
