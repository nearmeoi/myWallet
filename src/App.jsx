import React, { useState, useEffect } from 'react';
import {
  X, Tag, LoaderCircle
} from 'lucide-react';
import {
  signIn, signUp, signOut, onAuthStateChange, resendConfirmation,
  syncTransactions, fetchTransactions, syncCategories, fetchCategories,
  syncWishlist, fetchWishlist, syncBudget, fetchBudget,
  syncWallets, fetchWallets
} from './lib/supabase';
import { AVAILABLE_ICONS, PRESET_COLORS, DEFAULT_CATEGORIES } from './lib/constants';
import { formatNumberInput, formatRupiah } from './lib/utils';
import Toast from './components/ui/Toast';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';

// Tabs
import HomeTab from './components/tabs/HomeTab';
import WishlistTab from './components/tabs/WishlistTab';
import WalletTab from './components/tabs/WalletTab';
import CategoriesTab from './components/tabs/CategoriesTab';
import AccountTab from './components/tabs/AccountTab';

function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState('login'); // login or register
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);

  // Data State
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('mywallet_transactions') || '[]'));
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem('mywallet_wishlist') || '[]'));
  const [monthlyBudget, setMonthlyBudget] = useState(() => parseInt(localStorage.getItem('mywallet_budget') || '0'));
  const [wallets, setWallets] = useState(() => JSON.parse(localStorage.getItem('mywallet_wallets') || '[]'));
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('mywallet_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  // UI State
  const [activeTab, setActiveTab] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('transaction');
  const [modalType, setModalType] = useState('income');
  const [toasts, setToasts] = useState([]);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formWallet, setFormWallet] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catColor, setCatColor] = useState('#E0CCF8');
  const [catType, setCatType] = useState('expense');

  // Wallet Form State
  const [walletName, setWalletName] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletType, setWalletType] = useState('cash');

  // Other UI State
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  // Computed Values
  const netCashFlow = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0);
  const totalWalletBalance = wallets.reduce((acc, w) => acc + (parseFloat(w.balance) || 0), 0);
  const displayBalance = wallets.length > 0 ? totalWalletBalance : netCashFlow;

  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  
  const wishlistTotal = wishlist.reduce((a, b) => a + b.price, 0);
  const currentMonthExpenses = transactions.filter(t => {
    const d = new Date(t.timestamp);
    const now = new Date();
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((a, b) => a + b.amount, 0);
  const budgetProgress = monthlyBudget > 0 ? (currentMonthExpenses / monthlyBudget) * 100 : 0;
  
  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Auth Listener
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setAuthLoading(false);
      if (event === 'SIGNED_IN' && session?.user) {
        loadCloudData(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data from cloud
  const loadCloudData = async (userId) => {
    setSyncing(true);
    try {
      const [txRes, catRes, wishRes, budgetRes, walletRes] = await Promise.all([
        fetchTransactions(userId),
        fetchCategories(userId),
        fetchWishlist(userId),
        fetchBudget(userId),
        fetchWallets(userId)
      ]);

      if (txRes.data && txRes.data.length > 0) setTransactions(txRes.data);
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (wishRes.data && wishRes.data.length > 0) setWishlist(wishRes.data);
      if (budgetRes.budget) setMonthlyBudget(budgetRes.budget);
      if (walletRes.data && walletRes.data.length > 0) setWallets(walletRes.data);
    } catch (err) {
      console.error('Sync error:', err);
    }
    setSyncing(false);
  };

  // Sync data to cloud (debounced)
  const syncToCloud = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await Promise.all([
        syncTransactions(user.id, transactions),
        syncCategories(user.id, categories),
        syncWishlist(user.id, wishlist),
        syncBudget(user.id, monthlyBudget),
        syncWallets(user.id, wallets)
      ]);
    } catch (err) {
      console.error('Sync error:', err);
    }
    setSyncing(false);
  };

  // Auto-sync when data changes (if logged in)
  useEffect(() => {
    if (user) {
      const timeout = setTimeout(syncToCloud, 2000);
      return () => clearTimeout(timeout);
    }
  }, [transactions, categories, wishlist, monthlyBudget, wallets, user]);

  // Local persistence
  useEffect(() => localStorage.setItem('mywallet_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('mywallet_wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('mywallet_budget', monthlyBudget.toString()), [monthlyBudget]);
  useEffect(() => localStorage.setItem('mywallet_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('mywallet_wallets', JSON.stringify(wallets)), [wallets]);

  // Toast Helpers
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Auth Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setShowResend(false);

    if (!authEmail || !authPassword) {
      setAuthError('Email dan password harus diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const { error } = await signIn(authEmail, authPassword);
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setShowResend(true);
          }
          throw error;
        }
        addToast('Login berhasil!');
      } else {
        const { error } = await signUp(authEmail, authPassword, { emailRedirectTo: window.location.origin });
        if (error) throw error;
        addToast('Registrasi berhasil! Cek email untuk verifikasi.', 'info');
        setShowResend(true); // Show resend button immediately after registration
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await resendConfirmation(authEmail, { emailRedirectTo: window.location.origin });
      if (error) throw error;
      addToast('Email verifikasi dikirim ulang!', 'info');
      setShowResend(false);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    addToast('Berhasil logout', 'info');
  };

  // Modal Helpers
  const openModal = (mode, type = 'income', item = null) => {
    setModalMode(mode);
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);

    if (mode === 'category') {
      if (item) {
        setCatName(item.name);
        setCatIcon(item.icon);
        setCatColor(item.bg);
        setCatType(item.type);
      } else {
        setCatName('');
        setCatIcon('Tag');
        setCatColor('#E0CCF8');
        setCatType(type);
      }
    } else if (mode === 'wallet') {
      if (item) {
        setWalletName(item.name);
        setWalletBalance(formatNumberInput(item.balance));
        setWalletType(item.type);
      } else {
        setWalletName('');
        setWalletBalance('');
        setWalletType('cash');
      }
    } else if (item) {
      setFormTitle(item.title || item.name);
      setFormAmount(formatNumberInput(item.amount || item.price));
      setFormCategory(item.category || '');
      setFormWallet(item.walletId || '');
    } else {
      setFormTitle('');
      setFormAmount(mode === 'budget' ? (monthlyBudget ? formatNumberInput(monthlyBudget) : '') : '');
      const defaultCat = categories.find(c => c.type === type);
      setFormCategory(defaultCat?.id || '');
      setFormWallet(wallets.length > 0 ? wallets[0].id : '');
    }
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (modalMode === 'category') {
      if (!catName.trim()) return;
      const newCat = {
        id: editingItem?.id || `custom_${Date.now()}`,
        name: catName.trim(),
        icon: catIcon,
        bg: catColor,
        type: catType,
        isDefault: false
      };
      if (editingItem) {
        setCategories(prev => prev.map(c => c.id === editingItem.id ? newCat : c));
        addToast('Kategori diperbarui!');
      } else {
        setCategories(prev => [...prev, newCat]);
        addToast('Kategori baru ditambahkan!');
      }
      setShowModal(false);
      return;
    }

    if (modalMode === 'wallet') {
      if (!walletName.trim()) return;
      const bal = parseFloat(walletBalance.replace(/[^0-9]/g, ''));
      if (isNaN(bal)) return;

      const newWallet = {
        id: editingItem?.id || Date.now(),
        name: walletName.trim(),
        balance: bal,
        type: walletType,
        color: '#1A1D1E' // Default for now
      };

      if (editingItem) {
        setWallets(prev => prev.map(w => w.id === editingItem.id ? newWallet : w));
        addToast('Dompet diperbarui!');
      } else {
        setWallets(prev => [...prev, newWallet]);
        addToast('Dompet ditambahkan!');
      }
      setShowModal(false);
      return;
    }

    const amount = parseFloat(formAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) return;

    if (modalMode === 'budget') {
      setMonthlyBudget(amount);
      addToast('Budget diperbarui!');
    } else if (modalMode === 'wishlist') {
      const newItem = { id: editingItem?.id || Date.now(), name: formTitle, price: amount, purchased: false };
      if (editingItem) {
        setWishlist(prev => prev.map(i => i.id === editingItem.id ? newItem : i));
        addToast('Wishlist updated!');
      } else {
        setWishlist(prev => [...prev, newItem]);
        addToast('Ditambahkan ke wishlist');
      }
    } else {
      // Handle Wallet Balance Update Logic
      let updatedWallets = [...wallets];
      
      // 1. Revert Old Transaction Effect if Editing
      if (editingItem && editingItem.walletId) {
        updatedWallets = updatedWallets.map(w => {
          if (w.id === editingItem.walletId) {
            const revertAmount = editingItem.type === 'income' ? -editingItem.amount : editingItem.amount;
            return { ...w, balance: w.balance + revertAmount };
          }
          return w;
        });
      }

      // 2. Apply New Transaction Effect
      if (formWallet) {
        updatedWallets = updatedWallets.map(w => {
          if (w.id.toString() === formWallet.toString()) {
             const applyAmount = modalType === 'income' ? amount : -amount;
             return { ...w, balance: w.balance + applyAmount };
          }
          return w;
        });
      }
      setWallets(updatedWallets);

      const newTx = {
        id: editingItem?.id || Date.now(),
        title: formTitle,
        amount,
        type: modalType,
        category: formCategory,
        walletId: formWallet || null, // Add Wallet ID
        timestamp: editingItem?.timestamp || new Date().toISOString()
      };
      if (editingItem) {
        setTransactions(prev => prev.map(t => t.id === editingItem.id ? newTx : t));
        addToast('Transaksi updated!');
      } else {
        setTransactions(prev => [newTx, ...prev]);
        addToast(modalType === 'income' ? 'Uang Masuk!' : 'Uang Keluar!');
      }
    }
    setShowModal(false);
  };

  // Delete Handlers
  const handleDelete = () => {
    if (deleteType === 'wishlist') {
      setWishlist(prev => prev.filter(i => i.id !== confirmDelete));
    } else if (deleteType === 'category') {
      setCategories(prev => prev.filter(c => c.id !== confirmDelete));
    } else if (deleteType === 'wallet') {
      setWallets(prev => prev.filter(w => w.id !== confirmDelete));
    } else {
      // Revert wallet balance before deleting transaction
      const txToDelete = transactions.find(t => t.id === confirmDelete);
      if (txToDelete && txToDelete.walletId) {
        setWallets(prev => prev.map(w => {
          if (w.id === txToDelete.walletId) {
             const revertAmount = txToDelete.type === 'income' ? -txToDelete.amount : txToDelete.amount;
             return { ...w, balance: w.balance + revertAmount };
          }
          return w;
        }));
      }
      setTransactions(prev => prev.filter(t => t.id !== confirmDelete));
    }
    addToast('Dihapus', 'info');
    setConfirmDelete(null);
  };

  const markPurchased = (item) => {
    setWishlist(prev => prev.filter(i => i.id !== item.id));
    const shoppingCat = categories.find(c => c.id === 'shopping') || categories.find(c => c.type === 'expense');
    setTransactions(prev => [{
      id: Date.now(), title: item.name, amount: item.price, type: 'expense',
      category: shoppingCat?.id || 'shopping', timestamp: new Date().toISOString()
    }, ...prev]);
    addToast('Barang dibeli!');
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <LoaderCircle size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '100%' }}>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
      </div>

      {/* Header */}
      <Header user={user} syncing={syncing} onSettingsClick={() => setActiveTab('account')} />

      {/* Main Content */}
      <main style={{ paddingBottom: '20px' }}>
        {activeTab === 'home' && (
          <HomeTab 
            balance={displayBalance}
            transactions={transactions}
            categories={categories}
            wallets={wallets}
            onOpenModal={openModal}
            onDelete={(id) => { setConfirmDelete(id); setDeleteType('transaction'); }}
            onEdit={(item) => openModal('transaction', item.type, item)}
          />
        )}
        {activeTab === 'wishlist' && (
          <WishlistTab 
            wishlist={wishlist}
            balance={displayBalance}
            wishlistTotal={wishlistTotal}
            onOpenModal={openModal}
            onMarkPurchased={markPurchased}
            onDelete={(id) => { setConfirmDelete(id); setDeleteType('wishlist'); }}
          />
        )}
        {activeTab === 'wallet' && (
          <WalletTab 
            monthlyBudget={monthlyBudget}
            budgetProgress={budgetProgress}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            wallets={wallets}
            expenseCategories={expenseCategories}
            transactions={transactions}
            onOpenModal={openModal}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesTab 
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            onOpenModal={openModal}
            onDelete={(id) => { setConfirmDelete(id); setDeleteType('category'); }}
          />
        )}
        {activeTab === 'account' && (
          <AccountTab 
            user={user}
            authMode={authMode}
            authEmail={authEmail}
            authPassword={authPassword}
            authError={authError}
            isSubmitting={isSubmitting}
            showResend={showResend}
            syncing={syncing}
            wallets={wallets}
            onAuth={handleAuth}
            onResend={handleResend}
            onLogout={handleLogout}
            onSetAuthMode={setAuthMode}
            onSetAuthEmail={setAuthEmail}
            onSetAuthPassword={setAuthPassword}
            onSetAuthError={setAuthError}
            onSetShowResend={setShowResend}
            onSync={syncToCloud}
            onOpenModal={openModal}
            onTabChange={setActiveTab}
            onDelete={(id) => { setConfirmDelete(id); setDeleteType('wallet'); }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddClick={() => openModal('transaction')} 
      />

      {/* Modal - Kept in App.jsx for now as it shares a lot of form state */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '900' }}>
                {modalMode === 'budget' && 'Set Budget'}
                {modalMode === 'wishlist' && (editingItem ? 'Edit Item' : 'New Item')}
                {modalMode === 'transaction' && (editingItem ? 'Edit' : 'Transaksi Baru')}
                {modalMode === 'category' && (editingItem ? 'Edit Kategori' : 'Kategori Baru')}
                {modalMode === 'wallet' && (editingItem ? 'Edit Dompet' : 'Dompet Baru')}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {modalMode === 'category' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NAMA KATEGORI</label>
                    <input type="text" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Contoh: Investasi" />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>TIPE</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['income', 'expense'].map(type => (
                        <button key={type} type="button" onClick={() => setCatType(type)} style={{
                          flex: 1, padding: '10px', border: '2px solid #1A1D1E', borderRadius: '8px',
                          background: catType === type ? '#1A1D1E' : '#fff',
                          color: catType === type ? '#fff' : '#1A1D1E',
                          fontWeight: '700', boxShadow: catType === type ? 'none' : '2px 2px 0px #1A1D1E'
                        }}>
                          {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </button>
                      ))}
                    </div>
                  </div>

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

              {modalMode === 'wallet' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NAMA DOMPET</label>
                    <input type="text" value={walletName} onChange={e => setWalletName(e.target.value)} placeholder="Contoh: Dompet Utama, BRI, DANA" />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>TIPE</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['cash', 'bank', 'ewallet'].map(type => (
                        <button key={type} type="button" onClick={() => setWalletType(type)} style={{
                          flex: 1, padding: '10px', border: '2px solid #1A1D1E', borderRadius: '8px',
                          background: walletType === type ? '#1A1D1E' : '#fff',
                          color: walletType === type ? '#fff' : '#1A1D1E',
                          fontWeight: '700', boxShadow: walletType === type ? 'none' : '2px 2px 0px #1A1D1E',
                          textTransform: 'capitalize'
                        }}>
                          {type === 'ewallet' ? 'E-Wallet' : type}
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

              {modalMode !== 'category' && modalMode !== 'wallet' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NOMINAL (RP)</label>
                    <input autoFocus type="text" inputMode="numeric" value={formAmount} onChange={e => setFormAmount(formatNumberInput(e.target.value))} placeholder="0" style={{ fontSize: '24px', textAlign: 'center' }} />
                  </div>

                  {modalMode !== 'budget' && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>
                        {modalMode === 'wishlist' ? 'NAMA BARANG' : 'KETERANGAN'}
                      </label>
                      <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="..." />
                    </div>
                  )}

                  {modalMode === 'transaction' && (
                    <>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>
                          {modalType === 'income' ? 'MASUK KE DOMPET' : 'SUMBER DANA'}
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
                        <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>KATEGORI</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {(modalType === 'income' ? incomeCategories : expenseCategories).map(cat => {
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
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <button type="submit" style={{
                width: '100%', padding: '16px', background: '#1A1D1E', color: '#fff',
                border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '800', fontSize: '16px',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
              }}>
                SIMPAN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" style={{ paddingBottom: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Trash2 size={48} />
              <h3 style={{ fontSize: '24px', fontWeight: '900', marginTop: '16px' }}>Hapus?</h3>
              <p>Yakin ingin menghapus ini?</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '16px', background: '#fff', border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700' }}>Batal</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '16px', background: '#FFC0C0', border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;