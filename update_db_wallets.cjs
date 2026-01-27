const { Client } = require('pg');

const connectionString = 'postgresql://postgres.dgvjiiaunqaonvpwytej:Akmaljhi123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString: connectionString,
});

const sql = `
-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  type text, -- 'cash', 'bank', 'ewallet'
  balance bigint DEFAULT 0,
  color text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Add wallet_id to Transactions Table (if not exists)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='wallet_id') THEN
    ALTER TABLE transactions ADD COLUMN wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS for Wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own wallets" ON wallets;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create Policy
CREATE POLICY "Users can manage their own wallets" ON wallets FOR ALL USING (auth.uid() = user_id);
`;

async function init() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('✅ Database updated (Wallets table added)!');
  } catch (err) {
    console.error('❌ Error updating database:', err.message);
  } finally {
    await client.end();
  }
}

init();
