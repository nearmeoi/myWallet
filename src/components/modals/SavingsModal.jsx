import React, { useState } from 'react';
import { X, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useSavings } from '../../context/SavingsContext';
import { useWallet } from '../../context/WalletContext';
import { AVAILABLE_ICONS, PRESET_COLORS } from '../../lib/constants';
import { formatNumberInput, formatRupiah } from '../../lib/utils';

export default function SavingsModal({ isOpen, onClose, mode, editingItem, addToast }) {
  // mode: 'saving' = buat goal baru, 'savingTopUp' = tabung, 'savingWithdraw' = tarik
  const { addSaving, topUpSaving, withdrawSaving } = useSavings();
  const { wallets, addTransaction } = useWallet();

  const isTopUp = mode === 'savingTopUp';
  const isWithdraw = mode === 'savingWithdraw';
  const isNew = mode === 'saving';

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#D4F7E6');
  const [deadline, setDeadline] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const [amount, setAmount] = useState('');
  const [fromWallet, setFromWallet] = useState(wallets.length > 0 ? wallets[0].id : '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isNew) {
      if (!name.trim()) { addToast('Masukkan nama tabungan', 'error'); return; }
      const target = parseFloat(targetAmount.replace(/[^0-9]/g, ''));
      if (!target || target <= 0) { addToast('Masukkan target nominal', 'error'); return; }

      addSaving({
        name: name.trim(),
        targetAmount: target,
        icon,
        color,
        deadline: deadline || null
      });
      addToast('Kantong tabungan dibuat!');
      onClose();
      return;
    }

    const txAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!txAmount || txAmount <= 0) { addToast('Masukkan nominal', 'error'); return; }

    if (isTopUp) {
      // Deduct from wallet
      if (fromWallet) {
        addTransaction({
          title: `Tabungan: ${editingItem.name}`,
          amount: txAmount,
          type: 'expense',
          category: 'saving',
          walletId: fromWallet
        });
      }
      topUpSaving(editingItem.id, txAmount);
      addToast(`+${formatRupiah(txAmount)} ditabung!`);
    } else if (isWithdraw) {
      // Add back to wallet
      if (fromWallet) {
        addTransaction({
          title: `Tarik Tabungan: ${editingItem.name}`,
          amount: txAmount,
          type: 'income',
          category: 'saving',
          walletId: fromWallet
        });
      }
      withdrawSaving(editingItem.id, txAmount);
      addToast(`${formatRupiah(txAmount)} ditarik dari tabungan`);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '20px', fontWeight: '900' }}>
            {isNew && 'Kantong Tabungan Baru'}
            {isTopUp && `Tabung ke "${editingItem?.name}"`}
            {isWithdraw && `Tarik dari "${editingItem?.name}"`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={22} color="#1A1D1E" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isNew && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NAMA TABUNGAN</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Beli Laptop, Liburan Bali"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>TARGET NOMINAL (RP)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetAmount}
                  onChange={e => setTargetAmount(formatNumberInput(e.target.value))}
                  placeholder="0"
                  style={{ fontSize: '24px', textAlign: 'center' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>TARGET TANGGAL (OPSIONAL)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>IKON</label>
                  <button 
                    type="button" 
                    onClick={() => setShowIconPicker(prev => !prev)}
                    style={{
                      background: 'none', border: 'none', color: '#1A1D1E',
                      fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {showIconPicker ? 'Tutup Ikon' : 'Pilih Ikon'}
                    {showIconPicker ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Selected Icon Preview Card */}
                <div 
                  onClick={() => setShowIconPicker(prev => !prev)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', background: '#FFFFFF',
                    border: '2px solid #1A1D1E', borderRadius: '10px',
                    cursor: 'pointer', boxShadow: '2px 2px 0px #1A1D1E'
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', background: color,
                    border: '2px solid #1A1D1E', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {AVAILABLE_ICONS[icon] ? React.createElement(AVAILABLE_ICONS[icon], { size: 20, color: '#1A1D1E' }) : <Target size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1D1E' }}>{icon}</p>
                    <p style={{ fontSize: '11px', color: '#666' }}>{showIconPicker ? 'Pilih salah satu ikon di bawah' : 'Ketuk untuk mengganti ikon'}</p>
                  </div>
                  {showIconPicker ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {/* Collapsible Icon Grid */}
                {showIconPicker && (
                  <div style={{
                    marginTop: '10px', padding: '12px',
                    background: '#F9FAFB', border: '2px solid #1A1D1E', borderRadius: '10px',
                    maxHeight: '160px', overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['Target', 'Gift', 'Plane', 'Home', 'ShoppingCart', 'Car', 'Smartphone', 'GraduationCap', 'Heart', 'Music', 'Baby', 'Gamepad', 'Coffee', 'PiggyBank'].map(iconName => {
                        const IconComp = AVAILABLE_ICONS[iconName];
                        if (!IconComp) return null;
                        const isSelected = icon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              setIcon(iconName);
                              setShowIconPicker(false);
                            }}
                            style={{
                              width: '40px', height: '40px', border: '2px solid #1A1D1E', borderRadius: '8px',
                              background: isSelected ? '#1A1D1E' : '#fff',
                              color: isSelected ? '#fff' : '#1A1D1E',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: isSelected ? 'none' : '2px 2px 0px rgba(0,0,0,0.1)'
                            }}
                            title={iconName}
                          >
                            <IconComp size={18} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>WARNA</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: '36px', height: '36px',
                        border: color === c ? '3px solid #1A1D1E' : '2px solid #1A1D1E',
                        borderRadius: '8px', background: c,
                        boxShadow: color === c ? '2px 2px 0px #1A1D1E' : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {(isTopUp || isWithdraw) && (
            <>
              {/* Current Saving Info */}
              <div style={{ padding: '12px', background: '#F3F4F6', border: '2px solid #1A1D1E', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>TERKUMPUL</p>
                <p style={{ fontSize: '20px', fontWeight: '900' }}>{formatRupiah(editingItem?.currentAmount || 0)}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>dari target {formatRupiah(editingItem?.targetAmount || 0)}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>
                  NOMINAL {isTopUp ? 'TABUNGAN' : 'PENARIKAN'} (RP)
                </label>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={e => setAmount(formatNumberInput(e.target.value))}
                  placeholder="0"
                  style={{ fontSize: '24px', textAlign: 'center' }}
                />
              </div>

              {wallets.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>
                    {isTopUp ? 'DARI DOMPET' : 'MASUK KE DOMPET'}
                  </label>
                  <select
                    value={fromWallet}
                    onChange={e => setFromWallet(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '2px solid #1A1D1E', borderRadius: '8px', background: '#FFFFFF', fontWeight: '700' }}
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>
                    ))}
                  </select>
                </div>
              )}
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
            {isNew ? 'Buat Kantong Tabungan' : (isTopUp ? 'Simpan Tabungan' : 'Tarik Dana')}
          </button>
        </form>
      </div>
    </div>
  );
}
