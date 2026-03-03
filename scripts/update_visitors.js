import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from the root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

// Initialize Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function updateVisitors() {
    console.log('Atualizando o status is_visitor para FALSE em todos os perfis...');

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ is_visitor: false })
        .eq('is_visitor', true); // Atualiza apenas quem está como TRUE

    if (error) {
        console.error('Erro ao atualizar perfis:', error.message);
    } else {
        console.log('Perfis atualizados com sucesso!');
    }
}

updateVisitors().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
