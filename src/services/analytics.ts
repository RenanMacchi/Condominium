import { supabase } from '../lib/supabaseClient'

export const analyticsService = {
    /**
     * Logs a unique access for the given visitor/user.
     * To avoid spamming the DB on every page load, it sets a sessionStorage flag.
     */
    async logAccess(userId: string | null = null): Promise<void> {
        // Only log once per session
        if (sessionStorage.getItem('access_logged')) {
            return
        }

        let visitorUuid = localStorage.getItem('visitor_uuid')
        if (!visitorUuid) {
            visitorUuid = crypto.randomUUID()
            localStorage.setItem('visitor_uuid', visitorUuid)
        }

        try {
            const { error } = await supabase.from('access_logs').insert({
                user_id: userId,
                visitor_uuid: visitorUuid
            })

            if (!error) {
                sessionStorage.setItem('access_logged', 'true')
            } else {
                console.error('Failed to log access:', error)
            }
        } catch (err) {
            console.error('Error in logAccess:', err)
        }
    },

    /**
     * Fetches the number of UNIQUE visitors within a specified date range.
     * Dates should be ISO strings (e.g., 2026-03-01T00:00:00.000Z)
     */
    async getUniqueAccesses(startDate: string, endDate: string): Promise<number> {
        // End date is inclusive up to the end of the day, so we must add 1 day or set to 23:59:59
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        // Using count(distinct visitor_uuid) doesn't natively map to simple JS SDK select 
        // without an RPC unless we bring it all to frontend or use a proxy view.
        // Instead of bringing all logs locally, we'll fetch only the UUIDs and distinct them.
        // If table grows large, a Postgres RPC is needed. Let's start with raw select & set.

        // Alternatively, we can use the head count if we had an RPC. 
        // Since we didn't add an RPC in the DB plan yet, we will fetch IDs and unique them JS side,
        // which is fine for small/medium apps, but an RPC like `get_unique_visitors` is better long term.

        const { data, error } = await supabase
            .from('access_logs')
            .select('visitor_uuid')
            .gte('created_at', startDate)
            .lte('created_at', end.toISOString())

        if (error) {
            console.error('Error fetching unique accesses:', error)
            throw error
        }

        if (!data) return 0

        const uniqueUuids = new Set(data.map(log => log.visitor_uuid))
        return uniqueUuids.size
    }
}
