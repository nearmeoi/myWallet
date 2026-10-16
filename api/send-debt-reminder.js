import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// In-memory sliding window rate limiter (per user ID)
const rateLimitMap = new Map();

function isRateLimited(userId, limit = 5, windowMs = 60000) {
  const now = Date.now();
  // Lazy cleanup of old entries
  if (rateLimitMap.size > 100) {
    for (const [key, timestamps] of rateLimitMap.entries()) {
      const valid = timestamps.filter(ts => now - ts < windowMs);
      if (valid.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, valid);
      }
    }
  }

  const timestamps = rateLimitMap.get(userId) || [];
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(userId, validTimestamps);
  return false;
}

// HTML sanitization helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// CRLF / Header injection prevention helper
function sanitizeHeader(str) {
  if (!str) return '';
  return String(str).replace(/[\r\n]+/g, ' ').trim();
}

export default async function handler(req, res) {
  // CORS configuration
  const allowedOrigins = [
    'https://my-wallet-amber.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Same-origin serverless invocation
    res.setHeader('Access-Control-Allow-Origin', 'https://my-wallet-amber.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan. Gunakan POST.' });
  }

  try {
    // 1. Verify Authentication via Supabase JWT
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Akses ditolak: Autentikasi diperlukan. Silakan login terlebih dahulu.' 
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ 
        error: 'Konfigurasi server tidak lengkap: Supabase URL/Key belum diatur.' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData?.user || !authData.user.email) {
      return res.status(401).json({ 
        error: 'Akses ditolak: Token autentikasi tidak valid atau telah kedaluwarsa. Silakan login kembali.' 
      });
    }

    const authenticatedUser = authData.user;

    // 2. Enforce Anti-Spam / Rate Limiting (max 5 emails per minute per user)
    if (isRateLimited(authenticatedUser.id, 5, 60000)) {
      return res.status(429).json({ 
        error: 'Terlalu banyak permintaan pengiriman email. Batas maksimum 5 email/menit. Silakan tunggu beberapa saat.' 
      });
    }

    // 3. STRICT RECIPIENT: Force to authenticated user's email only (Prevents Open Relay / Spam Bombing)
    const toEmail = authenticatedUser.email;

    // 4. Validate & Sanitize Input
    const { personName, amount, remaining, dueDate, type, notes } = req.body || {};

    if (!personName || typeof personName !== 'string' || personName.trim().length === 0) {
      return res.status(400).json({ error: 'Data tidak lengkap. Nama pihak hutang/piutang wajib diisi.' });
    }

    const safePersonName = escapeHtml(sanitizeHeader(personName.trim().slice(0, 100)));
    const safeNotes = notes ? escapeHtml(String(notes).slice(0, 500)) : '';
    const isOwe = type === 'owe';

    // 5. Verify SMTP Configuration
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = (process.env.SMTP_USER || process.env.GMAIL_USER || process.env.VITE_SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.VITE_SMTP_PASS || '').trim();

    if (!user || !pass) {
      return res.status(500).json({ 
        error: 'Kredensial SMTP belum diatur di server (SMTP_USER / SMTP_PASS).' 
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const title = isOwe 
      ? sanitizeHeader(`⏰ Pengingat Jatuh Tempo Hutang: ${safePersonName}`)
      : sanitizeHeader(`⏰ Pengingat Jatuh Tempo Piutang: ${safePersonName}`);

    const safeAmount = Number(amount) || 0;
    const safeRemaining = Number(remaining) || safeAmount;

    const formattedAmount = new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(safeAmount);

    const formattedRemaining = new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(safeRemaining);

    const formattedDueDate = dueDate 
      ? new Date(dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
      : '-';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 2px solid #1A1D1E; border-radius: 12px; background-color: #FAFAFA; box-shadow: 4px 4px 0px #1A1D1E;">
        <div style="background-color: ${isOwe ? '#FFC0C0' : '#D4F7E6'}; padding: 16px; border: 2px solid #1A1D1E; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1A1D1E; font-size: 20px; font-weight: 900;">${title}</h2>
        </div>
        <p style="font-size: 14px; color: #1A1D1E; line-height: 1.6;">
          Halo! Ini adalah pengingat otomatis dari aplikasi <strong>myWallet</strong> bahwa terdapat catatan ${isOwe ? 'hutang' : 'piutang'} yang mendekati atau telah mencapai batas waktu jatuh tempo:
        </p>
        <div style="background-color: #FFFFFF; padding: 16px; border: 2px solid #1A1D1E; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Pihak:</strong> ${safePersonName}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Total Nominal:</strong> ${formattedAmount}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #EF4444;"><strong>Sisa Belum Lunas:</strong> ${formattedRemaining}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Tanggal Jatuh Tempo:</strong> ${formattedDueDate}</p>
          ${safeNotes ? `<p style="margin: 6px 0; font-size: 14px; color: #666;"><strong>Catatan:</strong> ${safeNotes}</p>` : ''}
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 24px; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 12px;">
          Dikirim otomatis oleh <strong>myWallet</strong> untuk akun ${escapeHtml(toEmail)} • Kelola keuanganmu lebih baik.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"myWallet Reminder" <${user}>`,
      to: toEmail,
      subject: title,
      html
    });

    return res.status(200).json({ 
      success: true, 
      message: `Email pengingat berhasil dikirim ke ${toEmail}!` 
    });
  } catch (err) {
    console.error('Send debt reminder error:', err);
    return res.status(500).json({ 
      error: 'Gagal mengirim email pengingat melalui SMTP. Pastikan kredensial SMTP_USER dan SMTP_PASS sudah benar.' 
    });
  }
}
