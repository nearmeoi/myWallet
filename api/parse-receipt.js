import { parseReceiptText } from '../src/lib/receiptParser.js';

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
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Teks struk kosong. Pastikan teks hasil OCR dikirimkan dalam field "text".' 
      });
    }

    const parsed = parseReceiptText(text);

    if (!parsed.success || parsed.amount <= 0) {
      return res.status(200).json({
        success: false,
        message: 'Nominal transaksi tidak terdeteksi dari teks struk.',
        parsed
      });
    }

    return res.status(200).json({
      success: true,
      data: parsed
    });
  } catch (err) {
    console.error('Parse receipt error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan saat memproses teks struk.' 
    });
  }
}
