import { createClient } from '@supabase/supabase-js';

// Use require for compatibility if running with node, or import meta for vite
// Since this looks like a node script, we'll try to handle it.
// If it's ESM, we need to handle it differently.
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
    console.log("Checking data...");

    // Try to fetch transactions without auth (might fail if RLS is on)
    const { data: tx, error: txError } = await supabase.from('transactions').select('*').limit(5);
    console.log('Transactions:', tx ? tx.length : 0, txError ? txError.message : '');

    const { data: w, error: wError } = await supabase.from('wallets').select('*').limit(5);
    console.log('Wallets:', w ? w.length : 0, wError ? wError.message : '');

     const { data: c, error: cError } = await supabase.from('categories').select('*').limit(5);
    console.log('Categories:', c ? c.length : 0, cError ? cError.message : '');
}

checkData();
