import React, { useState, useEffect } from 'react';
import { X, Tag, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { AVAILABLE_ICONS, PRESET_COLORS } from '../../lib/constants';
import { formatNumberInput, formatRupiah } from '../../lib/utils';

export default function ActionModal({ isOpen, onClose, mode: initialMode, type: initialType, editingItem, addToast }) {
  const { 
    wallets, categories, 
    addTransaction, updateTransaction,
    addWallet, updateWallet,
    addCategory, updateCategory,
    addWishlistItem, updateWishlistItem,
    updateBudget, monthlyBudget,
    addTransfer
  } = useWallet();

  // Internal Mode State to allow switching
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [currentType, setCurrentType] = useState(initialType);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formWallet, setFormWallet] = useState('');
  const [toWallet, setToWallet] = useState('');

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catColor, setCatColor] = useState('#E0CCF8');
  const [catType, setCatType] = useState('expense');
  const [catBudget, setCatBudget] = useState('');

  // Wallet Form State
  const [walletName, setWalletName] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletType, setWalletType] = useState('cash');

  // Computed
  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Sync internal mode with props
  useEffect(() => {
    setCurrentMode(initialMode);
    setCurrentType(initialType);
  }, [initialMode, initialType, isOpen]);

  // Initialize Form Data
  useEffect(() => {
    if (!isOpen) return;

    if (currentMode === 'category') {
      if (editingItem) {
        setCatName(editingItem.name);
        setCatIcon(editingItem.icon);
        setCatColor(editingItem.bg);
        setCatType(editingItem.type);
        setCatBudget(editingItem.budgetLimit ? formatNumberInput(editingItem.budgetLimit) : '');
      } else {
        setCatName('');
        setCatIcon('Tag');
        setCatColor('#E0CCF8');
        setCatType(currentType);
        setCatBudget('');
      }
    } else if (currentMode === 'wallet') {
      if (editingItem) {
        setWalletName(editingItem.name);
        setWalletBalance(formatNumberInput(editingItem.balance));
        setWalletType(editingItem.type);
      } else {
        setWalletName('');
        setWalletBalance('');
        setWalletType('cash');
      }
    } else if (currentMode === 'transfer') {
      setFormAmount('');
      setFormTitle('');
      setFormWallet(wallets.length > 0 ? wallets[0].id : '');
      setToWallet(wallets.length > 1 ? wallets[1].id : '');
    } else if (editingItem) {
      setFormTitle(editingItem.title || editingItem.name);
      setFormAmount(formatNumberInput(editingItem.amount || editingItem.price));
      setFormCategory(editingItem.category || '');
      setFormWallet(editingItem.walletId || '');
    } else {
      setFormTitle('');
      setFormAmount(currentMode === 'budget' ? (monthlyBudget ? formatNumberInput(monthlyBudget) : '') : '');
      const defaultCat = categories.find(c => c.type === currentType);
      setFormCategory(defaultCat?.id || '');
      setFormWallet(wallets.length > 0 ? wallets[0].id : '');
    }
  }, [isOpen, currentMode, currentType, editingItem, monthlyBudget, categories, wallets]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (currentMode === 'category') {
      if (!catName.trim()) return;
      const newCat = {
        id: `custom_${Date.now()}`,
        name: catName.trim(),
        icon: catIcon,
        bg: catColor,
        type: catType,
        budgetLimit: parseFloat(catBudget.replace(/[^0-9]/g, '')) || 0,
        isDefault: false
      };
      if (editingItem) {
        updateCategory(editingItem.id, newCat);
        addToast('Kategori diperbarui!');
        onClose();
      } else {
        addCategory(newCat);
        addToast('Kategori baru ditambahkan!');
        // If we came from transaction mode, go back to it
        if (initialMode === 'transaction') {
          setCurrentMode('transaction');
          setFormCategory(newCat.id);
        } else {
          onClose();
        }
      }
      return;
    }

    if (currentMode === 'wallet') {
      if (!walletName.trim()) return;
      const bal = parseFloat(walletBalance.replace(/[^0-9]/g, ''));
      if (isNaN(bal)) return;

      const newWallet = {
        name: walletName.trim(),
        balance: bal,
        type: walletType,
        color: '#1A1D1E'
      };

      if (editingItem) {
        updateWallet(editingItem.id, newWallet);
        addToast('Dompet diperbarui!');
      } else {
        addWallet(newWallet);
        addToast('Dompet ditambahkan!');
      }
      onClose();
      return;
    }

    const amount = parseFloat(formAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) return;

    if (currentMode === 'budget') {
      updateBudget(amount);
      addToast('Budget diperbarui!');
    } else if (currentMode === 'transfer') {
      if (!formWallet || !toWallet || formWallet === toWallet) {
        addToast('Pilih dompet yang berbeda', 'error');
        return;
      }
      addTransfer({
        fromWalletId: formWallet,
        toWalletId: toWallet,
        amount,
        notes: formTitle
      });
      addToast('Transfer Berhasil!');
    } else if (currentMode === 'wishlist') {
      const newItem = { name: formTitle, price: amount };
      if (editingItem) {
        updateWishlistItem(editingItem.id, newItem);
        addToast('Wishlist updated!');
      } else {
        addWishlistItem(newItem);
        addToast('Ditambahkan ke wishlist');
      }
    } else {
      // Transaction
      const txData = {
        title: formTitle,
        amount,
        type: currentType, // Use internal type
        category: formCategory,
        walletId: formWallet || null
      };

      if (editingItem) {
        updateTransaction(editingItem.id, txData);
        addToast('Transaksi updated!');
      } else {
        addTransaction(txData);
        addToast(currentType === 'income' ? 'Uang Masuk!' : 'Uang Keluar!');
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '900' }}>
            {currentMode === 'budget' && 'Set Budget'}
            {currentMode === 'wishlist' && (editingItem ? 'Edit Item' : 'New Item')}
            {currentMode === 'transaction' && (editingItem ? 'Edit' : 'Transaksi Baru')}
            {currentMode === 'category' && (editingItem ? 'Edit Kategori' : 'Kategori Baru')}
            {currentMode === 'wallet' && (editingItem ? 'Edit Dompet' : 'Dompet Baru')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {currentMode === 'category' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NAMA KATEGORI</label>
                <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Contoh: Investasi" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>TIPE</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['income', 'expense'].map(t => (
                    <button key={t} type="button" onClick={() => setCatType(t)} style={{
                      flex: 1, padding: '10px', border: '2px solid #1A1D1E', borderRadius: '8px',
                      background: catType === t ? '#1A1D1E' : '#fff',
                      color: catType === t ? '#fff' : '#1A1D1E',
                      fontWeight: '700', boxShadow: catType === t ? 'none' : '2px 2px 0px #1A1D1E'
                    }}>
                      {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </button>
                  ))}
                </div>
              </div>

              {catType === 'expense' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>JATAH ANGGARAN (OPSIONAL)</label>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={catBudget} 
                    onChange={e => setCatBudget(formatNumberInput(e.target.value))} 
                    placeholder="0" 
                  />
                  <p style={{ fontSize: '11px', color: '#666', marginTop: '-8px' }}>
                    *Biarkan 0 jika tidak ada batas.
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>IKON</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.keys(AVAILABLE_ICONS).map(iconName => {
                    const IconComp = AVAILABLE_ICONS[iconName];
                    return (
                      <button key={iconName} type="button" onClick={() => setCatIcon(iconName)} style={{
                        width: '44px', height: '44px', border: '2px solid #1A1D1E', borderRadius: '8px',
                        background: catIcon === iconName ? '#1A1D1E' : '#fff',
                        color: catIcon === iconName ? '#fff' : '#1A1D1E',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComp size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>WARNA</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PRESET_COLORS.map(color => (
                    <button key={color} type="button" onClick={() => setCatColor(color)} style={{
                      width: '36px', height: '36px', border: catColor === color ? '3px solid #1A1D1E' : '2px solid #1A1D1E',
                      borderRadius: '8px', background: color,
                      boxShadow: catColor === color ? '2px 2px 0px #1A1D1E' : 'none'
                    }} />
                  ))}
                </div>
              </div>
            </>
          )}

          {currentMode === 'wallet' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NAMA DOMPET</label>
                <input type="text" value={walletName} onChange={e => setWalletName(e.target.value)} placeholder="Contoh: Dompet Utama, BRI, DANA" />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>TIPE</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['cash', 'bank', 'ewallet'].map(t => (
                    <button key={t} type="button" onClick={() => setWalletType(t)} style={{
                      flex: 1, padding: '10px', border: '2px solid #1A1D1E', borderRadius: '8px',
                      background: walletType === t ? '#1A1D1E' : '#fff',
                      color: walletType === t ? '#fff' : '#1A1D1E',
                      fontWeight: '700', boxShadow: walletType === t ? 'none' : '2px 2px 0px #1A1D1E',
                      textTransform: 'capitalize',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                    }}>
                      {t === 'cash' ? <Banknote size={18} /> : t === 'bank' ? <CreditCard size={18} /> : <Smartphone size={18} />}
                      <span style={{ fontSize: '11px' }}>{t === 'ewallet' ? 'E-Wallet' : t}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>SALDO AWAL (RP)</label>
                <input type="text" inputMode="numeric" value={walletBalance} onChange={e => setWalletBalance(formatNumberInput(e.target.value))} placeholder="0" style={{ fontSize: '24px', textAlign: 'center' }} />
              </div>
            </>
          )}

          {currentMode !== 'category' && currentMode !== 'wallet' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NOMINAL (RP)</label>
                <input autoFocus type="text" inputMode="numeric" value={formAmount} onChange={e => setFormAmount(formatNumberInput(e.target.value))} placeholder="0" style={{ fontSize: '24px', textAlign: 'center' }} />
              </div>

              {currentMode === 'transfer' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>DARI DOMPET</label>
                    <select value={formWallet} onChange={e => setFormWallet(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #1A1D1E', borderRadius: '8px', background: '#FFFFFF', fontWeight: '700' }}>
                      {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>KE DOMPET</label>
                    <select value={toWallet} onChange={e => setToWallet(e.target.value)} style={{ width: '100%', padding: '12px', border: '2px solid #1A1D1E', borderRadius: '8px', background: '#FFFFFF', fontWeight: '700' }}>
                      {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>)}
                    </select>
                  </div>
                </>
              )}

              {currentMode !== 'budget' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>
                    {currentMode === 'wishlist' ? 'NAMA BARANG' : (currentMode === 'transfer' ? 'CATATAN (OPSIONAL)' : 'KETERANGAN')}
                  </label>
                  <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="..." />
                </div>
              )}

              {currentMode === 'transaction' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>
                      {currentType === 'income' ? 'MASUK KE DOMPET' : 'SUMBER DANA'}
                    </label>
                    <select 
                      value={formWallet} 
                      onChange={e => setFormWallet(e.target.value)}
                      style={{
                        width: '100%', padding: '12px', border: '2px solid #1A1D1E', borderRadius: '8px',
                        background: '#FFFFFF', fontWeight: '700', fontSize: '14px'
                      }}
                    >
                      <option value="" disabled>Pilih Dompet</option>
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>
                      ))}
                    </select>
                    {wallets.length === 0 && (
                      <p style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px' }}>
                        *Buat dompet terlebih dahulu di menu Akun.
                      </p>
                    )}
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700' }}>KATEGORI</label>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(currentType === 'income' ? incomeCategories : expenseCategories).map(cat => {
                        const IconComp = AVAILABLE_ICONS[cat.icon] || Tag;
                        return (
                          <button key={cat.id} type="button" onClick={() => setFormCategory(cat.id)} style={{
                            padding: '8px 12px', border: '2px solid #1A1D1E', borderRadius: '8px',
                            background: formCategory === cat.id ? '#1A1D1E' : '#FFFFFF',
                            color: formCategory === cat.id ? '#FFFFFF' : '#1A1D1E',
                            fontWeight: '700', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center',
                            boxShadow: formCategory === cat.id ? '2px 2px 0px rgba(0,0,0,0.3)' : '2px 2px 0px #1A1D1E'
                          }}>
                            <IconComp size={14} /> {cat.name}
                          </button>
                        );
                      })}
                      <button 
                        type="button" 
                        onClick={() => {
                          setCurrentMode('category');
                          setCatType(currentType);
                        }}
                        style={{ 
                          width: '36px', height: '36px', background: '#FFFFFF', border: '2px solid #1A1D1E', 
                          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '2px 2px 0px #1A1D1E'
                        }}
                      >
                        <span style={{ fontSize: '20px', fontWeight: '900' }}>+</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

            <button type="submit" className="btn-pressed-blue" style={{
              width: '100%', padding: '16px', background: '#1A1D1E', color: '#fff',
              border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.2)', marginTop: '8px'
            }}>
              Simpan {currentMode === 'transaction' ? 'Transaksi' : currentMode === 'transfer' ? 'Transfer' : currentMode === 'wishlist' ? 'Wishlist' : 'Dompet'}
            </button>
        </form>
      </div>
    </div>
  );
}
