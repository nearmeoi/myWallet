import React, { useState } from 'react';
import { X, Tag, Banknote, CreditCard, Smartphone, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useWallet, findTransferTwin } from '../../context/WalletContext';
import { AVAILABLE_ICONS, PRESET_COLORS } from '../../lib/constants';
import { formatNumberInput, formatRupiah } from '../../lib/utils';
import { parseReceiptText } from '../../lib/receiptParser';
import NeoColorPicker from '../ui/NeoColorPicker';

const extractTransferNotes = (title) => {
  if (!title) return '';
  const colonIdx = title.indexOf(': ');
  if (colonIdx !== -1) return title.substring(colonIdx + 2);
  if (title.startsWith('Transfer ke ') || title.startsWith('Transfer dari ')) return '';
  return title;
};

export default function ActionModal({ isOpen, onClose, mode: initialMode, type: initialType, editingItem, addToast }) {
  const { 
    wallets, categories, transactions,
    addTransaction, updateTransaction,
    addWallet, updateWallet,
    addCategory, updateCategory,
    addWishlistItem, updateWishlistItem,
    updateBudget, monthlyBudget,
    addTransfer, updateTransfer
  } = useWallet();

  // Internal Mode State to allow switching
  const [currentMode, setCurrentMode] = useState(initialMode);
  const currentType = initialType;

  // Find twin if editing a transfer
  const transferTwin = (editingItem?.category === 'transfer' || initialMode === 'transfer')
    ? findTransferTwin(editingItem, transactions)
    : null;

  // Form State
  const [formTitle, setFormTitle] = useState(() => {
    if (!editingItem) return '';
    if (initialMode === 'transfer' || editingItem.category === 'transfer') {
      return extractTransferNotes(editingItem.title);
    }
    return editingItem.title || editingItem.name || '';
  });

  const [formAmount, setFormAmount] = useState(() => {
    if (initialMode === 'budget') return monthlyBudget ? formatNumberInput(monthlyBudget) : '';
    if (editingItem) return formatNumberInput(editingItem.amount || editingItem.price || '');
    return '';
  });

  const [formCategory, setFormCategory] = useState(() => {
    if (editingItem?.category) return editingItem.category;
    const defaultCat = categories.find(c => c.type === initialType);
    return defaultCat?.id || '';
  });

  const [formWallet, setFormWallet] = useState(() => {
    if (editingItem && (editingItem.category === 'transfer' || initialMode === 'transfer')) {
      if (editingItem.type === 'expense') return editingItem.walletId || '';
      return transferTwin?.walletId || '';
    }
    if (editingItem?.walletId) return editingItem.walletId;
    return wallets.length > 0 ? wallets[0].id : '';
  });

  const [toWallet, setToWallet] = useState(() => {
    if (editingItem && (editingItem.category === 'transfer' || initialMode === 'transfer')) {
      if (editingItem.type === 'income') return editingItem.walletId || '';
      return transferTwin?.walletId || (wallets.find(w => w.id.toString() !== editingItem.walletId?.toString())?.id || '');
    }
    const otherWallet = wallets.find(w => w.id.toString() !== formWallet?.toString());
    return otherWallet ? otherWallet.id : (wallets.length > 1 ? wallets[1].id : '');
  });

  // Category Form State
  const [catName, setCatName] = useState(() => {
    return initialMode === 'category' && editingItem ? editingItem.name : '';
  });
  const [catIcon, setCatIcon] = useState(() => {
    return initialMode === 'category' && editingItem ? editingItem.icon : 'Tag';
  });
  const [catColor, setCatColor] = useState(() => {
    return initialMode === 'category' && editingItem ? editingItem.bg : '#E0CCF8';
  });
  const [catType, setCatType] = useState(() => {
    return initialMode === 'category' && editingItem ? editingItem.type : (initialType || 'expense');
  });
  const [catBudget, setCatBudget] = useState(() => {
    return initialMode === 'category' && editingItem?.budgetLimit ? formatNumberInput(editingItem.budgetLimit) : '';
  });
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Wallet Form State
  const [walletName, setWalletName] = useState(() => {
    return initialMode === 'wallet' && editingItem ? editingItem.name : '';
  });
  const [walletBalance, setWalletBalance] = useState(() => {
    return initialMode === 'wallet' && editingItem ? formatNumberInput(editingItem.balance) : '';
  });
  const [walletType, setWalletType] = useState(() => {
    return initialMode === 'wallet' && editingItem ? editingItem.type : 'cash';
  });

  // Computed
  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handlePasteReceipt = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        addToast('Clipboard tidak didukung di browser ini.', 'error');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        addToast('Papan klip (clipboard) masih kosong!', 'info');
        return;
      }
      const parsed = parseReceiptText(text);
      if (parsed && parsed.success && parsed.amount > 0) {
        setFormAmount(formatNumberInput(parsed.amount));
        if (parsed.title) setFormTitle(parsed.title);
        
        if (parsed.bank) {
          const matched = wallets.find(w => {
            const wName = (w.name || '').toLowerCase();
            const bName = (parsed.bank || '').toLowerCase();
            return wName.includes(bName) || bName.includes(wName);
          });
          if (matched) setFormWallet(matched.id);
        }

        if (parsed.category) {
          const catExists = categories.find(c => c.id === parsed.category && c.type === currentType);
          if (catExists) setFormCategory(catExists.id);
        }

        addToast(`Struk ${parsed.bank} terdeteksi & ditempel!`, 'success');
      } else {
        addToast('Teks struk terbaca, tetapi nominal tidak terdeteksi otomatis.', 'info');
      }
    } catch (err) {
      addToast('Izin akses clipboard ditolak browser.', 'error');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (currentMode === 'category') {
      if (!catName.trim()) return;
      if (editingItem) {
        const updatedCat = {
          name: catName.trim(),
          icon: catIcon,
          bg: catColor,
          type: catType,
          budgetLimit: parseFloat(catBudget.replace(/[^0-9]/g, '')) || 0
        };
        updateCategory(editingItem.id, updatedCat);
        addToast('Kategori diperbarui!');
        onClose();
      } else {
        const newCat = {
          id: `custom_${Date.now()}`,
          name: catName.trim(),
          icon: catIcon,
          bg: catColor,
          type: catType,
          budgetLimit: parseFloat(catBudget.replace(/[^0-9]/g, '')) || 0,
          isDefault: false
        };
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
      if (!formWallet || !toWallet || formWallet.toString() === toWallet.toString()) {
        addToast('Pilih dompet yang berbeda', 'error');
        return;
      }
      if (editingItem) {
        updateTransfer(editingItem.id, {
          fromWalletId: formWallet,
          toWalletId: toWallet,
          amount,
          notes: formTitle.trim()
        });
        addToast('Transfer diperbarui!');
      } else {
        addTransfer({
          fromWalletId: formWallet,
          toWalletId: toWallet,
          amount,
          notes: formTitle.trim()
        });
        addToast('Transfer Berhasil!');
      }
    } else if (currentMode === 'wishlist') {
      const newItem = { name: formTitle, price: amount };
      if (editingItem && editingItem.id) {
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

      if (editingItem && editingItem.id) {
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
        <div className="modal-header">
          <h3 style={{ fontSize: '20px', fontWeight: '900' }}>
            {currentMode === 'budget' && 'Set Budget'}
            {currentMode === 'wishlist' && (editingItem?.id ? 'Edit Item' : 'New Item')}
            {currentMode === 'transaction' && (editingItem?.id ? 'Edit Transaksi' : 'Transaksi Baru')}
            {currentMode === 'transfer' && (editingItem ? 'Edit Transfer' : 'Transfer Antar Dompet')}
            {currentMode === 'category' && (editingItem ? 'Edit Kategori' : 'Kategori Baru')}
            {currentMode === 'wallet' && (editingItem ? 'Edit Dompet' : 'Dompet Baru')}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A1D1E', padding: '4px' }}>
            <X size={22} color="#1A1D1E" />
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
                    width: '38px', height: '38px', background: catColor,
                    border: '2px solid #1A1D1E', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {AVAILABLE_ICONS[catIcon] ? React.createElement(AVAILABLE_ICONS[catIcon], { size: 20, color: '#1A1D1E' }) : <Tag size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1D1E' }}>{catIcon}</p>
                    <p style={{ fontSize: '11px', color: '#666' }}>{showIconPicker ? 'Pilih salah satu ikon di bawah' : 'Ketuk untuk mengganti ikon'}</p>
                  </div>
                  {showIconPicker ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {/* Collapsible Icon Grid */}
                {showIconPicker && (
                  <div style={{
                    marginTop: '10px', padding: '12px',
                    background: '#F9FAFB', border: '2px solid #1A1D1E', borderRadius: '10px',
                    maxHeight: '180px', overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {Object.keys(AVAILABLE_ICONS).map(iconName => {
                        const IconComp = AVAILABLE_ICONS[iconName];
                        const isSelected = catIcon === iconName;
                        return (
                          <button 
                            key={iconName} 
                            type="button" 
                            onClick={() => {
                              setCatIcon(iconName);
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

              <NeoColorPicker selectedColor={catColor} onChange={setCatColor} label="WARNA KATEGORI" />
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
              {currentMode === 'transaction' && !editingItem?.id && (
                <button
                  type="button"
                  onClick={handlePasteReceipt}
                  className="btn-pressed-blue"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    width: '100%', padding: '9px 12px', background: '#FEF08A',
                    border: '2px solid #1A1D1E', borderRadius: '8px',
                    fontWeight: '800', fontSize: '11px', marginBottom: '16px',
                    cursor: 'pointer', boxShadow: '2px 2px 0px #1A1D1E', color: '#1A1D1E'
                  }}
                >
                  <Sparkles size={14} />
                  <span>Tempel Struk dari Clipboard (Auto-isi)</span>
                </button>
              )}

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
                          setCatName('');
                          setCatBudget('');
                        }}
                        style={{ 
                          width: '36px', height: '36px', background: '#FFFFFF', border: '2px solid #1A1D1E', 
                          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '2px 2px 0px #1A1D1E', color: '#1A1D1E', cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '20px', fontWeight: '900', color: '#1A1D1E' }}>+</span>
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
            Simpan {
              currentMode === 'transaction' ? 'Transaksi' :
              currentMode === 'transfer' ? 'Transfer' :
              currentMode === 'category' ? 'Kategori' :
              currentMode === 'budget' ? 'Budget' :
              'Dompet'
            }
          </button>
        </form>
      </div>
    </div>
  );
}
