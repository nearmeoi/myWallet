/**
 * Smart Indonesian M-Banking & E-Wallet Receipt Text Parser
 * Supports: Mandiri (Livin'), BRImo, SeaBank, DANA, ShopeePay, BCA, GoPay, QRIS
 */

// Bank keywords detection
const BANK_RULES = [
  { key: 'mandiri', label: 'Mandiri', regex: /(?:mandiri|livin(?:'|\s*by|\s*mandiri)?)/i },
  { key: 'brimo', label: 'BRImo', regex: /(?:brimo|bank\s*bri|bank\s*rakyat\s*indonesia)/i },
  { key: 'seabank', label: 'SeaBank', regex: /(?:seabank|sea\s*bank|pt\s*bank\s*seab)/i },
  { key: 'dana', label: 'DANA', regex: /(?:dana(?:\s*indonesia|\s*wallet)?|saldo\s*dana)/i },
  { key: 'shopeepay', label: 'ShopeePay', regex: /(?:shopeepay|shopee\s*pay|spay)/i },
  { key: 'bca', label: 'BCA', regex: /(?:bca|mybca|klikbca)/i },
  { key: 'gopay', label: 'GoPay', regex: /(?:gopay|go-pay|gojek)/i },
  { key: 'qris', label: 'QRIS', regex: /(?:qris|quick\s*response\s*code)/i }
];

// Category keyword classifier
const CATEGORY_RULES = [
  {
    category: 'coffee',
    regex: /(?:kopi|coffee|kenangan|janji\s*jiwa|fore|starbucks|tomoro|point\s*coffee|kulo|cafe|kafe)/i
  },
  {
    category: 'food',
    regex: /(?:resto|makan|food|ayam|bakso|mie|nasi|burger|pizza|mcd|kfc|hokben|solaria|d'cost|martabak|warung|sate|kuliner)/i
  },
  {
    category: 'shopping',
    regex: /(?:indomaret|alfamart|alfamidi|superindo|transmart|hypermart|toko|shopee|tokopedia|lazada|blibli|tiktok\s*shop|pasar|mall|miniso|uniqlo)/i
  },
  {
    category: 'transport',
    regex: /(?:gojek|grab|maxim|pertamina|spbu|bensin|parkir|toll|krl|mrt|transjakarta|ojol|shell|bp)/i
  },
  {
    category: 'bills',
    regex: /(?:pln|listrik|pdam|bpjs|telkomsel|indihome|wifi|pulsa|paket\s*data|pbb|pajak|angsuran|tagihan)/i
  }
];

export function parseReceiptText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      success: false,
      error: 'Teks struk kosong atau tidak valid.'
    };
  }

  const cleanText = rawText.replace(/\r/g, '').trim();
  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Detect Bank
  let detectedBank = 'Bank';
  for (const rule of BANK_RULES) {
    if (rule.regex.test(cleanText)) {
      detectedBank = rule.label;
      break;
    }
  }

  // 2. Detect Amount / Nominal
  // Matches: "Rp 50.000", "Rp50.000,00", "Total Pembayaran Rp 75.000", "Nominal: 100.000"
  let amount = 0;

  const amountPatterns = [
    // Pattern with Rp: "Rp 150.000", "Rp. 150.000,00", "IDR 50.000"
    /(?:total\s*(?:pembayaran|transfer|transaksi|bayar)?|nominal(?:\s*transfer)?|jumlah(?:\s*transfer)?|rp\.?|idr)\s*[:=]?\s*r?p?\.?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]{4,})/i,
    // Loose Rp match
    /(?:rp|idr)\.?\s*([0-9]{1,3}(?:[.,][0-9]{3})+(?:[.,][0-9]{2})?|[0-9]{4,})/i
  ];

  for (const pattern of amountPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const rawNum = match[1];
      // Indonesian format: 50.000 or 50.000,00
      let normalized = rawNum;
      if (normalized.includes(',') && normalized.includes('.')) {
        // e.g. 50.000,00
        normalized = normalized.split(',')[0].replace(/\./g, '');
      } else if (normalized.includes('.')) {
        // e.g. 50.000
        normalized = normalized.replace(/\./g, '');
      } else if (normalized.includes(',')) {
        // e.g. 50000,00 or 50,000
        if (normalized.split(',')[1]?.length === 2) {
          normalized = normalized.split(',')[0];
        } else {
          normalized = normalized.replace(/,/g, '');
        }
      }
      const parsed = parseInt(normalized, 10);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // Fallback: search lines for standalone numbers that look like currency (e.g. 10.000 to 100.000.000)
  if (amount === 0) {
    for (const line of lines) {
      const lineMatch = line.match(/\b([1-9][0-9]{0,2}(?:\.[0-9]{3})+)\b/);
      if (lineMatch && lineMatch[1]) {
        const parsed = parseInt(lineMatch[1].replace(/\./g, ''), 10);
        if (parsed >= 1000) {
          amount = parsed;
          break;
        }
      }
    }
  }

  // 3. Detect Recipient / Merchant / Keterangan
  let recipient = '';
  const recipientPatterns = [
    /(?:penerima|nama\s*penerima|tujuan(?:\s*transfer)?|transfer\s*ke|kirim\s*ke|pembayaran\s*ke|merchant|nama\s*merchant|nama\s*toko)\s*[:=-]?\s*([^\n\r]+)/i,
    /(?:ke\s*rekening|kepada)\s*[:=-]?\s*([^\n\r]+)/i,
    /(?:catatan|keterangan|pesan|berita)\s*[:=-]?\s*([^\n\r]+)/i
  ];

  for (const pattern of recipientPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      let candidate = match[1].trim()
        .replace(/^(rekening|tujuan|bank|virtual account|va|qris)\s*/i, '')
        .replace(/[0-9]{6,}/g, '') // remove long account numbers
        .trim();

      if (candidate.length >= 2 && candidate.length <= 60 && !/^rp/i.test(candidate)) {
        recipient = candidate;
        break;
      }
    }
  }

  // Fallback Title
  const title = recipient || `Pembayaran ${detectedBank}`;

  // 4. Classify Category
  let category = 'food'; // sensible default
  let categoryFound = false;

  for (const rule of CATEGORY_RULES) {
    if (rule.regex.test(cleanText) || rule.regex.test(title)) {
      category = rule.category;
      categoryFound = true;
      break;
    }
  }

  if (!categoryFound) {
    category = 'other_expense';
  }

  // 5. Detect Date
  let date = new Date().toISOString().split('T')[0];
  const dateMatch = cleanText.match(/\b([0-3]?[0-9])[\/\-\s]([0-1]?[0-9]|jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)[a-z]*[\/\-\s](20[2-9][0-9])\b/i);
  if (dateMatch) {
    try {
      const day = dateMatch[1].padStart(2, '0');
      const year = dateMatch[3];
      const monthStr = dateMatch[2].toLowerCase();
      const months = {
        '01': '01', '1': '01', 'jan': '01',
        '02': '02', '2': '02', 'feb': '02',
        '03': '03', '3': '03', 'mar': '03',
        '04': '04', '4': '04', 'apr': '04',
        '05': '05', '5': '05', 'mei': '05', 'may': '05',
        '06': '06', '6': '06', 'jun': '06',
        '07': '07', '7': '07', 'jul': '07',
        '08': '08', '8': '08', 'agu': '08', 'aug': '08',
        '09': '09', '9': '09', 'sep': '09',
        '10': '10', 'okt': '10', 'oct': '10',
        '11': '11', 'nov': '11',
        '12': '12', 'des': '12', 'dec': '12'
      };
      const month = months[monthStr] || '01';
      date = `${year}-${month}-${day}`;
    } catch (e) {
      // fallback to today
    }
  }

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount || 0);

  return {
    success: amount > 0,
    bank: detectedBank,
    amount,
    formattedAmount,
    title,
    category,
    date,
    type: 'expense',
    rawExcerpt: cleanText.slice(0, 200)
  };
}
