const { Client } = require('pg');

const projectRef = 'dgvjiiaunqaonvpwytej';
const password = 'Akmaljhi123';

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
