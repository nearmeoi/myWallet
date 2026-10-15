import React, { useState } from 'react';
import { 
  ArrowDownLeft, ArrowUpRight, MoreHorizontal, ArrowLeftRight, 
  Search, Filter, AlertCircle, PieChart, ListOrdered, 
  TrendingUp, TrendingDown, Wallet, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import TransactionCard from '../TransactionCard';
import { AVAILABLE_ICONS } from '../../lib/constants';
import { formatDate, formatRupiah } from '../../lib/utils';
import { useDebt } from '../../context/DebtContext';

const HomeTab = ({ 
  balance, 
  transactions = [], 
  categories = [], 
  wallets = [], 
  monthlyBudget = 0,
  budgetProgress = 0,
  onOpenModal, 
  onDelete, 
  onEdit 
}) => {
  const { totalOwed } = useDebt();

  // Mode: 'transactions' (list) or 'summary' (analytics & charts)
  const [viewMode, setViewMode] = useState('transactions');

  // Transaction List Filters
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Date Filter State
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

  // Filtered transactions for the list view
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.timestamp);
    const isTransfer = t.category === 'transfer';

    let matchesType = false;
    if (filterType === 'all') matchesType = true;
    else if (filterType === 'transfer') matchesType = isTransfer;
    else if (filterType === 'income') matchesType = selectedWallet === 'all' ? (t.type === 'income' && !isTransfer) : (t.type === 'income');
    else if (filterType === 'expense') matchesType = selectedWallet === 'all' ? (t.type === 'expense' && !isTransfer) : (t.type === 'expense');

    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWallet = selectedWallet === 'all' || t.walletId?.toString() === selectedWallet.toString();
    const matchesDate = tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;

    const isTransferIncome = selectedWallet === 'all' && isTransfer && t.type === 'income';

    return matchesType && matchesSearch && matchesWallet && matchesDate && !isTransferIncome;
  });

  const visibleTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 5);

  const groupedTransactions = visibleTransactions.reduce((groups, tx) => {
    const date = new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {});

  // Current month stats for quick top banner
  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  return (
    <>
      {/* 1. TOTAL SALDO CARD */}
      <section className="card" style={{ background: '#BBEFFA', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Saldo.</p>
          <h2 style={{ fontSize: '38px', fontWeight: '900', marginBottom: totalOwed > 0 ? '8px' : '20px', lineHeight: '1' }}>
            {formatRupiah(balance)}
          </h2>

          {/* Debt Indicator */}
          {totalOwed > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginBottom: '16px', padding: '6px 10px',
              background: '#FFC0C0', border: '2px solid #1A1D1E', borderRadius: '8px',
              width: 'fit-content'
            }}>
              <AlertCircle size={14} color="#EF4444" />
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#EF4444' }}>
                Hutang: -{formatRupiah(totalOwed)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => onOpenModal('transaction', 'income')} className="btn-pressed-blue" style={{
              flex: 1, minWidth: '100px', padding: '12px 10px', background: '#1A1D1E', color: '#fff',
              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
              boxShadow: '3px 3px 0px rgba(0,0,0,0.2)', cursor: 'pointer'
            }}>
              <ArrowDownLeft size={16} /> Masuk
            </button>
            <button onClick={() => onOpenModal('transaction', 'expense')} className="btn-pressed-blue" style={{
              flex: 1, minWidth: '100px', padding: '12px 10px', background: '#FFFFFF', color: '#1A1D1E',
              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
              boxShadow: '3px 3px 0px #1A1D1E', cursor: 'pointer'
            }}>
              <ArrowUpRight size={16} /> Keluar
            </button>
            <button onClick={() => onOpenModal('transfer')} className="btn-pressed-blue" style={{
              flex: '1 1 100%', padding: '12px 10px', background: '#E0CCF8', color: '#1A1D1E',
              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px',
              boxShadow: '3px 3px 0px #1A1D1E', marginTop: '4px', cursor: 'pointer'
            }}>
              <ArrowLeftRight size={16} /> Transfer Antar Dompet
            </button>
          </div>
        </div>

        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#FEF08A', borderRadius: '50%', border: '2px solid #1A1D1E', zIndex: 0 }} />
      </section>

      {/* 2. INTERACTIVE MINI SUMMARY CARDS (Clickable to switch to Summary view) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
        <div 
          onClick={() => setViewMode('summary')}
          className="card btn-pressed-blue"
          style={{ 
            background: '#D4F7E6', margin: 0, padding: '14px', cursor: 'pointer',
            border: '2px solid #1A1D1E', borderRadius: '12px',
            boxShadow: '3px 3px 0px #1A1D1E', position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1A1D1E' }}>MASUK {months[selectedMonth].toUpperCase()}</span>
            <TrendingUp size={14} color="#1A1D1E" />
          </div>
          <p style={{ fontSize: '17px', fontWeight: '900', color: '#1A1D1E' }}>+{formatRupiah(monthIncome)}</p>
          <p style={{ fontSize: '10px', color: '#444', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            Lihat analisis <ChevronRight size={12} />
          </p>
        </div>

        <div 
          onClick={() => setViewMode('summary')}
          className="card btn-pressed-blue"
          style={{ 
            background: '#FFC0C0', margin: 0, padding: '14px', cursor: 'pointer',
            border: '2px solid #1A1D1E', borderRadius: '12px',
            boxShadow: '3px 3px 0px #1A1D1E', position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#1A1D1E' }}>KELUAR {months[selectedMonth].toUpperCase()}</span>
            <TrendingDown size={14} color="#1A1D1E" />
          </div>
          <p style={{ fontSize: '17px', fontWeight: '900', color: '#1A1D1E' }}>-{formatRupiah(monthExpense)}</p>
          <p style={{ fontSize: '10px', color: '#444', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            Lihat analisis <ChevronRight size={12} />
          </p>
        </div>
      </div>

      {/* 3. SEGMENTED CONTROL: [ Riwayat Transaksi ] vs [ Ringkasan & Grafik ] */}
      <div style={{ 
        display: 'flex', gap: '8px', marginTop: '20px', marginBottom: '16px',
        background: '#FFFFFF', padding: '4px', borderRadius: '12px',
        border: '2px solid #1A1D1E', boxShadow: '3px 3px 0px #1A1D1E'
      }}>
        <button
          onClick={() => setViewMode('transactions')}
          style={{
            flex: 1, padding: '10px 8px', borderRadius: '8px', border: 'none',
            background: viewMode === 'transactions' ? '#1A1D1E' : 'transparent',
            color: viewMode === 'transactions' ? '#FFFFFF' : '#1A1D1E',
            fontWeight: '800', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <ListOrdered size={16} /> Riwayat Transaksi
        </button>
        <button
          onClick={() => setViewMode('summary')}
          style={{
            flex: 1, padding: '10px 8px', borderRadius: '8px', border: 'none',
            background: viewMode === 'summary' ? '#1A1D1E' : 'transparent',
            color: viewMode === 'summary' ? '#FFFFFF' : '#1A1D1E',
            fontWeight: '800', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <PieChart size={16} /> Ringkasan & Grafik
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: RIWAYAT TRANSAKSI */}
      {/* ========================================================================= */}
      {viewMode === 'transactions' && (
        <div className="animate-slide-up">
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#999',
                  pointerEvents: 'none'
                }} 
              />
              <input 
                type="text" 
                placeholder="Cari transaksi..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  width: '100%', 
                  height: '44px',
                  padding: '0 12px 0 40px', 
                  borderRadius: '12px', 
                  border: '2px solid #1A1D1E', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  fontFamily: 'inherit',
                  background: '#FFFFFF',
                  margin: 0
                }}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="btn-pressed-blue"
              style={{ 
                width: '44px',
                height: '44px',
                minWidth: '44px',
                borderRadius: '12px', 
                border: '2px solid #1A1D1E', 
                background: showFilters ? '#1A1D1E' : '#FFFFFF', 
                color: showFilters ? '#FFFFFF' : '#1A1D1E',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 0.1)',
                padding: 0,
                margin: 0,
                flexShrink: 0
              }}
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="card animate-slide-up" style={{ marginBottom: '16px', padding: '16px', background: '#F3F4F6', border: '2px solid #1A1D1E' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', display: 'block' }}>BULAN</label>
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #1A1D1E', fontWeight: '700', fontSize: '12px' }}
                  >
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', display: 'block' }}>TAHUN</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #1A1D1E', fontWeight: '700', fontSize: '12px' }}
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', display: 'block' }}>FILTER DOMPET</label>
                <select 
                  value={selectedWallet} 
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #1A1D1E', fontWeight: '700', fontSize: '12px' }}
                >
                  <option value="all">Semua Dompet</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', display: 'block' }}>TIPE</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { key: 'all', label: 'Semua' },
                    { key: 'income', label: 'Masuk' },
                    { key: 'expense', label: 'Keluar' },
                    { key: 'transfer', label: 'Transfer' }
                  ].map(t => (
                    <button key={t.key} onClick={() => setFilterType(t.key)} style={{
                      flex: 1, padding: '6px 4px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                      background: filterType === t.key ? '#1A1D1E' : '#FFFFFF',
                      color: filterType === t.key ? '#FFFFFF' : '#1A1D1E',
                      border: '1px solid #1A1D1E',
                      cursor: 'pointer'
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transaction Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>
              Riwayat <span className="highlight-text">Transaksi</span>.
            </h3>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>
              {months[selectedMonth]} {selectedYear}
            </span>
          </div>

          {/* Grouped Transaction List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.keys(groupedTransactions).length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: '#F3F4F6' }}>
                <p style={{ fontWeight: '700', fontSize: '15px' }}>Tidak Ada Transaksi</p>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Belum ada catatan transaksi di periode ini.</p>
              </div>
            ) : (
              Object.keys(groupedTransactions).map(date => (
                <div key={date}>
                  <p style={{ fontSize: '12px', fontWeight: '800', color: '#666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{date}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {groupedTransactions[date].map(tx => {
                      const cat = getCategoryById(tx.category);
                      const IconComp = AVAILABLE_ICONS[cat.icon] || MoreHorizontal;
                      const wallet = wallets.find(w => w.id?.toString() === tx.walletId?.toString());
                      const walletName = wallet ? wallet.name : '';

                      return (
                        <div key={tx.id} className="animate-slide-up">
                          <TransactionCard
                            transaction={{ ...tx, date: formatDate(tx.timestamp), walletName }}
                            category={{ ...cat, icon: IconComp }}
                            onEdit={() => onEdit(tx)}
                            onDelete={() => onDelete(tx.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredTransactions.length > 5 && (
            <button onClick={() => setShowAllTransactions(!showAllTransactions)} style={{
              width: '100%', padding: '12px', marginTop: '16px', background: '#FFFFFF',
              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
              boxShadow: '3px 3px 0px #1A1D1E', color: '#1A1D1E', cursor: 'pointer'
            }}>
              {showAllTransactions ? 'Sembunyikan' : `Lihat Semua (${filteredTransactions.length} Transaksi)`}
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: RINGKASAN & GRAFIK (Point C Implementation) */}
      {/* ========================================================================= */}
      {viewMode === 'summary' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
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
                    width: `${Math.min((monthExpense / monthlyBudget) * 100, 100)}%`,
                    background: monthExpense > monthlyBudget ? '#EF4444' : '#1A1D1E',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', fontWeight: '700' }}>
                  <span>{Math.round((monthExpense / monthlyBudget) * 100)}% terpakai</span>
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

                      {/* Bar progress */}
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

          {/* Expense per Wallet Breakdown */}
          {sortedWalletExpenses.length > 0 && (
            <div className="card" style={{ padding: '18px', margin: 0, background: '#FFFFFF' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px' }}>
                Pengeluaran per Dompet / Rekening.
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedWalletExpenses.map(w => (
                  <div key={w.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: w.color || '#1A1D1E', border: '1px solid #1A1D1E' }} />
                      <span style={{ fontSize: '13px', fontWeight: '800' }}>{w.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '13px', fontWeight: '900' }}>{formatRupiah(w.amount)}</p>
                      <p style={{ fontSize: '10px', color: '#666', fontWeight: '700' }}>{w.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
};

export default HomeTab;
