import React, { useState, useMemo } from 'react';
import { 
  CalendarRange, Sparkles, AlertCircle, CheckCircle2, TrendingDown, 
  HelpCircle, Sliders, ShieldAlert, PiggyBank, Utensils, Zap, Car, 
  Smile, MoreHorizontal, RefreshCw
} from 'lucide-react';
import { 
  getPaydayCycleInfo, 
  calculatePaydaySafeToSpend, 
  calculateShockAbsorber,
  calculateAllocationComparison 
} from '../../lib/paycheckPlanningEngine';
import { formatRupiah } from '../../lib/utils';

const ICON_MAP = {
  PiggyBank,
  Utensils,
  Zap,
  Car,
  Smile,
  MoreHorizontal
};

const PaydayPlanningView = ({
  wallets = [],
  transactions = [],
  categories = [],
  monthlyBudget = 0,
  paydayDate = 25,
  onUpdatePaydayDate,
  savingsTargetPercent = 30,
  onUpdateSavingsTargetPercent
}) => {
  // State interaktif simulasi
  const [simulatedExpense, setSimulatedExpense] = useState(0);
  const [isEditingPayday, setIsEditingPayday] = useState(false);
  const [tempPayday, setTempPayday] = useState(paydayDate);

  // Hitung total saldo likuid saat ini
  const liquidBalance = useMemo(() => {
    if (wallets.length > 0) {
      return wallets.reduce((acc, w) => acc + (parseFloat(w.balance) || 0), 0);
    }
    return transactions.reduce((acc, curr) => 
      curr.type === 'income' ? acc + parseFloat(curr.amount || 0) : acc - parseFloat(curr.amount || 0), 
      0
    );
  }, [wallets, transactions]);

  // Informasi siklus gajian
  const cycleInfo = useMemo(() => {
    return getPaydayCycleInfo(paydayDate);
  }, [paydayDate]);

  // Transaksi dalam siklus gajian aktif
  const cycleTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tTime = new Date(t.timestamp).getTime();
      return tTime >= cycleInfo.lastPayday.getTime() && tTime <= cycleInfo.nextPayday.getTime();
    });
  }, [transactions, cycleInfo]);

  // Total pemasukan dan pengeluaran dalam siklus ini
  const cycleIncome = useMemo(() => {
    return cycleTransactions
      .filter(t => t.type === 'income' && t.category !== 'transfer')
      .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);
  }, [cycleTransactions]);

  // Jatah harian normal
  const { safePerDay } = useMemo(() => {
    return calculatePaydaySafeToSpend(liquidBalance, 0, cycleInfo.daysRemaining);
  }, [liquidBalance, cycleInfo.daysRemaining]);

  // Hasil Shock Absorber dari simulasi pengeluaran dadakan
  const shockResult = useMemo(() => {
    return calculateShockAbsorber(liquidBalance, simulatedExpense, cycleInfo.daysRemaining);
  }, [liquidBalance, simulatedExpense, cycleInfo.daysRemaining]);

  // Rekomendasi Alokasi Ideal vs Realita
  const allocationComparisons = useMemo(() => {
    // Basis pemasukan: gunakan cycleIncome, jika 0 gunakan monthlyBudget atau estimasi
    const base = cycleIncome > 0 ? cycleIncome : (monthlyBudget > 0 ? monthlyBudget : liquidBalance);
    return calculateAllocationComparison(base, cycleTransactions, categories, savingsTargetPercent);
  }, [cycleIncome, monthlyBudget, liquidBalance, cycleTransactions, categories, savingsTargetPercent]);

  // Format tanggal gajian berikutnya
  const formattedNextPayday = useMemo(() => {
    return cycleInfo.nextPayday.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [cycleInfo.nextPayday]);

  const handleSavePayday = () => {
    const val = parseInt(tempPayday);
    if (!isNaN(val) && val >= 1 && val <= 31) {
      onUpdatePaydayDate?.(val);
      setIsEditingPayday(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* 1. PAYDAY COUNTDOWN & SAFE-TO-SPEND CARD */}
      <div className="card" style={{ 
        background: '#FEF08A', 
        padding: '20px', 
        margin: 0, 
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-15px', right: '-15px',
          width: '75px', height: '75px', background: '#D4F7E6',
          borderRadius: '50%', border: '2px solid #1A1D1E', zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarRange size={16} color="#1A1D1E" />
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#1A1D1E', letterSpacing: '0.05em' }}>
                SIKLUS MENUJU GAJIAN
              </span>
            </div>

            {/* Payday Setting Button */}
            {!isEditingPayday ? (
              <button
                type="button"
                onClick={() => { setTempPayday(paydayDate); setIsEditingPayday(true); }}
                className="btn-pressed-blue"
                style={{
                  padding: '3px 8px', background: '#FFFFFF', border: '2px solid #1A1D1E',
                  borderRadius: '6px', fontSize: '10px', fontWeight: '800', cursor: 'pointer',
                  boxShadow: '1px 1px 0px #1A1D1E', color: '#1A1D1E'
                }}
              >
                Gajian: Tgl {paydayDate} ✎
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={tempPayday}
                  onChange={(e) => setTempPayday(e.target.value)}
                  style={{
                    width: '45px', padding: '2px 4px', fontSize: '11px',
                    fontWeight: '800', border: '2px solid #1A1D1E', borderRadius: '4px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSavePayday}
                  style={{
                    padding: '3px 8px', background: '#D4F7E6', border: '2px solid #1A1D1E',
                    borderRadius: '4px', fontSize: '10px', fontWeight: '800', cursor: 'pointer'
                  }}
                >
                  OK
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '14px' }}>
            <span style={{ fontSize: '32px', fontWeight: '900', color: '#1A1D1E', lineHeight: 1 }}>
              {cycleInfo.daysRemaining}
            </span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1A1D1E' }}>
              Hari Tersisa
            </span>
            <span style={{ fontSize: '11px', color: '#555', fontWeight: '700', marginLeft: 'auto' }}>
              sampai {formattedNextPayday}
            </span>
          </div>

          {/* Safe-to-Spend Box */}
          <div style={{
            background: '#FFFFFF',
            border: '2px solid #1A1D1E',
            borderRadius: '12px',
            padding: '12px 14px',
            boxShadow: '2px 2px 0px #1A1D1E'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#666', textTransform: 'uppercase' }}>
                Jatah Belanja Aman Harian
              </span>
              <span style={{
                fontSize: '10px', fontWeight: '800', padding: '2px 6px',
                borderRadius: '6px', border: '1.5px solid #1A1D1E',
                background: safePerDay > 50000 ? '#D4F7E6' : (safePerDay > 20000 ? '#FEF08A' : '#FFD1DC')
              }}>
                {safePerDay > 50000 ? '🟢 Aman' : (safePerDay > 20000 ? '🟡 Waspada' : '🔴 Ketat')}
              </span>
            </div>

            <p style={{ fontSize: '24px', fontWeight: '900', color: '#1A1D1E', margin: '4px 0' }}>
              {formatRupiah(safePerDay)}
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#666', marginLeft: '4px' }}>/ hari</span>
            </p>

            <p style={{ fontSize: '11px', color: '#555', margin: 0, lineHeight: 1.4 }}>
              Dihitung dari sisa saldo kas aktif ({formatRupiah(liquidBalance)}) dibagi {cycleInfo.daysRemaining} hari agar saldo Anda tetap positif sampai hari gajian.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SHOCK ABSORBER / WHAT-IF SIMULATOR */}
      <div className="card" style={{ padding: '18px', margin: 0, background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', background: '#FFD1DC',
            border: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldAlert size={18} color="#1A1D1E" />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '900', margin: 0, color: '#1A1D1E' }}>
              Peredam Kejutan (Shock Absorber)
            </h4>
            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
              Simulasi dampak pengeluaran dadakan terhadap jatah harian
            </p>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {[
            { label: '0 (Reset)', val: 0 },
            { label: '+100rb', val: 100000 },
            { label: '+250rb', val: 250000 },
            { label: '+500rb', val: 500000 },
            { label: '+1 Jt', val: 1000000 }
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSimulatedExpense(item.val === 0 ? 0 : simulatedExpense + item.val)}
              className="btn-pressed-blue"
              style={{
                padding: '5px 10px',
                background: simulatedExpense === item.val ? '#D4F7E6' : '#FFFFFF',
                border: '2px solid #1A1D1E',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '1px 1px 0px #1A1D1E',
                color: '#1A1D1E'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>
            <span>Simulasi Pengeluaran Tiba-tiba:</span>
            <span style={{ color: simulatedExpense > 0 ? '#DC2626' : '#1A1D1E' }}>
              {formatRupiah(simulatedExpense)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(2000000, liquidBalance)}
            step="25000"
            value={simulatedExpense}
            onChange={(e) => setSimulatedExpense(parseInt(e.target.value) || 0)}
            style={{
              width: '100%',
              accentColor: '#1A1D1E',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Dynamic Re-Pacing Result Box */}
        {simulatedExpense > 0 ? (
          <div style={{
            padding: '12px 14px',
            background: shockResult.isDeficit ? '#FFC0C0' : '#E0E7FF',
            border: '2px solid #1A1D1E',
            borderRadius: '10px',
            boxShadow: '2px 2px 0px #1A1D1E'
          }}>
            {!shockResult.isDeficit ? (
              <>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#1A1D1E', margin: '0 0 6px 0' }}>
                  ⚡ Otomatis Re-Pacing Jatah Harian:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#666', fontWeight: '700' }}>
                    {formatRupiah(shockResult.currentDaily)}/hari
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: '#1A1D1E' }}>➔</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB' }}>
                    {formatRupiah(shockResult.newDaily)}/hari
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#333', margin: 0, lineHeight: 1.4 }}>
                  Dengan memotong jatah belanja sebesar <strong>{formatRupiah(shockResult.dailyDelta)}/hari</strong> untuk sisa {cycleInfo.daysRemaining} hari, Anda tetap dapat bertahan sampai gajian tanggal {paydayDate} tanpa berhutang!
                </p>
              </>
            ) : (
              <div>
                <p style={{ fontSize: '13px', fontWeight: '900', color: '#991B1B', margin: '0 0 4px 0' }}>
                  ⚠️ Saldo Tidak Mencukupi!
                </p>
                <p style={{ fontSize: '11px', color: '#991B1B', margin: 0, lineHeight: 1.4 }}>
                  Pengeluaran Rp {formatRupiah(simulatedExpense)} melebihi saldo kas saat ini sebesar {formatRupiah(shockResult.deficitAmount)}. Anda perlu menggunakan tabungan atau menunda pengeluaran ini.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: '10px 12px', background: '#F9FAFB', border: '1.5px dashed #9CA3AF',
            borderRadius: '8px', fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <Sparkles size={16} color="#666" />
            <span>Geser slider di atas untuk menguji ketahanan kas jika ada ban bocor, kondangan, atau belanja mendadak.</span>
          </div>
        )}
      </div>

      {/* 3. REKOMENDASI ALOKASI ANGGARAN VS REALITA */}
      <div className="card" style={{ padding: '18px', margin: 0, background: '#FFFFFF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '900', margin: 0, color: '#1A1D1E' }}>
              Rekomendasi Alokasi Ideal
            </h4>
            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
              Panduan proporsi sehat vs realita belanja siklus ini
            </p>
          </div>

          {/* Quick Target Tabungan Setting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>TABUNGAN:</span>
            <select
              value={savingsTargetPercent}
              onChange={(e) => onUpdateSavingsTargetPercent?.(parseInt(e.target.value))}
              style={{
                padding: '3px 6px', borderRadius: '6px', border: '2px solid #1A1D1E',
                fontSize: '11px', fontWeight: '800', background: '#D4F7E6', cursor: 'pointer'
              }}
            >
              <option value={20}>20%</option>
              <option value={25}>25%</option>
              <option value={30}>30%</option>
              <option value={35}>35%</option>
              <option value={40}>40%</option>
            </select>
          </div>
        </div>

        {/* Guidelines List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allocationComparisons.map(item => {
            const IconComp = ICON_MAP[item.icon] || MoreHorizontal;
            const isDanger = item.status === 'danger';
            const isWarning = item.status === 'warning';

            return (
              <div 
                key={item.id}
                style={{
                  padding: '12px',
                  background: '#F9FAFB',
                  border: '2px solid #1A1D1E',
                  borderRadius: '10px',
                  boxShadow: '1.5px 1.5px 0px #1A1D1E'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', background: item.bg,
                      border: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <IconComp size={16} color="#1A1D1E" />
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#1A1D1E', display: 'block' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#666' }}>
                        Rekomendasi: {item.percent}% ({formatRupiah(item.recommendedAmount)})
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '6px',
                    border: '1.5px solid #1A1D1E',
                    background: isDanger ? '#FFC0C0' : (isWarning ? '#FEF08A' : '#D4F7E6'),
                    color: '#1A1D1E'
                  }}>
                    {isDanger ? 'Over' : (isWarning ? 'Mendekati' : 'Aman')}
                  </span>
                </div>

                {/* Progress Comparison Bar */}
                <div style={{
                  width: '100%', height: '8px', background: '#E5E7EB',
                  borderRadius: '4px', border: '1.5px solid #1A1D1E', overflow: 'hidden',
                  position: 'relative', marginBottom: '6px'
                }}>
                  <div style={{
                    width: `${Math.min(100, item.recommendedAmount > 0 ? (item.actualSpent / item.recommendedAmount) * 100 : 0)}%`,
                    height: '100%',
                    background: isDanger ? '#EF4444' : (isWarning ? '#F59E0B' : '#10B981'),
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Actual Spending & Difference Text */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <span style={{ color: '#555', fontWeight: '600' }}>
                    Terpakai: <strong>{formatRupiah(item.actualSpent)}</strong>
                  </span>
                  <span style={{ 
                    fontWeight: '800', 
                    color: item.diff >= 0 ? '#16A34A' : '#DC2626' 
                  }}>
                    {item.diff >= 0 ? `Sisa ${formatRupiah(item.diff)}` : `Over ${formatRupiah(Math.abs(item.diff))}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '14px', padding: '10px 12px', background: '#FEF9C3',
          border: '1px solid #1A1D1E', borderRadius: '8px', fontSize: '11px', color: '#1A1D1E'
        }}>
          💡 <strong>Tips Perencanaan:</strong> Angka rekomendasi di atas dihitung otomatis berdasarkan alokasi ideal dari pemasukan Anda ({formatRupiah(cycleIncome > 0 ? cycleIncome : liquidBalance)}). Gunakan sebagai kompas agar keuangan tetap sehat tanpa harus mengunci budget secara kaku.
        </div>
      </div>

    </div>
  );
};

export default PaydayPlanningView;
