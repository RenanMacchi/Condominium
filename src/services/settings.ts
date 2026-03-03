import { supabase } from '../lib/supabaseClient'

export const settingsService = {
    async getLogoUrl(): Promise<string | null> {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'logo_url')
            .single()

        if (error) {
            return null
        }
        return data?.value || null
    },

    async updateLogoUrl(url: string): Promise<void> {
        const { error } = await supabase
            .from('app_settings')
            .upsert({ key: 'logo_url', value: url })

        if (error) {
            throw error
        }
    },

    async uploadLogo(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop()
        const fileName = `logo-${Date.now()}.${fileExt}`
        const storagePath = `logos/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('listing-photos')
            .upload(storagePath, file, { upsert: true })

        if (uploadError) {
            throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
            .from('listing-photos')
            .getPublicUrl(storagePath)

        return publicUrl
    }
}
