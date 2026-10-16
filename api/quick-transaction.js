import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan. Gunakan POST.' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Konfigurasi Supabase server belum diatur.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Identify User via API Key or Bearer Token
    const rawKey = req.headers['x-api-key'] || req.headers['authorization'] || req.body?.apiKey;
    if (!rawKey) {
      return res.status(401).json({ 
        error: 'Autentikasi gagal: API Key diperlukan. Masukkan header X-API-Key atau konfigurasi di iOS Shortcut.' 
      });
    }

    const cleanKey = String(rawKey).replace(/^Bearer\s+/i, '').trim();
    let userId = null;

    // Check if key is a permanent shortcut API Key
    if (cleanKey.startsWith('mw_')) {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, shortcut_api_key')
        .eq('shortcut_api_key', cleanKey)
        .maybeSingle();

      if (profile && profile.id) {
        userId = profile.id;
      }
    }

    // Fallback: Check as Supabase JWT
    if (!userId) {
      const { data: authData } = await supabase.auth.getUser(cleanKey);
      if (authData?.user?.id) {
        userId = authData.user.id;
      }
    }

    if (!userId) {
      return res.status(401).json({ 
        error: 'Kunci API tidak valid atau telah kedaluwarsa. Periksa kembali Kunci API di menu Pengaturan Akun.' 
      });
    }

    // 2. Extract Transaction Payload
    const { 
      title = 'Pengeluaran m-Banking', 
      amount, 
      type = 'expense', 
      category = 'food', 
      walletName = '',
      date 
    } = req.body || {};

    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Nominal transaksi tidak valid.' });
    }

    // 3. Find Matching Wallet
    const { data: userWallets } = await supabase
      .from('wallets')
      .select('id, name, balance, type')
      .eq('user_id', userId);

    let targetWallet = null;
    if (userWallets && userWallets.length > 0) {
      if (walletName) {
        targetWallet = userWallets.find(w => 
          w.name.toLowerCase().includes(walletName.toLowerCase()) || 
          walletName.toLowerCase().includes(w.name.toLowerCase())
        );
      }
      if (!targetWallet) {
        // Fallback to first wallet
        targetWallet = userWallets[0];
      }
    }

    const txDate = date ? new Date(date).toISOString() : new Date().toISOString();

    // 4. Insert Transaction
    const { data: newTx, error: txError } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        title: title.trim().slice(0, 100),
        amount: numAmount,
        type: type === 'income' ? 'income' : 'expense',
        category: category || 'other_expense',
        wallet_id: targetWallet ? targetWallet.id : null,
        created_at: txDate
      }])
      .select()
      .single();

    if (txError) {
      throw txError;
    }

    // 5. Update Wallet Balance if wallet exists
    if (targetWallet) {
      const currentBalance = parseFloat(targetWallet.balance || 0);
      const updatedBalance = type === 'income' 
        ? currentBalance + numAmount 
        : currentBalance - numAmount;

      await supabase
        .from('wallets')
        .update({ balance: updatedBalance })
        .eq('id', targetWallet.id);
    }

    const formatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numAmount);

    return res.status(200).json({
      success: true,
      message: `✅ Berhasil mencatat ${formatted} (${title})${targetWallet ? ` di ${targetWallet.name}` : ''}!`,
      transaction: newTx
    });
  } catch (err) {
    console.error('Quick transaction error:', err);
    return res.status(500).json({ 
      error: err.message || 'Gagal menyimpan transaksi.' 
    });
  }
}
