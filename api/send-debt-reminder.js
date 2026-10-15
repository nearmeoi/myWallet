import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode request tidak diizinkan. Gunakan POST.' });
  }

  try {
    const { toEmail, personName, amount, remaining, dueDate, type, notes } = req.body || {};

    if (!toEmail || !personName) {
      return res.status(400).json({ error: 'Data tidak lengkap. Email tujuan dan nama wajib diisi.' });
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.VITE_SMTP_USER;
    const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.VITE_SMTP_PASS;

    if (!user || !pass) {
      return res.status(400).json({ 
        error: 'Kredensial SMTP belum diatur di Vercel Environment Variables. Silakan tambahkan SMTP_USER dan SMTP_PASS di Project Settings > Environment Variables.' 
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const isOwe = type === 'owe';
    const title = isOwe 
      ? `⏰ Pengingat Jatuh Tempo Hutang: ${personName}`
      : `⏰ Pengingat Jatuh Tempo Piutang: ${personName}`;

    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);
    const formattedRemaining = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(remaining || amount || 0);
    const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 2px solid #1A1D1E; border-radius: 12px; background-color: #FAFAFA; box-shadow: 4px 4px 0px #1A1D1E;">
        <div style="background-color: ${isOwe ? '#FFC0C0' : '#D4F7E6'}; padding: 16px; border: 2px solid #1A1D1E; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1A1D1E; font-size: 20px; font-weight: 900;">${title}</h2>
        </div>
        <p style="font-size: 14px; color: #1A1D1E; line-height: 1.6;">
          Halo! Ini adalah pengingat otomatis dari aplikasi <strong>myWallet</strong> bahwa terdapat catatan ${isOwe ? 'hutang' : 'piutang'} yang mendekati atau telah mencapai batas waktu jatuh tempo:
        </p>
        <div style="background-color: #FFFFFF; padding: 16px; border: 2px solid #1A1D1E; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Pihak:</strong> ${personName}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Total Nominal:</strong> ${formattedAmount}</p>
          <p style="margin: 6px 0; font-size: 14px; color: #EF4444;"><strong>Sisa Belum Lunas:</strong> ${formattedRemaining}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Tanggal Jatuh Tempo:</strong> ${formattedDueDate}</p>
          ${notes ? `<p style="margin: 6px 0; font-size: 14px; color: #666;"><strong>Catatan:</strong> ${notes}</p>` : ''}
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 24px; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 12px;">
          Dikirim otomatis oleh <strong>myWallet</strong> • Kelola keuanganmu lebih baik.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"myWallet Reminder" <${user}>`,
      to: toEmail,
      subject: title,
      html
    });

    return res.status(200).json({ success: true, message: `Email pengingat berhasil dikirim ke ${toEmail}!` });
  } catch (err) {
    console.error('Send debt reminder error:', err);
    return res.status(500).json({ error: err.message || 'Gagal mengirim email pengingat melalui SMTP' });
  }
}
