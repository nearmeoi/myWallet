const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL belum diatur di file .env');
  console.log('Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

const sql = `
-- 1. Tabel Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  monthly_budget bigint DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Wallets (Dompet)
CREATE TABLE IF NOT EXISTS wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'cash', -- 'cash', 'bank', 'ewallet'
  balance bigint DEFAULT 0,
  color text DEFAULT '#1A1D1E',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel Categories (Kategori)
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  cat_id text NOT NULL,
  name text NOT NULL,
  icon text,
  bg text,
  type text CHECK (type IN ('income', 'expense')),
  budget_limit bigint DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Tabel Transactions (Transaksi)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  title text NOT NULL,
  amount bigint NOT NULL,
  type text CHECK (type IN ('income', 'expense')),
  category text,
  wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. Tabel Wishlist
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  price bigint NOT NULL,
  purchased boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Tambah kolom jika tabel sudah ada sebelumnya
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='wallet_id') THEN
    ALTER TABLE transactions ADD COLUMN wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='budget_limit') THEN
    ALTER TABLE categories ADD COLUMN budget_limit bigint DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can manage their own wallets" ON wallets;
    DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
    DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
    DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlist;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create Policies
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own wallets" ON wallets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);
`;

async function init() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('✅ Database initialized successfully with all tables (profiles, wallets, categories, transactions, wishlist)!');
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
  } finally {
    await client.end();
  }
}

init();
