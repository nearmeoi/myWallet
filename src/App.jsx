import React, { useState, useEffect } from 'react';
import {
  Plus, Home, X, Check, Info, PieChart, ShoppingBag, User,
  Trash2, Edit3, ArrowUpRight, ArrowDownLeft, Target, Briefcase,
  Utensils, Car, ShoppingCart, Coffee, Gift, CreditCard, MoreHorizontal,
  Settings, Tag, Palette, ChevronRight, Mail, Lock, LogOut, Loader, Cloud, CloudOff
} from 'lucide-react';
import TransactionCard from './components/TransactionCard';
import {
  supabase, signUp, signIn, signOut, onAuthStateChange,
  syncTransactions, fetchTransactions, syncCategories, fetchCategories,
  syncWishlist, fetchWishlist, syncBudget, fetchBudget
} from './lib/supabase';

// Available Icons
const AVAILABLE_ICONS = {
  Briefcase, Utensils, Car, ShoppingCart, Coffee, Gift, CreditCard,
  MoreHorizontal, Target, Home, Tag, Palette, User, Settings
};

// Preset Colors
const PRESET_COLORS = [
  '#D4F7E6', '#FEF9C3', '#BBEFFA', '#E0CCF8', '#F8D4E3',
  '#FFC0C0', '#E5E7EB', '#F3F4F6', '#FBBF24', '#A78BFA'
];

// Default Categories
const DEFAULT_CATEGORIES = [
  { id: 'salary', name: 'Gaji', icon: 'Briefcase', bg: '#D4F7E6', type: 'income', isDefault: true },
  { id: 'gift', name: 'Hadiah', icon: 'Gift', bg: '#FFC0C0', type: 'income', isDefault: true },
  { id: 'other_income', name: 'Lainnya', icon: 'MoreHorizontal', bg: '#F3F4F6', type: 'income', isDefault: true },
  { id: 'food', name: 'Makanan', icon: 'Utensils', bg: '#FEF9C3', type: 'expense', isDefault: true },
  { id: 'transport', name: 'Transport', icon: 'Car', bg: '#BBEFFA', type: 'expense', isDefault: true },
  { id: 'shopping', name: 'Belanja', icon: 'ShoppingCart', bg: '#E0CCF8', type: 'expense', isDefault: true },
  { id: 'coffee', name: 'Kopi', icon: 'Coffee', bg: '#F8D4E3', type: 'expense', isDefault: true },
  { id: 'bills', name: 'Tagihan', icon: 'CreditCard', bg: '#E5E7EB', type: 'expense', isDefault: true },
  { id: 'other_expense', name: 'Lainnya', icon: 'MoreHorizontal', bg: '#F3F4F6', type: 'expense', isDefault: true }
];

const formatDate = (dateInput) => {
  const now = new Date();
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isToday) return `Hari ini, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  if (date.toDateString() === yesterday.toDateString()) return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + `, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
};

const formatRupiah = (num) => 'Rp ' + Math.abs(num).toLocaleString('id-ID');

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast">
      <div style={{
        width: '32px', height: '32px', borderRadius: '4px', border: '2px solid #1A1D1E',
        background: type === 'success' ? '#D4F7E6' : type === 'error' ? '#FFC0C0' : '#BBEFFA',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {type === 'success' ? <Check size={18} /> : <Info size={18} />}
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: '700' }}>{type === 'success' ? 'Sukses!' : type === 'error' ? 'Error' : 'Info'}</p>
        <p style={{ fontSize: '13px', fontWeight: '500' }}>{message}</p>
      </div>
    </div>
  );
};

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

  // Data State
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('mywallet_transactions') || '[]'));
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem('mywallet_wishlist') || '[]'));
  const [monthlyBudget, setMonthlyBudget] = useState(() => parseInt(localStorage.getItem('mywallet_budget') || '0'));
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
  const [editingItem, setEditingItem] = useState(null);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catColor, setCatColor] = useState('#E0CCF8');
  const [catType, setCatType] = useState('expense');

  // Other UI State
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [filterType, setFilterType] = useState('all');

  // Computed Values
  const balance = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const wishlistTotal = wishlist.reduce((a, b) => a + b.price, 0);
  const currentMonthExpenses = transactions.filter(t => {
    const d = new Date(t.timestamp);
    const now = new Date();
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((a, b) => a + b.amount, 0);
  const budgetProgress = monthlyBudget > 0 ? (currentMonthExpenses / monthlyBudget) * 100 : 0;

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
      const [txRes, catRes, wishRes, budgetRes] = await Promise.all([
        fetchTransactions(userId),
        fetchCategories(userId),
        fetchWishlist(userId),
        fetchBudget(userId)
      ]);

      if (txRes.data && txRes.data.length > 0) setTransactions(txRes.data);
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (wishRes.data && wishRes.data.length > 0) setWishlist(wishRes.data);
      if (budgetRes.budget) setMonthlyBudget(budgetRes.budget);

      addToast('Data berhasil disinkronkan!');
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
        syncBudget(user.id, monthlyBudget)
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
  }, [transactions, categories, wishlist, monthlyBudget, user]);

  // Local persistence
  useEffect(() => localStorage.setItem('mywallet_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('mywallet_wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('mywallet_budget', monthlyBudget.toString()), [monthlyBudget]);
  useEffect(() => localStorage.setItem('mywallet_categories', JSON.stringify(categories)), [categories]);

  // Helper: Get category by ID
  const getCategoryById = (id) => categories.find(c => c.id === id) || { name: 'Lainnya', icon: 'MoreHorizontal', bg: '#F3F4F6' };

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

    if (!authEmail || !authPassword) {
      setAuthError('Email dan password harus diisi');
      return;
    }

    try {
      if (authMode === 'login') {
        const { error } = await signIn(authEmail, authPassword);
        if (error) throw error;
        addToast('Login berhasil!');
      } else {
        const { error } = await signUp(authEmail, authPassword);
        if (error) throw error;
        addToast('Registrasi berhasil! Cek email untuk verifikasi.', 'info');
      }
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      setAuthError(err.message);
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
    } else if (item) {
      setFormTitle(item.title || item.name);
      setFormAmount(item.amount?.toString() || item.price?.toString());
      setFormCategory(item.category || '');
    } else {
      setFormTitle('');
      setFormAmount(mode === 'budget' ? (monthlyBudget ? monthlyBudget.toString() : '') : '');
      const defaultCat = categories.find(c => c.type === type);
      setFormCategory(defaultCat?.id || '');
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
      const newTx = {
        id: editingItem?.id || Date.now(),
        title: formTitle,
        amount,
        type: modalType,
        category: formCategory,
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
    } else {
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

  // Filtered Data
  const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);
  const visibleTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 5);
  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Loading Screen
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader size={32} className="animate-spin" />
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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', background: user ? '#D4F7E6' : '#FEF08A',
            border: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontWeight: '700' }}>{user ? user.email[0].toUpperCase() : 'G'}</span>
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Wallet<span style={{ color: '#BBEFFA' }}>.</span>
            </h1>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#666' }}>
                {syncing ? <Loader size={10} className="animate-spin" /> : <Cloud size={10} />}
                <span>{syncing ? 'Syncing...' : 'Synced'}</span>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setActiveTab('account')} style={{
          width: '40px', height: '40px', borderRadius: '12px', background: '#FFFFFF',
          border: '2px solid #1A1D1E', boxShadow: '2px 2px 0px #1A1D1E',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main style={{ paddingBottom: '20px' }}>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            <section className="card" style={{ background: '#BBEFFA', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Saldo.</p>
                <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '24px', lineHeight: '1' }}>
                  {formatRupiah(balance)}
                </h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => openModal('transaction', 'income')} style={{
                    flex: 1, padding: '12px', background: '#1A1D1E', color: '#fff',
                    border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
                  }}>
                    <ArrowDownLeft size={18} /> Masuk
                  </button>
                  <button onClick={() => openModal('transaction', 'expense')} style={{
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
                  return (
                    <div key={tx.id} className="animate-slide-up">
                      <TransactionCard
                        transaction={{ ...tx, date: formatDate(tx.timestamp) }}
                        category={{ ...cat, icon: IconComp }}
                        onEdit={() => openModal('transaction', tx.type, tx)}
                        onDelete={() => { setConfirmDelete(tx.id); setDeleteType('transaction'); }}
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
        )}

        {/* WISHLIST TAB */}
        {activeTab === 'wishlist' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '900' }}>Wishlist.</h2>
              <button onClick={() => openModal('wishlist')} style={{
                width: '44px', height: '44px', background: '#E0CCF8', border: '2px solid #1A1D1E',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '4px 4px 0px #1A1D1E'
              }}>
                <Plus size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <div className="card" style={{ flex: 1, padding: '16px', margin: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>TARGET</p>
                <p style={{ fontSize: '18px', fontWeight: '900' }}>{formatRupiah(wishlistTotal)}</p>
              </div>
              <div className="card" style={{ flex: 1, padding: '16px', margin: 0, background: '#FEF9C3' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>SISA</p>
                <p style={{ fontSize: '18px', fontWeight: '900' }}>{formatRupiah(balance - wishlistTotal)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {wishlist.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontWeight: '700' }}>Belum ada keinginan.</p>
                </div>
              ) : (
                wishlist.map(item => (
                  <div key={item.id} className="card" style={{ padding: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', border: '2px solid #1A1D1E', borderRadius: '8px', background: '#E0CCF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingBag size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{item.name}</h3>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>{formatRupiah(item.price)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => markPurchased(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div style={{ padding: '8px', border: '2px solid #1A1D1E', borderRadius: '6px', background: '#D4F7E6', boxShadow: '2px 2px 0px #1A1D1E' }}>
                          <Check size={16} />
                        </div>
                      </button>
                      <button onClick={() => { setConfirmDelete(item.id); setDeleteType('wishlist'); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div style={{ padding: '8px', border: '2px solid #1A1D1E', borderRadius: '6px', background: '#FFC0C0', boxShadow: '2px 2px 0px #1A1D1E' }}>
                          <Trash2 size={16} />
                        </div>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* STATS TAB */}
        {activeTab === 'wallet' && (
          <>
            <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>Ringkasan.</h2>

            <div className="card" onClick={() => openModal('budget')} style={{
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

            <h3 style={{ marginTop: '24px', marginBottom: '16px', fontWeight: '800' }}>Breakdown.</h3>
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
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <>
            <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>Kategori.</h2>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Pemasukan</h3>
                <button onClick={() => openModal('category', 'income')} style={{
                  padding: '6px 12px', background: '#D4F7E6', border: '2px solid #1A1D1E',
                  borderRadius: '8px', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E'
                }}>
                  + Tambah
                </button>
              </div>
              <div className="card" style={{ padding: '0', margin: 0 }}>
                {incomeCategories.map(cat => {
                  const IconComp = AVAILABLE_ICONS[cat.icon] || Tag;
                  return (
                    <div key={cat.id} style={{ padding: '12px 16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: cat.bg, border: '2px solid #1A1D1E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconComp size={18} />
                      </div>
                      <span style={{ flex: 1, fontWeight: '600' }}>{cat.name}</span>
                      {!cat.isDefault && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openModal('category', 'income', cat)} style={{ background: 'none', border: 'none' }}><Edit3 size={18} /></button>
                          <button onClick={() => { setConfirmDelete(cat.id); setDeleteType('category'); }} style={{ background: 'none', border: 'none', color: '#EF4444' }}><Trash2 size={18} /></button>
                        </div>
                      )}
                      {cat.isDefault && <span style={{ fontSize: '11px', color: '#999', background: '#F3F4F6', padding: '2px 8px', borderRadius: '10px' }}>Default</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Pengeluaran</h3>
                <button onClick={() => openModal('category', 'expense')} style={{
                  padding: '6px 12px', background: '#FFC0C0', border: '2px solid #1A1D1E',
                  borderRadius: '8px', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E'
                }}>
                  + Tambah
                </button>
              </div>
              <div className="card" style={{ padding: '0', margin: 0 }}>
                {expenseCategories.map(cat => {
                  const IconComp = AVAILABLE_ICONS[cat.icon] || Tag;
                  return (
                    <div key={cat.id} style={{ padding: '12px 16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', background: cat.bg, border: '2px solid #1A1D1E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconComp size={18} />
                      </div>
                      <span style={{ flex: 1, fontWeight: '600' }}>{cat.name}</span>
                      {!cat.isDefault && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => openModal('category', 'expense', cat)} style={{ background: 'none', border: 'none' }}><Edit3 size={18} /></button>
                          <button onClick={() => { setConfirmDelete(cat.id); setDeleteType('category'); }} style={{ background: 'none', border: 'none', color: '#EF4444' }}><Trash2 size={18} /></button>
                        </div>
                      )}
                      {cat.isDefault && <span style={{ fontSize: '11px', color: '#999', background: '#F3F4F6', padding: '2px 8px', borderRadius: '10px' }}>Default</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <>
            <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>Akun.</h2>

            {!user ? (
              <div className="card" style={{ padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', background: '#FEF08A', border: '2px solid #1A1D1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={40} />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{authMode === 'login' ? 'Login' : 'Daftar'}</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>Sinkronisasi data antar perangkat</p>
                </div>

                <form onSubmit={handleAuth}>
                  {authError && (
                    <div style={{ padding: '12px', background: '#FFC0C0', border: '2px solid #1A1D1E', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                      {authError}
                    </div>
                  )}

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>EMAIL</label>
                    <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="email@example.com" />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>PASSWORD</label>
                    <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" />
                  </div>

                  <button type="submit" style={{
                    width: '100%', padding: '14px', background: '#1A1D1E', color: '#fff',
                    border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
                    boxShadow: '4px 4px 0px rgba(0,0,0,0.2)', marginBottom: '12px'
                  }}>
                    {authMode === 'login' ? 'Login' : 'Daftar'}
                  </button>

                  <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{
                    width: '100%', padding: '14px', background: '#FFFFFF', color: '#1A1D1E',
                    border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
                    boxShadow: '4px 4px 0px #1A1D1E'
                  }}>
                    {authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', background: '#D4F7E6', border: '2px solid #1A1D1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '32px', fontWeight: '800' }}>{user.email[0].toUpperCase()}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>{user.email}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#666', fontSize: '13px', marginBottom: '24px' }}>
                  <Cloud size={14} /> Data tersinkronisasi
                </div>

                <button onClick={handleLogout} style={{
                  width: '100%', padding: '14px', background: '#FFC0C0', color: '#1A1D1E',
                  border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
                  boxShadow: '4px 4px 0px #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Pengaturan</h3>
              <div className="card" style={{ padding: '0', margin: 0 }}>
                <div onClick={() => setActiveTab('categories')} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <Tag size={20} />
                  <span style={{ flex: 1, fontWeight: '600' }}>Kelola Kategori</span>
                  <ChevronRight size={20} color="#999" />
                </div>
                {user && (
                  <div onClick={syncToCloud} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    {syncing ? <Loader size={20} className="animate-spin" /> : <Cloud size={20} />}
                    <span style={{ flex: 1, fontWeight: '600' }}>{syncing ? 'Syncing...' : 'Sync Sekarang'}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
          <Home size={24} />
        </button>
        <button className={activeTab === 'wishlist' ? 'active' : ''} onClick={() => setActiveTab('wishlist')}>
          <ShoppingBag size={24} />
        </button>
        <button className="bottom-nav-add" onClick={() => openModal('transaction')}>
          <Plus size={28} />
        </button>
        <button className={activeTab === 'wallet' ? 'active' : ''} onClick={() => setActiveTab('wallet')}>
          <PieChart size={24} />
        </button>
        <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}>
          <User size={24} />
        </button>
      </nav>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '900' }}>
                {modalMode === 'budget' && 'Set Budget'}
                {modalMode === 'wishlist' && (editingItem ? 'Edit Item' : 'New Item')}
                {modalMode === 'transaction' && (editingItem ? 'Edit' : 'Transaksi Baru')}
                {modalMode === 'category' && (editingItem ? 'Edit Kategori' : 'Kategori Baru')}
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

              {modalMode !== 'category' && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>NOMINAL (RP)</label>
                    <input autoFocus type="text" inputMode="numeric" value={formAmount} onChange={e => setFormAmount(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" style={{ fontSize: '24px', textAlign: 'center' }} />
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
