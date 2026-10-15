-- ========================================================
-- myWallet - Supabase Database Schema
-- Jalankan skrip SQL ini di Supabase SQL Editor jika ingin
-- menggunakan backend Supabase untuk sinkronisasi cloud.
-- ========================================================

-- 1. Tabel Profiles (Budget Bulanan & Profil Pengguna)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  monthly_budget bigint DEFAULT 0,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Wallets (Dompet / Akun Bank / E-Wallet)
CREATE TABLE IF NOT EXISTS wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'cash', -- 'cash', 'bank', 'ewallet'
  balance bigint DEFAULT 0,
  color text DEFAULT '#1A1D1E',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Tabel Categories (Kategori Pemasukan / Pengeluaran)
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

-- 4. Tabel Transactions (Catatan Transaksi Masuk & Keluar)
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

-- 5. Tabel Wishlist (Daftar Keinginan)
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  price bigint NOT NULL,
  purchased boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Migrasi tambahan kolom jika tabel sudah pernah dibuat sebelumnya
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='wallet_id') THEN
    ALTER TABLE transactions ADD COLUMN wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='budget_limit') THEN
    ALTER TABLE categories ADD COLUMN budget_limit bigint DEFAULT 0;
  END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah duplikasi
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

-- Buat Policy keamanan (Hanya pemilik data yang bisa CRUD)
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own wallets" ON wallets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own wishlist" ON wishlist FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- MIGRASI BARU: Tabel Hutang/Piutang & Tabungan
-- ========================================================

-- 6. Tabel Debts (Catatan Hutang & Piutang)
CREATE TABLE IF NOT EXISTS debts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  type text CHECK (type IN ('owe', 'lend')), -- 'owe' = saya berhutang, 'lend' = saya meminjamkan
  person_name text NOT NULL,
  total_amount bigint NOT NULL,
  paid_amount bigint DEFAULT 0,
  due_date date,
  notes text DEFAULT '',
  status text DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'partial', 'paid')),
  created_at timestamptz DEFAULT now()
);

-- 7. Tabel Debt Payments (Riwayat Cicilan Hutang)
CREATE TABLE IF NOT EXISTS debt_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id uuid REFERENCES debts(id) ON DELETE CASCADE,
  amount bigint NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 8. Tabel Savings (Kantong Tabungan / Goals)
CREATE TABLE IF NOT EXISTS savings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  target_amount bigint NOT NULL,
  current_amount bigint DEFAULT 0,
  icon text DEFAULT 'Target',
  color text DEFAULT '#D4F7E6',
  deadline date,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;

-- Drop old policies if exist (safe re-run)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage their own debts" ON debts;
    DROP POLICY IF EXISTS "Users can manage their own debt payments" ON debt_payments;
    DROP POLICY IF EXISTS "Users can manage their own savings" ON savings;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- RLS Policies for new tables
CREATE POLICY "Users can manage their own debts" ON debts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own savings" ON savings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own debt payments" ON debt_payments
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM debts WHERE id = debt_payments.debt_id)
  );

