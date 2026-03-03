import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
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

// Initialize Supabase admin client (bypasses RLS and Rate Limits for user creation)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

function normalizePassword(name) {
    if (!name) return null;
    // Convert to upper case, remove accents, and remove all whitespace
    return name
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '')
        .toUpperCase();
}

async function importUsers() {
    const excelPath = path.join(__dirname, '../Planilha geral dos moradores Viver Coometal.xlsx');

    console.log(`Reading Excel file: ${excelPath}...`);
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Parse rows as JSON
    const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

    console.log(`Found ${data.length} rows. Starting import...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const nCasa = row['Nº das casas'];
        const titular = row['Nome do Titular'];

        if (!nCasa || !titular) {
            console.log(`Skipping row ${i + 2}: Missing number or name (${JSON.stringify(row)})`);
            continue;
        }

        const username = `casa${nCasa}_coometal`;
        const password = normalizePassword(titular);
        const email = `${username}@condominiostore.local`;

        if (!password) {
            console.log(`Skipping row ${i + 2}: Could not generate password for "${titular}"`);
            continue;
        }

        console.log(`Creating user: ${username}...`);

        const { data: userData, error } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                username: username,
                recovery_email: null
            }
        });

        if (error) {
            console.error(`Error creating ${username}:`, error.message);
            errorCount++;
        } else {
            successCount++;
        }

        // Small delay to prevent too many open connections or DB overload
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('\n--- Import Results ---');
    console.log(`Total intended rows processed: ${data.length}`);
    console.log(`Successfully created: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('----------------------\n');
}

importUsers().catch(err => {
    console.error("Fatal error during import:", err);
    process.exit(1);
});
