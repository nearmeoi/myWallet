import React, { useState } from 'react';
import { 
  ArrowDownLeft, ArrowUpRight, MoreHorizontal, ArrowLeftRight, 
  Search, Filter, AlertCircle, PieChart
} from 'lucide-react';
import TransactionCard from '../TransactionCard';
import { AVAILABLE_ICONS } from '../../lib/constants';
import { formatDate, formatRupiah } from '../../lib/utils';
import { useDebt } from '../../context/DebtContext';

const HomeTab = ({ 
  user,
  balance, 
  transactions = [], 
  categories = [], 
  wallets = [], 
  onOpenModal, 
  onOpenSummary,
  onRequireAuth,
  onDelete, 
  onEdit 
}) => {
  const { totalOwed } = useDebt();

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

  return (
    <>
      {/* Guest Mode Notice */}
      {!user && (
        <div style={{
          padding: '12px 14px', background: '#FEF9C3', border: '2px solid #1A1D1E',
          borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '10px', boxShadow: '2px 2px 0px #1A1D1E'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#1A1D1E" />
            <div>
              <p style={{ fontSize: '13px', fontWeight: '800', margin: 0 }}>Mode Tamu</p>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Login untuk mencatat transaksi Anda</p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            style={{
              padding: '6px 12px', background: '#1A1D1E', color: '#FFFFFF',
              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '800',
              fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            Login / Daftar
          </button>
        </div>
      )}

      {/* TOTAL SALDO CARD */}
      <section className="card" style={{ background: '#BBEFFA', position: 'relative', overflow: 'hidden' }}>
        {/* Yellow circle ornament (preserved) */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#FEF08A', borderRadius: '50%', border: '2px solid #1A1D1E', zIndex: 0 }} />

        {/* PieChart Icon Button in Top Right of Card (opens unified summary) */}
        <button
          onClick={onOpenSummary}
          title="Lihat Ringkasan & Grafik"
          className="btn-pressed-blue"
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 2,
            width: '40px',
            height: '40px',
            background: '#FFFFFF',
            border: '2px solid #1A1D1E',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 2px 0px #1A1D1E',
            cursor: 'pointer',
            color: '#1A1D1E'
          }}
        >
          <PieChart size={20} />
        </button>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Saldo.</p>
          <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: totalOwed > 0 ? '8px' : '24px', lineHeight: '1' }}>
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
      </section>

      {/* Search & Filter Bar */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
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

      {showFilters && (
        <div className="card animate-slide-up" style={{ marginTop: '12px', padding: '16px', background: '#F3F4F6', border: '2px solid #1A1D1E' }}>
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

      <div style={{ marginTop: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>
          Riwayat <span className="highlight-text">Transaksi</span>.
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: '#F3F4F6' }}>
            <p style={{ fontWeight: '600' }}>Kosong!</p>
            <p style={{ fontSize: '13px' }}>Tidak ada transaksi di periode ini.</p>
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
          {showAllTransactions ? 'Sembunyikan' : 'Lihat Semua'}
        </button>
      )}
    </>
  );
};

export default HomeTab;
