import { supabase } from '../lib/supabaseClient'
import type { Category, Listing, ListingWithOwner, CreateListingPayload, UpdateListingPayload, ListingPhoto } from '../types'

export const listingsService = {
    async getCategories(): Promise<Category[]> {
        const { data, error } = await supabase.from('categories').select('*').order('name')
        if (error) throw error
        return data as Category[]
    },

    async getLatestActivListings(typeFilter?: string, categoryId?: number, statusFilter: string = 'ATIVO'): Promise<Listing[]> {
        const selectStr = `
            *,
            photos:listing_photos(url),
            category:categories(name, icon)
        `

        if (!typeFilter) {
            // When 'Tudo' is selected, prioritize CAMPANHA
            let campQuery = supabase.from('listings').select(selectStr)
                .eq('status', statusFilter).eq('type', 'CAMPANHA').lt('report_count', 10)
                .order('created_at', { ascending: false }).limit(5)

            let otherQuery = supabase.from('listings').select(selectStr)
                .eq('status', statusFilter).neq('type', 'CAMPANHA').lt('report_count', 10)
                .order('favorites_count', { ascending: false }).order('created_at', { ascending: false }).limit(20)

            if (categoryId) {
                campQuery = campQuery.eq('category_id', categoryId)
                otherQuery = otherQuery.eq('category_id', categoryId)
            }

            const [campRes, otherRes] = await Promise.all([campQuery, otherQuery])
            if (campRes.error) throw campRes.error
            if (otherRes.error) throw otherRes.error

            return [...(campRes.data || []), ...(otherRes.data || [])] as Listing[]
        }

        // Specific type tab
        let query = supabase
            .from('listings')
            .select(selectStr)
            .eq('status', statusFilter)
            .lt('report_count', 10)
            .order('favorites_count', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(20)

        if (typeFilter === 'PEDIDOS_DOACAO') {
            query = query.eq('type', 'DOACAO').eq('is_donation_request', true)
        } else if (typeFilter === 'DOACAO') {
            query = query.eq('type', 'DOACAO').eq('is_donation_request', false)
        } else {
            query = query.eq('type', typeFilter)
        }

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        const { data, error } = await query
        if (error) throw error

        return data as Listing[]
    },

    async getListingById(id: string): Promise<ListingWithOwner> {
        const { data, error } = await supabase
            .from('listings')
            .select(`
        *,
        photos:listing_photos(url, sort_order),
        category:categories!left(name, icon),
        owner:profiles!owner_id(display_name, whatsapp, site, house, avatar_url)
      `)
            .eq('id', id)
            .maybeSingle()

        if (error) {
            console.error("Supabase Error on getListingById:", error)
            throw error
        }
        if (!data) throw new Error('PGRST116')

        return data as unknown as ListingWithOwner
    },

    async getMyListings(userId: string): Promise<Listing[]> {
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

    async searchListings(queryText: string, searchParams?: { type?: string, category_id?: number }): Promise<Listing[]> {
        if (!queryText.trim()) {
            // Standard fallback when search bar is empty
            let query = supabase
                .from('listings')
                .select(`
                    *,
                    photos:listing_photos(url),
                    category:categories(name, icon)
                `)
                .eq('status', 'ATIVO')
                .lt('report_count', 10)

            if (searchParams?.type) {
                query = query.eq('type', searchParams.type)
            }
            if (searchParams?.category_id) {
                query = query.eq('category_id', searchParams.category_id)
            }

            query = query.order('favorites_count', { ascending: false }).order('created_at', { ascending: false }).limit(40)

            const { data, error } = await query
            if (error) throw error
            return data as Listing[]
        }

        // Fuzzy search when user types
        const { data, error } = await supabase
            .rpc('search_listings_fuzzy', {
                search_term: queryText.trim(),
                p_type: searchParams?.type || null,
                p_category_id: searchParams?.category_id || null,
                min_similarity: 0.15 // Same default as DB function
            })
            // We append the select statement to fetch relational data via PostgREST
            .select(`
                *,
                photos:listing_photos(url),
                category:categories(name, icon)
            `)

        if (error) throw error
        return data as Listing[]
    },

    async createListing(listingData: CreateListingPayload, files: File[]): Promise<Listing> {
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

        return newListing as Listing
    },

    async updateListing(id: string, listingData: UpdateListingPayload, photosToKeep?: ListingPhoto[], newFiles?: File[]): Promise<Listing> {
        // 1. Update basic data
        const { data, error } = await supabase
            .from('listings')
            .update(listingData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // 2. Handle Photos if any of the photo payloads are provided
        if (photosToKeep !== undefined || newFiles !== undefined) {

            // 2a. Fetch currently saved photos from the database
            const { data: currentPhotos } = await supabase
                .from('listing_photos')
                .select('url, sort_order')
                .eq('listing_id', id)
                .order('sort_order', { ascending: true })

            // Determine which ones to delete
            const urlsToKeep = (photosToKeep || []).map(p => p.url)
            const photosToDelete = (currentPhotos || []).filter(p => !urlsToKeep.includes(p.url))

            // Delete removed photos from DB and Storage
            if (photosToDelete.length > 0) {
                // Remove from DB (Storage is manual)
                await supabase
                    .from('listing_photos')
                    .delete()
                    .in('url', photosToDelete.map(p => p.url))

                const storagePaths = photosToDelete.map(p => {
                    const parts = p.url.split('/')
                    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`
                })

                if (storagePaths.length > 0) {
                    await supabase.storage.from('listing-photos').remove(storagePaths)
                }
            }

            // 2b. Re-order the kept photos to close any gaps (e.g if order 0 and 2 were kept, they become 0 and 1)
            if (photosToKeep && photosToKeep.length > 0) {
                for (let i = 0; i < photosToKeep.length; i++) {
                    await supabase
                        .from('listing_photos')
                        .update({ sort_order: i })
                        .eq('listing_id', id)
                        .eq('url', photosToKeep[i]!.url)
                }
            }

            // 2c. Upload new files and append them to the end
            if (newFiles && newFiles.length > 0) {
                const startIndex = photosToKeep ? photosToKeep.length : 0
                const photoInserts = []

                for (let i = 0; i < newFiles.length; i++) {
                    const file = newFiles[i]!
                    const fileExt = file.name.split('.').pop() || 'jpg'
                    const fileName = `${id}/${Math.random()}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('listing-photos')
                        .upload(fileName, file)

                    if (uploadError) {
                        console.error('Error uploading new photo:', uploadError)
                        continue
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('listing-photos')
                        .getPublicUrl(fileName)

                    photoInserts.push({
                        listing_id: id,
                        url: publicUrl,
                        sort_order: startIndex + i
                    })
                }

                if (photoInserts.length > 0) {
                    await supabase.from('listing_photos').insert(photoInserts)
                }
            }
        }

        return data as Listing
    },

    async updateStatus(id: string, status: string): Promise<void> {
        const { error } = await supabase
            .from('listings')
            .update({ status })
            .eq('id', id)

        if (error) throw error
    },

    async deleteListing(id: string): Promise<void> {
        // 1. Fetch photos attached to listing
        const { data: photos } = await supabase
            .from('listing_photos')
            .select('url')
            .eq('listing_id', id)

        // 2. Delete the listing from database (Cascades will handles the linked rows)
        const { error } = await supabase.from('listings').delete().eq('id', id)
        if (error) throw error

        // 3. Remove physical files from Storage Bucket
        if (photos && photos.length > 0) {
            const filesToRemove = photos.map(p => {
                // Extract 'listing-id/filename' from full URL
                const urlParts = p.url.split('/')
                const fileName = urlParts.pop()
                const folderName = urlParts.pop()
                return `${folderName}/${fileName}`
            })

            if (filesToRemove.length > 0) {
                await supabase.storage.from('listing-photos').remove(filesToRemove as string[])
            }
        }
    },

    async reportListing(listingId: string, userId: string, reason: string): Promise<void> {
        const { error } = await supabase
            .from('reports')
            .insert({
                listing_id: listingId,
                user_id: userId,
                reason: reason
            })
        if (error) throw error
    },

    async getReportedListings(): Promise<ListingWithOwner[]> {
        // Only accessible by admins via RLS
        const { data, error } = await supabase
            .from('listings')
            .select(`
                *,
                photos:listing_photos(url),
                category:categories(name),
                owner:profiles!owner_id(id, display_name),
                reports:reports(reason, created_at)
            `)
            .gte('report_count', 1)
            .order('report_count', { ascending: false })

        if (error) throw error
        return data as unknown as ListingWithOwner[]
    },

    async dismissReports(listingId: string): Promise<void> {
        // Deltes the reports. The DB trigger will decrement the report_count back to 0.
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('listing_id', listingId)

        if (error) throw error
    },

    async banUser(userId: string): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: true })
            .eq('id', userId)

        if (error) throw error
    },

    async getAdminAnalytics(): Promise<{ activeListings: number; completedListings: number; totalUsers: number }> {
        const { data, error } = await supabase.rpc('get_admin_analytics')
        if (error) throw error
        return data as { activeListings: number; completedListings: number; totalUsers: number }
    },

    async autoCleanupListings(): Promise<{ inactivated: number, deleted: number }> {
        const fifteenDaysAgo = new Date()
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

        const { data: toInactivate, error: inactError } = await supabase
            .from('listings')
            .update({ status: 'INATIVO' })
            .lt('updated_at', fifteenDaysAgo.toISOString())
            .neq('status', 'INATIVO')
            .select('id')

        if (inactError) throw inactError

        const twentyTwoDaysAgo = new Date()
        twentyTwoDaysAgo.setDate(twentyTwoDaysAgo.getDate() - 22)

        const { data: toDelete, error: fetchDelError } = await supabase
            .from('listings')
            .select('id')
            .lt('updated_at', twentyTwoDaysAgo.toISOString())
            .eq('status', 'INATIVO')

        if (fetchDelError) throw fetchDelError

        let deletedCount = 0
        if (toDelete && toDelete.length > 0) {
            for (const listing of toDelete) {
                await this.deleteListing(listing.id) // Also clears physical images
                deletedCount++
            }
        }

        return {
            inactivated: toInactivate?.length || 0,
            deleted: deletedCount
        }
    }
}
