const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const projectRef = process.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
const password = process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '';

const variations = [];
if (connectionString) {
    variations.push(connectionString);
}
if (projectRef && password) {
    variations.push(
        `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
        `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
        `postgresql://postgres:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
    );
}

async function test() {
    if (variations.length === 0) {
        console.log('⚠️ Harap atur DATABASE_URL atau VITE_SUPABASE_URL + DATABASE_PASSWORD di .env');
        return;
    }

    for (const conn of variations) {
        const masked = password ? conn.replace(password, '****') : conn;
        console.log(`Testing: ${masked}`);
        const client = new Client({ connectionString: conn, connectionTimeoutMillis: 5000 });
        try {
            await client.connect();
            console.log('✅ SUCCESS!');
            await client.end();
            break;
        } catch (e) {
            console.log(`❌ FAILED: ${e.message}`);
        }
    }
}

test();
