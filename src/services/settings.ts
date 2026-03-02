import { supabase } from '../lib/supabaseClient'

export const settingsService = {
    async getLogoUrl(): Promise<string | null> {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'logo_url')
            .single()

        if (error) {
            console.error('Error fetching logo url', error)
            return null
        }
        return data?.value || null
    },

    async updateLogoUrl(url: string): Promise<void> {
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key: 'logo_url', value: url })

        if (error) {
            console.error('Error updating logo url', error)
            throw error
        }
    }
}
