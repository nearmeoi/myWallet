import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import TransactionCard from '../TransactionCard';
import { AVAILABLE_ICONS } from '../../lib/constants';
import { formatDate, formatRupiah } from '../../lib/utils';

const HomeTab = ({ 
  balance, 
  transactions, 
  categories, 
  wallets, 
  onOpenModal, 
  onDelete, 
  onEdit 
}) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const getCategoryById = (id) => categories.find(c => c.id === id) || { name: 'Lainnya', icon: 'MoreHorizontal', bg: '#F3F4F6' };

  const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);
  const visibleTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 5);

  return (
    <>
      <section className="card" style={{ background: '#BBEFFA', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Saldo.</p>
          <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '24px', lineHeight: '1' }}>
            {formatRupiah(balance)}
          </h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => onOpenModal('transaction', 'income')} style={{
              flex: 1, padding: '12px', background: '#1A1D1E', color: '#fff',
              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
            }}>
              <ArrowDownLeft size={18} /> Masuk
            </button>
            <button onClick={() => onOpenModal('transaction', 'expense')} style={{
              flex: 1, padding: '12px', background: '#FFFFFF', color: '#1A1D1E',
              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '4px 4px 0px #1A1D1E'
            }}>
              <ArrowUpRight size={18} /> Keluar
            </button>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#FEF08A', borderRadius: '50%', border: '2px solid #1A1D1E', zIndex: 0 }} />
      </section>

      <div style={{ marginTop: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>
          Aktivitas <span className="highlight-text">Terbaru</span>.
        </h3>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['all', 'income', 'expense'].map(type => (
            <button key={type} onClick={() => setFilterType(type)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
              background: filterType === type ? '#1A1D1E' : '#FFFFFF',
              color: filterType === type ? '#FFFFFF' : '#1A1D1E',
              border: '2px solid #1A1D1E',
              boxShadow: filterType === type ? '2px 2px 0px rgba(0,0,0,0.3)' : '2px 2px 0px #1A1D1E',
              transform: filterType === type ? 'translate(1px, 1px)' : 'none'
            }}>
              {type === 'all' ? 'Semua' : (type === 'income' ? 'Masuk' : 'Keluar')}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visibleTransactions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: '#F3F4F6' }}>
            <p style={{ fontWeight: '600' }}>Kosong!</p>
            <p style={{ fontSize: '13px' }}>Belum ada transaksi.</p>
          </div>
        ) : (
          visibleTransactions.map(tx => {
            const cat = getCategoryById(tx.category);
            const IconComp = AVAILABLE_ICONS[cat.icon] || MoreHorizontal;
            const wallet = wallets.find(w => w.id === tx.walletId);
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
          })
        )}
      </div>

      {filteredTransactions.length > 5 && (
        <button onClick={() => setShowAllTransactions(!showAllTransactions)} style={{
          width: '100%', padding: '12px', marginTop: '16px', background: '#FFFFFF',
          border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
          boxShadow: '3px 3px 0px #1A1D1E'
        }}>
          {showAllTransactions ? 'Sembunyikan' : 'Lihat Semua'}
        </button>
      )}
    </>
  );
};

export default HomeTab;
