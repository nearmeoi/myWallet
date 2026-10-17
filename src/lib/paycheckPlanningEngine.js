/**
 * Paycheck Cycle & Dynamic Budgeting Planning Engine
 * Modul kalkulasi untuk siklus gajian, safe-to-spend, shock absorber, dan rekomendasi alokasi.
 */

/**
 * Menghitung informasi siklus gajian aktif berdasarkan tanggal gajian pengguna
 * @param {number} paydayDate - Tanggal gajian (1-31), default 25
 * @param {Date} referenceDate - Tanggal acuan (default hari ini)
 */
export function getPaydayCycleInfo(paydayDate = 25, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const currentYear = ref.getFullYear();
  const currentMonth = ref.getMonth(); // 0-indexed
  const currentDate = ref.getDate();

  const clampDate = (year, month, targetDate) => {
    // Tangani bulan dengan jumlah hari lebih sedikit (misal 31 di Feb)
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    return Math.min(targetDate, lastDayOfMonth);
  };

  let nextPayday;
  let lastPayday;

  const validPaydayThisMonth = clampDate(currentYear, currentMonth, paydayDate);

  if (currentDate < validPaydayThisMonth) {
    // Hari ini sebelum tanggal gajian bulan ini
    nextPayday = new Date(currentYear, currentMonth, validPaydayThisMonth, 23, 59, 59, 999);
    const prevMonthDate = clampDate(currentYear, currentMonth - 1, paydayDate);
    lastPayday = new Date(currentYear, currentMonth - 1, prevMonthDate, 0, 0, 0, 0);
  } else if (currentDate === validPaydayThisMonth) {
    // Hari ini pas tanggal gajian!
    // Siklus berikutnya adalah sampai gajian bulan depan
    const nextMonthDate = clampDate(currentYear, currentMonth + 1, paydayDate);
    nextPayday = new Date(currentYear, currentMonth + 1, nextMonthDate, 23, 59, 59, 999);
    lastPayday = new Date(currentYear, currentMonth, validPaydayThisMonth, 0, 0, 0, 0);
  } else {
    // Hari ini setelah tanggal gajian bulan ini
    const nextMonthDate = clampDate(currentYear, currentMonth + 1, paydayDate);
    nextPayday = new Date(currentYear, currentMonth + 1, nextMonthDate, 23, 59, 59, 999);
    lastPayday = new Date(currentYear, currentMonth, validPaydayThisMonth, 0, 0, 0, 0);
  }

  // Hitung sisa hari (inklusif hari ini sampai hari gajian)
  const msPerDay = 1000 * 60 * 60 * 24;
  const todayMidnight = new Date(currentYear, currentMonth, currentDate, 0, 0, 0, 0);
  const nextPaydayMidnight = new Date(nextPayday.getFullYear(), nextPayday.getMonth(), nextPayday.getDate(), 0, 0, 0, 0);
  
  const diffDays = Math.round((nextPaydayMidnight.getTime() - todayMidnight.getTime()) / msPerDay);
  const daysRemaining = Math.max(1, diffDays);

  const totalCycleMs = nextPaydayMidnight.getTime() - lastPayday.getTime();
  const totalDaysInCycle = Math.max(1, Math.round(totalCycleMs / msPerDay));

  return {
    paydayDate,
    nextPayday,
    lastPayday,
    daysRemaining,
    totalDaysInCycle,
    currentDate,
    isPaydayToday: currentDate === validPaydayThisMonth
  };
}

/**
 * Menghitung Jatah Harian Dinamis (Daily Safe-to-Spend)
 * @param {number} liquidBalance - Saldo total dompet likuid
 * @param {number} pendingCommitments - Tagihan/komitmen wajib yang belum dibayar
 * @param {number} daysRemaining - Sisa hari menuju gajian
 */
export function calculatePaydaySafeToSpend(liquidBalance = 0, pendingCommitments = 0, daysRemaining = 1) {
  const flexibleBalance = Math.max(0, liquidBalance - pendingCommitments);
  const safePerDay = daysRemaining > 0 ? Math.floor(flexibleBalance / daysRemaining) : flexibleBalance;

  return {
    flexibleBalance,
    safePerDay
  };
}

/**
 * Shock Absorber: Menghitung re-pacing harian otomatis saat ada pengeluaran tak terduga
 * @param {number} liquidBalance - Saldo saat ini
 * @param {number} suddenExpense - Pengeluaran mendadak yang disimulasikan
 * @param {number} daysRemaining - Sisa hari menuju gajian
 */
export function calculateShockAbsorber(liquidBalance = 0, suddenExpense = 0, daysRemaining = 1) {
  const currentDaily = daysRemaining > 0 ? Math.floor(liquidBalance / daysRemaining) : liquidBalance;
  const newBalance = Math.max(0, liquidBalance - suddenExpense);
  const newDaily = daysRemaining > 0 ? Math.floor(newBalance / daysRemaining) : newBalance;
  const dailyDelta = currentDaily - newDaily;
  const isDeficit = suddenExpense > liquidBalance;
  const deficitAmount = isDeficit ? suddenExpense - liquidBalance : 0;

  return {
    currentDaily,
    newBalance,
    newDaily,
    dailyDelta,
    isDeficit,
    deficitAmount
  };
}

/**
 * Template Rekomendasi Alokasi Anggaran Ideal
 */
export const DEFAULT_ALLOCATION_GUIDELINES = [
  { id: 'saving', name: 'Tabungan & Investasi', defaultPercent: 30, icon: 'PiggyBank', bg: '#D4F7E6', keywords: ['tabungan', 'saving', 'investasi', 'dana darurat', 'saham', 'reksadana', 'emas', 'deposito'] },
  { id: 'food', name: 'Makan & Minum', defaultPercent: 25, icon: 'Utensils', bg: '#FEF08A', keywords: ['makan', 'food', 'kuliner', 'restoran', 'lunch', 'dinner', 'sarapan', 'jajan', 'kopi', 'sembako'] },
  { id: 'bills', name: 'Tagihan & Rutin', defaultPercent: 15, icon: 'Zap', bg: '#FFD1DC', keywords: ['tagihan', 'listrik', 'wifi', 'air', 'kost', 'sewa', 'bills', 'pulsa', 'kuota', 'iuran', 'bpjs'] },
  { id: 'transport', name: 'Transportasi', defaultPercent: 10, icon: 'Car', bg: '#E0E7FF', keywords: ['transport', 'bensin', 'bbm', 'ojol', 'gojek', 'grab', 'parkir', 'tol', 'kereta', 'bus', 'service', 'servis'] },
  { id: 'entertainment', name: 'Gaya Hidup & Hiburan', defaultPercent: 10, icon: 'Smile', bg: '#E0CCF8', keywords: ['hiburan', 'nongkrong', 'belanja', 'shopping', 'game', 'netflix', 'spotify', 'bioskop', 'hobi', 'entertainment'] },
  { id: 'other', name: 'Lainnya & Tak Terduga', defaultPercent: 10, icon: 'MoreHorizontal', bg: '#F3F4F6', keywords: ['lain', 'other', 'amal', 'sedekah', 'hadiah', 'donasi'] }
];

/**
 * Memetakan transaksi atau kategori pengguna ke panduan rekomendasi
 * @param {string} catNameOrId - Nama atau ID kategori
 */
export function mapCategoryToGuidelineId(catNameOrId = '') {
  const lower = (catNameOrId || '').toLowerCase().trim();
  for (const guideline of DEFAULT_ALLOCATION_GUIDELINES) {
    if (guideline.id === lower) return guideline.id;
    if (guideline.keywords.some(k => lower.includes(k))) {
      return guideline.id;
    }
  }
  return 'other';
}

/**
 * Menghitung perbandingan alokasi rekomendasi vs realita pengeluaran pengguna
 * @param {number} totalIncome - Total pemasukan siklus ini (atau budget)
 * @param {Array} cycleTransactions - Daftar transaksi dalam siklus gajian
 * @param {Array} categories - Master kategori pengguna
 * @param {number} savingsPercent - Target tabungan (default 30)
 */
export function calculateAllocationComparison(totalIncome = 0, cycleTransactions = [], categories = [], savingsPercent = 30) {
  // Jika pemasukan 0, gunakan total pengeluaran atau fallback minimal agar kalkulasi tetap proporsional
  const totalExpense = cycleTransactions
    .filter(t => t.type === 'expense' && t.category !== 'transfer')
    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

  const baseAmount = totalIncome > 0 ? totalIncome : (totalExpense > 0 ? totalExpense : 3000000);

  // Buat copy panduan dengan persentase tabungan yang disesuaikan
  const guidelines = DEFAULT_ALLOCATION_GUIDELINES.map(g => {
    if (g.id === 'saving') {
      return { ...g, percent: savingsPercent };
    }
    return { ...g, percent: g.defaultPercent };
  });

  // Normalisasi persentase agar total = 100% jika user mengubah tabungan
  const nonSavingTotal = guidelines.filter(g => g.id !== 'saving').reduce((acc, g) => acc + g.percent, 0);
  const targetNonSaving = 100 - savingsPercent;
  const factor = targetNonSaving / (nonSavingTotal || 1);

  const adjustedGuidelines = guidelines.map(g => {
    if (g.id === 'saving') return { ...g, percent: savingsPercent };
    return { ...g, percent: Math.round(g.percent * factor) };
  });

  // Hitung pengeluaran aktual per guideline bucket
  const spentByGuideline = {};
  adjustedGuidelines.forEach(g => { spentByGuideline[g.id] = 0; });

  cycleTransactions
    .filter(t => t.type === 'expense' && t.category !== 'transfer')
    .forEach(tx => {
      const catObj = categories.find(c => c.id?.toString() === tx.category?.toString());
      const catName = catObj ? catObj.name : (tx.category || '');
      const guidelineId = mapCategoryToGuidelineId(catName || tx.category);
      spentByGuideline[guidelineId] = (spentByGuideline[guidelineId] || 0) + parseFloat(tx.amount || 0);
    });

  return adjustedGuidelines.map(g => {
    const recommendedAmount = Math.round(baseAmount * (g.percent / 100));
    const actualSpent = spentByGuideline[g.id] || 0;
    const actualPercent = baseAmount > 0 ? Math.round((actualSpent / baseAmount) * 100) : 0;
    const diff = recommendedAmount - actualSpent; // Positif = hemat/aman, Negatif = over

    let status = 'safe'; // 'safe', 'warning', 'danger'
    if (actualSpent > recommendedAmount * 1.15) {
      status = 'danger'; // Over > 15%
    } else if (actualSpent > recommendedAmount) {
      status = 'warning'; // Sedikit over
    }

    return {
      id: g.id,
      name: g.name,
      icon: g.icon,
      bg: g.bg,
      percent: g.percent,
      actualPercent,
      recommendedAmount,
      actualSpent,
      diff,
      status
    };
  });
}
