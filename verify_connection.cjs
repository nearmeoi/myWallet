const { Client } = require('pg');

require('dotenv').config();
// Extract from DATABASE_URL or set separate env var if needed
const connectionString = process.env.DATABASE_URL;
const projectRef = process.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];

const variations = [
    `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
];

async function test() {
    for (const conn of variations) {
        console.log(`Testing: ${conn.replace(password, '****')}`);
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
