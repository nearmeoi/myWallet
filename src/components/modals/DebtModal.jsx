import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDebt } from '../../context/DebtContext';
import { formatNumberInput, formatRupiah } from '../../lib/utils';
import { useWallet } from '../../context/WalletContext';

export default function DebtModal({ isOpen, onClose, mode, editingItem, addToast }) {
  // mode: 'debt' = tambah hutang/piutang, 'debtPayment' = bayar cicilan
  const { addDebt, addPayment } = useDebt();
  const { wallets, addTransaction } = useWallet();

  const isPayment = mode === 'debtPayment';

  const [debtType, setDebtType] = useState('owe'); // 'owe' | 'lend'
  const [personName, setPersonName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payWallet, setPayWallet] = useState(wallets.length > 0 ? wallets[0].id : '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isPayment) {
      const amount = parseFloat(payAmount.replace(/[^0-9]/g, ''));
      if (!amount || amount <= 0) {
        addToast('Masukkan nominal pembayaran', 'error');
        return;
      }
      addPayment(editingItem.id, { amount, notes: payNotes, walletId: payWallet });
      if (payWallet && addTransaction) {
        addTransaction({
          title: editingItem.type === 'owe' 
            ? `Bayar Hutang: ${editingItem.personName}` 
            : `Terima Piutang: ${editingItem.personName}`,
          amount,
          type: editingItem.type === 'owe' ? 'expense' : 'income',
          category: 'other_expense',
          walletId: payWallet
        });
      }
      addToast('Pembayaran dicatat!');
      onClose();
      return;
    }

    // Add new debt
    if (!personName.trim()) {
      addToast('Masukkan nama orang', 'error');
      return;
    }
    const amount = parseFloat(totalAmount.replace(/[^0-9]/g, ''));
    if (!amount || amount <= 0) {
      addToast('Masukkan nominal', 'error');
      return;
    }

    addDebt({
      type: debtType,
      personName: personName.trim(),
      totalAmount: amount,
      paidAmount: 0,
      dueDate: dueDate || null,
      notes: notes.trim()
    });
    addToast(debtType === 'owe' ? 'Hutang dicatat!' : 'Piutang dicatat!');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '20px', fontWeight: '900' }}>
            {isPayment ? `Bayar ke ${editingItem?.personName}` : 'Catat Hutang/Piutang'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={22} color="#1A1D1E" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isPayment ? (
            <>
              <div style={{ marginBottom: '4px', padding: '12px', background: '#FFF3F3', border: '2px solid #1A1D1E', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>SISA HUTANG</p>
                <p style={{ fontSize: '20px', fontWeight: '900', color: '#EF4444' }}>
                  {formatRupiah(editingItem?.totalAmount - (editingItem?.paidAmount || 0))}
                </p>
              </div>
              <p style={{ fontSize: '11px', color: '#999', marginBottom: '20px' }}>Masukkan nominal yang dibayarkan sekarang.</p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NOMINAL BAYAR (RP)</label>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={payAmount}
                  onChange={e => setPayAmount(formatNumberInput(e.target.value))}
                  placeholder="0"
                  style={{ fontSize: '24px', textAlign: 'center' }}
                />
              </div>

              {wallets.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>BAYAR DARI DOMPET</label>
                  <select
                    value={payWallet}
                    onChange={e => setPayWallet(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '2px solid #1A1D1E', borderRadius: '8px', background: '#FFFFFF', fontWeight: '700' }}
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>CATATAN (OPSIONAL)</label>
                <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="..." />
              </div>
            </>
          ) : (
            <>
              {/* Debt Type Toggle */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>JENIS</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { key: 'owe', label: '🔴 Saya Berhutang', bg: '#FFC0C0' },
                    { key: 'lend', label: '🟢 Saya Meminjamkan', bg: '#D4F7E6' }
                  ].map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setDebtType(t.key)}
                      style={{
                        flex: 1, padding: '10px 6px', border: '2px solid #1A1D1E', borderRadius: '8px',
                        background: debtType === t.key ? t.bg : '#fff',
                        fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                        boxShadow: debtType === t.key ? 'none' : '2px 2px 0px #1A1D1E'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NAMA ORANG</label>
                <input
                  autoFocus
                  type="text"
                  value={personName}
                  onChange={e => setPersonName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NOMINAL (RP)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={totalAmount}
                  onChange={e => setTotalAmount(formatNumberInput(e.target.value))}
                  placeholder="0"
                  style={{ fontSize: '24px', textAlign: 'center' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>JATUH TEMPO (OPSIONAL)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>CATATAN (OPSIONAL)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." />
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-pressed-blue"
            style={{
              width: '100%', padding: '16px', background: '#1A1D1E', color: '#fff',
              border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
            }}
          >
            {isPayment ? 'Catat Pembayaran' : (debtType === 'owe' ? 'Simpan Hutang' : 'Simpan Piutang')}
          </button>
        </form>
      </div>
    </div>
  );
}
