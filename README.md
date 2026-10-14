# myWallet 💰

Aplikasi manajemen keuangan pribadi yang responsif, modern, dan fleksibel berbasis **React 19**, **Vite**, dan **Supabase**.

Aplikasi ini dapat berjalan dalam dua mode:
1. **Mode Lokal (Offline)**: Berjalan langsung tanpa backend/database eksternal, data disimpan secara lokal menggunakan `LocalStorage` browser.
2. **Mode Cloud (Supabase)**: Sinkronisasi data antar perangkat dan autentikasi akun menggunakan Supabase PostgreSQL.

---

## 🚀 Fitur Utama

- **Dashboard Keuangan**: Pantau saldo total, pemasukan, pengeluaran, dan budget bulanan.
- **Manajemen Dompet**: Kelola berbagai dompet/rekening (Tunai, Bank, E-Wallet) dan saldo masing-masing.
- **Transfer Antar Dompet**: Catat pemindahan dana antar dompet tanpa merusak statistik pengeluaran.
- **Kategori Fleksibel**: Kategori pemasukan dan pengeluaran kustom dengan batas jatah anggaran per kategori.
- **Wishlist & Target Belanja**: Daftar barang impian yang ingin dibeli beserta kalkulasi sisa dana.
- **Filter Riwayat Transaksi**: Cari transaksi berdasarkan kata kunci, bulan, tahun, tipe, atau dompet tertentu.
- **Mode Tamu & Akun Cloud**: Langsung pakai tanpa login, atau daftar akun untuk sinkronisasi cloud.

---

## 🛠️ Cara Menjalankan

### 1. Install Dependensi
```bash
npm install
```

### 2. Jalankan Mode Pengembang (Development)
```bash
npm run dev
```
Buka browser di `http://localhost:5173`. Aplikasi langsung siap digunakan dalam Mode Lokal!

### 3. Build untuk Produksi
```bash
npm run build
npm run preview
```

---

## ☁️ Menghubungkan ke Supabase (Opsional)

Jika ingin mengaktifkan login akun dan sinkronisasi cloud antar perangkat:

1. Buat proyek baru di [Supabase](https://supabase.com).
2. Buka **SQL Editor** di dashboard Supabase, lalu jalankan script yang ada di file [`schema.sql`](./schema.sql).
3. Salin file `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
4. Isi kredensial Supabase Anda di `.env`:
   ```env
   VITE_SUPABASE_URL=https://proyek-anda.supabase.co
   VITE_SUPABASE_ANON_KEY=anon-key-anda
   DATABASE_URL=postgresql://postgres:password-anda@db.proyek-anda.supabase.co:5432/postgres
   ```
5. Restart dev server: `npm run dev`. Menu Akun akan otomatis beralih ke mode sinkronisasi cloud!

---

## 📋 Skrip yang Tersedia

- `npm run dev` : Menjalankan development server Vite.
- `npm run build` : Membuat bundle produksi di folder `dist`.
- `npm run preview` : Meninjau hasil build produksi secara lokal.
- `npm run lint` : Menjalankan ESLint untuk memeriksa kualitas kode.
- `npm run init-db` : Menjalankan migrasi database via `init_db.cjs` (memerlukan `DATABASE_URL`).
