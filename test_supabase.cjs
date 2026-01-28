const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    const tables = ['transactions', 'categories', 'wishlist', 'profiles'];
    console.log('Checking Supabase connection and tables...');
    
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                if (error.code === '42P01') {
                    console.log(`❌ Table "${table}": NOT FOUND (Does not exist in DB)`);
                } else {
                    console.log(`⚠️ Table "${table}": Error (${error.code} - ${error.message})`);
                }
            } else {
                console.log(`✅ Table "${table}": Accessible.`);
            }
        } catch (e) {
            console.log(`❌ Table "${table}": Critical error: ${e.message}`);
        }
    }
}

checkTables();