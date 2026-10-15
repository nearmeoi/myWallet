import React from 'react';
import { Target, MoreHorizontal, Banknote, CreditCard, Smartphone, ArrowLeft } from 'lucide-react';
import { AVAILABLE_ICONS } from '../../lib/constants';
import { formatRupiah } from '../../lib/utils';

const WalletTab = ({
  monthlyBudget,
  budgetProgress,
  totalIncome,
  totalExpense,
  wallets,
  expenseCategories,
  transactions,
  onOpenModal,
  onBack
}) => {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        {onBack && (
          <button 
            onClick={onBack}
            style={{
              padding: '8px 12px', background: '#FFFFFF', border: '2px solid #1A1D1E',
              borderRadius: '8px', fontWeight: '700', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
              boxShadow: '2px 2px 0px #1A1D1E', color: '#1A1D1E'
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
        )}
        <h2 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>Ringkasan.</h2>
      </div>

      <div className="card" onClick={() => onOpenModal('budget')} style={{
        background: '#1A1D1E', color: '#fff', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <p style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8 }}>BUDGET BULANAN</p>
          <p style={{ fontSize: '24px', fontWeight: '800' }}>{formatRupiah(monthlyBudget)}</p>
          <div style={{ marginTop: '8px', padding: '4px 8px', background: '#333', borderRadius: '4px', display: 'inline-block', fontSize: '12px' }}>
            Tap to edit
          </div>
        </div>
        <div style={{ width: '60px', height: '60px' }}>
          <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#444" strokeWidth="4" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#D4F7E6" strokeWidth="4" strokeDasharray={`${Math.min(budgetProgress, 100)}, 100`} />
          </svg>
        </div>
      </div>

      <h3 style={{ marginTop: '24px', marginBottom: '16px', fontWeight: '800' }}>Arus Kas.</h3>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="card" style={{ flex: 1, padding: '16px', margin: 0, background: '#D4F7E6' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>PEMASUKAN</p>
          <p style={{ fontSize: '16px', fontWeight: '900' }}>{formatRupiah(totalIncome)}</p>
        </div>
        <div className="card" style={{ flex: 1, padding: '16px', margin: 0, background: '#FFC0C0' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>PENGELUARAN</p>
          <p style={{ fontSize: '16px', fontWeight: '900' }}>{formatRupiah(totalExpense)}</p>
        </div>
      </div>

      <h3 style={{ marginTop: '24px', marginBottom: '16px', fontWeight: '800' }}>Saldo Dompet.</h3>
      <div className="card" style={{ padding: '0' }}>
         {wallets.length === 0 ? (
           <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
             Belum ada dompet.
           </div>
         ) : (
           wallets.map(w => (
             <div key={w.id} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', border: '2px solid #1A1D1E', borderRadius: '8px',
                    background: w.type === 'cash' ? '#D4F7E6' : w.type === 'bank' ? '#FEF9C3' : '#E0CCF8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {w.type === 'cash' ? <Banknote size={16} /> : w.type === 'bank' ? <CreditCard size={16} /> : <Smartphone size={16} />}
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{w.name}</span>
               </div>
               <span style={{ fontWeight: '700', fontSize: '14px' }}>{formatRupiah(w.balance)}</span>
             </div>
           ))
         )}
      </div>
      <h3 style={{ marginTop: '24px', marginBottom: '16px', fontWeight: '800' }}>Pengeluaran per Kategori.</h3>
      {totalExpense === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px', borderStyle: 'dashed', background: 'transparent', boxShadow: 'none' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', background: '#F3F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1A1D1E' }}>
            <Target size={24} color="#aaa" />
          </div>
          <p style={{ fontWeight: '700', color: '#666' }}>Belum ada pengeluaran.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0' }}>
          {expenseCategories.map(cat => {
            const amount = transactions.filter(t => t.type === 'expense' && t.category === cat.id).reduce((a, b) => a + b.amount, 0);
            if (amount === 0) return null;
            const percent = (amount / totalExpense) * 100;
            const IconComp = AVAILABLE_ICONS[cat.icon] || MoreHorizontal;
            return (
              <div key={cat.id} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', background: cat.bg, border: '2px solid #1A1D1E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700' }}>
                    <span>{cat.name}</span>
                    <span>{formatRupiah(amount)}</span>
                  </div>
                  <div style={{ height: '8px', background: '#F3F4F6', border: '2px solid #1A1D1E', borderRadius: '4px', marginTop: '4px' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: cat.bg }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default WalletTab;
