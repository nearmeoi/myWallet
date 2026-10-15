import React, { useState } from 'react';
import { 
  ArrowLeft, MoreHorizontal, Banknote, CreditCard, Smartphone, 
  Target, TrendingUp, TrendingDown, Wallet, AlertCircle
} from 'lucide-react';
import { AVAILABLE_ICONS } from '../../lib/constants';
import { formatRupiah } from '../../lib/utils';

const WalletTab = ({
  monthlyBudget = 0,
  budgetProgress = 0,
  wallets = [],
  categories = [],
  transactions = [],
  onOpenModal,
  onBack
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const getCategoryById = (id) => {
    if (id === 'saving' || id === 'saving_in' || id === 'saving_out') {
      return { name: 'Tabungan', icon: 'PiggyBank', bg: '#D4F7E6' };
    }
    if (id === 'transfer') {
      return { name: 'Transfer', icon: 'ArrowLeftRight', bg: '#E0CCF8' };
    }
    return categories.find(c => c.id === id) || { name: 'Lainnya', icon: 'MoreHorizontal', bg: '#F3F4F6' };
  };

  // 1. Transactions for the selected period
  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.timestamp);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income' && t.category !== 'transfer')
    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

  const monthExpense = monthTransactions
    .filter(t => t.type === 'expense' && t.category !== 'transfer')
    .reduce((acc, t) => acc + parseFloat(t.amount || 0), 0);

  const monthNet = monthIncome - monthExpense;

  // Breakdown Expense by Category
  const expenseByCategory = {};
  monthTransactions
    .filter(t => t.type === 'expense' && t.category !== 'transfer')
    .forEach(t => {
      const catId = t.category || 'other_expense';
      expenseByCategory[catId] = (expenseByCategory[catId] || 0) + parseFloat(t.amount || 0);
    });

  const sortedExpenseCategories = Object.keys(expenseByCategory)
    .map(catId => {
      const cat = getCategoryById(catId);
      const amount = expenseByCategory[catId];
      const percentage = monthExpense > 0 ? (amount / monthExpense) * 100 : 0;
      return { ...cat, id: catId, amount, percentage };
    })
    .sort((a, b) => b.amount - a.amount);

  // Breakdown Income by Category
  const incomeByCategory = {};
  monthTransactions
    .filter(t => t.type === 'income' && t.category !== 'transfer')
    .forEach(t => {
      const catId = t.category || 'other_income';
      incomeByCategory[catId] = (incomeByCategory[catId] || 0) + parseFloat(t.amount || 0);
    });

  const sortedIncomeCategories = Object.keys(incomeByCategory)
    .map(catId => {
      const cat = getCategoryById(catId);
      const amount = incomeByCategory[catId];
      const percentage = monthIncome > 0 ? (amount / monthIncome) * 100 : 0;
      return { ...cat, id: catId, amount, percentage };
    })
    .sort((a, b) => b.amount - a.amount);

  // Breakdown Expense by Wallet
  const expenseByWallet = {};
  monthTransactions
    .filter(t => t.type === 'expense' && t.category !== 'transfer' && t.walletId)
    .forEach(t => {
      const wId = t.walletId;
      expenseByWallet[wId] = (expenseByWallet[wId] || 0) + parseFloat(t.amount || 0);
    });

  const sortedWalletExpenses = Object.keys(expenseByWallet)
    .map(wId => {
      const wallet = wallets.find(w => w.id?.toString() === wId.toString()) || { name: 'Dompet Lain', color: '#E5E7EB' };
      const amount = expenseByWallet[wId];
      const percentage = monthExpense > 0 ? (amount / monthExpense) * 100 : 0;
      return { ...wallet, id: wId, amount, percentage };
    })
    .sort((a, b) => b.amount - a.amount);

  const budgetUsagePercent = monthlyBudget > 0 ? Math.round((monthExpense / monthlyBudget) * 100) : 0;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Back Button */}
      {onBack && (
        <div>
          <button 
            onClick={onBack}
            className="btn-pressed-blue"
            style={{
              padding: '6px 14px', background: '#FFFFFF', border: '2px solid #1A1D1E',
              borderRadius: '8px', fontWeight: '800', fontSize: '13px',
              display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              boxShadow: '2px 2px 0px #1A1D1E', color: '#1A1D1E'
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>Ringkasan & Analisis.</h2>
      </div>

      {/* Period Selector Card */}
      <div className="card" style={{ padding: '14px', margin: 0, background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800' }}>PERIODE LAPORAN:</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '2px solid #1A1D1E', fontWeight: '700', fontSize: '12px' }}
            >
              {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '2px solid #1A1D1E', fontWeight: '700', fontSize: '12px' }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Cashflow Net Summary Card */}
      <div className="card" style={{ padding: '18px', margin: 0, background: '#FFFFFF' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#666', marginBottom: '12px', textTransform: 'uppercase' }}>
          Arus Kas ({months[selectedMonth]} {selectedYear})
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>TOTAL PEMASUKAN</p>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#16a34a' }}>+{formatRupiah(monthIncome)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626' }}>TOTAL PENGELUARAN</p>
            <p style={{ fontSize: '18px', fontWeight: '900', color: '#dc2626' }}>-{formatRupiah(monthExpense)}</p>
          </div>
        </div>

        <div style={{ 
          padding: '12px', borderRadius: '10px', 
          background: monthNet >= 0 ? '#D4F7E6' : '#FFC0C0', 
          border: '2px solid #1A1D1E',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '800' }}>
              {monthNet >= 0 ? 'SURPLUS / TABUNGAN BERSIH' : 'DEFISIT PENGELUARAN'}
            </p>
            <p style={{ fontSize: '18px', fontWeight: '900' }}>
              {monthNet >= 0 ? `+${formatRupiah(monthNet)}` : `-${formatRupiah(Math.abs(monthNet))}`}
            </p>
          </div>
          <span style={{ 
            fontSize: '11px', fontWeight: '800', padding: '4px 8px', 
            background: '#FFFFFF', border: '1px solid #1A1D1E', borderRadius: '6px' 
          }}>
            {monthIncome > 0 ? `${Math.round((monthExpense / monthIncome) * 100)}% Terpakai` : '0%'}
          </span>
        </div>
      </div>

      {/* Budget Status Card */}
      <div className="card" style={{ padding: '18px', margin: 0, background: '#FEF9C3' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>BUDGET BULANAN</span>
            <h4 style={{ fontSize: '18px', fontWeight: '900' }}>
              {monthlyBudget > 0 ? formatRupiah(monthlyBudget) : 'Belum Diatur'}
            </h4>
          </div>
          <button
            onClick={() => onOpenModal('budget')}
            style={{
              padding: '6px 12px', background: '#FFFFFF', border: '2px solid #1A1D1E',
              borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer',
              boxShadow: '2px 2px 0px #1A1D1E'
            }}
          >
            {monthlyBudget > 0 ? 'Ubah Budget' : '+ Pasang Budget'}
          </button>
        </div>

        {monthlyBudget > 0 && (
          <>
            <div style={{ height: '12px', background: '#FFFFFF', border: '2px solid #1A1D1E', borderRadius: '6px', overflow: 'hidden', marginTop: '10px' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(budgetUsagePercent, 100)}%`,
                background: monthExpense > monthlyBudget ? '#EF4444' : '#1A1D1E',
                transition: 'width 0.4s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', fontWeight: '700' }}>
              <span>{budgetUsagePercent}% terpakai</span>
              <span style={{ color: monthExpense > monthlyBudget ? '#EF4444' : '#1A1D1E' }}>
                {monthExpense > monthlyBudget ? `Overbudget ${formatRupiah(monthExpense - monthlyBudget)}!` : `Sisa ${formatRupiah(monthlyBudget - monthExpense)}`}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Category Expense Breakdown */}
      <div className="card" style={{ padding: '18px', margin: 0, background: '#FFFFFF' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px' }}>
          Pengeluaran Berdasarkan Kategori.
        </h4>

        {sortedExpenseCategories.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', padding: '16px' }}>
            Belum ada pengeluaran di periode ini.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sortedExpenseCategories.map(cat => {
              const IconComp = AVAILABLE_ICONS[cat.icon] || MoreHorizontal;
              return (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', background: cat.bg || '#FFC0C0',
                        border: '1px solid #1A1D1E', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComp size={16} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>{cat.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900' }}>{formatRupiah(cat.amount)}</span>
                      <span style={{ fontSize: '11px', color: '#666', fontWeight: '700', marginLeft: '6px' }}>
                        ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ height: '8px', background: '#F3F4F6', border: '1px solid #1A1D1E', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(cat.percentage, 100)}%`,
                      background: cat.bg || '#FFC0C0'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Income Breakdown */}
      {sortedIncomeCategories.length > 0 && (
        <div className="card" style={{ padding: '18px', margin: 0, background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px' }}>
            Sumber Pemasukan.
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sortedIncomeCategories.map(cat => {
              const IconComp = AVAILABLE_ICONS[cat.icon] || MoreHorizontal;
              return (
                <div key={cat.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', background: cat.bg || '#D4F7E6',
                        border: '1px solid #1A1D1E', borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComp size={16} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>{cat.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#16a34a' }}>+{formatRupiah(cat.amount)}</span>
                      <span style={{ fontSize: '11px', color: '#666', fontWeight: '700', marginLeft: '6px' }}>
                        ({cat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  <div style={{ height: '8px', background: '#F3F4F6', border: '1px solid #1A1D1E', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(cat.percentage, 100)}%`,
                      background: cat.bg || '#D4F7E6'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Saldo & Aktivitas per Dompet */}
      <div className="card" style={{ padding: '18px', margin: 0, background: '#FFFFFF' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px' }}>
          Saldo & Pengeluaran Dompet.
        </h4>
        {wallets.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', padding: '16px' }}>
            Belum ada dompet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wallets.map(w => {
              const spent = expenseByWallet[w.id] || 0;
              return (
                <div key={w.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', background: '#F9FAFB', border: '2px solid #1A1D1E', borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '36px', height: '36px', border: '2px solid #1A1D1E', borderRadius: '8px',
                      background: w.type === 'cash' ? '#D4F7E6' : w.type === 'bank' ? '#FEF9C3' : '#E0CCF8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {w.type === 'cash' ? <Banknote size={18} /> : w.type === 'bank' ? <CreditCard size={18} /> : <Smartphone size={18} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: '800', fontSize: '14px' }}>{w.name}</p>
                      <p style={{ fontSize: '11px', color: '#666' }}>Saldo: {formatRupiah(w.balance)}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: '800', color: spent > 0 ? '#dc2626' : '#666' }}>
                      {spent > 0 ? `-${formatRupiah(spent)}` : 'Rp 0'}
                    </p>
                    <p style={{ fontSize: '10px', color: '#666', fontWeight: '700' }}>keluar bulan ini</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletTab;
