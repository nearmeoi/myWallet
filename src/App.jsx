import React, { useState, useEffect } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useWallet } from './context/WalletContext';
import Toast from './components/ui/Toast';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import ActionModal from './components/modals/ActionModal';

// Tabs
import HomeTab from './components/tabs/HomeTab';
import WishlistTab from './components/tabs/WishlistTab';
import WalletTab from './components/tabs/WalletTab';
import CategoriesTab from './components/tabs/CategoriesTab';
import AccountTab from './components/tabs/AccountTab';

function App() {
  // Context
  const { 
    user, loading: authLoading, 
    signIn, signUp, signOut, resendConfirmation 
  } = useAuth();
  
  const {
    transactions, wallets, categories, wishlist, monthlyBudget, syncing,
    displayBalance, totalExpense, totalIncome, syncToCloud,
    deleteTransaction, deleteWallet, deleteCategory, deleteWishlistItem,
    addTransaction // needed for markPurchased
  } = useWallet();

  // Auth Form State
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('transaction');
  const [modalType, setModalType] = useState('income');
  const [editingItem, setEditingItem] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Confirmation State
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);

  // Handle Back Button for Modals
  useEffect(() => {
    const handlePopState = () => {
      // If user presses back, close all modals
      setShowModal(false);
      setConfirmDelete(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update history when modal opens
  useEffect(() => {
    if (showModal || confirmDelete) {
      window.history.pushState({ modal: true }, '');
    }
  }, [showModal, confirmDelete]);

  // Computed Values
  const wishlistTotal = wishlist.reduce((a, b) => a + b.price, 0);
  const currentMonthExpenses = transactions.filter(t => {
    const d = new Date(t.timestamp);
    const now = new Date();
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((a, b) => a + b.amount, 0);
  const budgetProgress = monthlyBudget > 0 ? (currentMonthExpenses / monthlyBudget) * 100 : 0;
  
  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Toast Helpers
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => {
      const next = [...prev, { id, message, type }];
      if (next.length > 3) {
        return next.slice(1); // Remove the oldest one
      }
      return next;
    });
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
        const { error } = await signUp(authEmail, authPassword);
        if (error) throw error;
        addToast('Registrasi berhasil! Cek email untuk verifikasi.', 'info');
        setShowResend(true);
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
      const { error } = await resendConfirmation(authEmail);
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
    addToast('Berhasil logout', 'info');
  };

  // Modal Helpers
  const openModal = (mode, type = 'income', item = null) => {
    setModalMode(mode);
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  // Delete Handlers
  const handleDelete = () => {
    if (deleteType === 'wishlist') {
      deleteWishlistItem(confirmDelete);
    } else if (deleteType === 'category') {
      deleteCategory(confirmDelete);
    } else if (deleteType === 'wallet') {
      deleteWallet(confirmDelete);
    } else {
      deleteTransaction(confirmDelete);
    }
    addToast('Dihapus', 'info');
    setConfirmDelete(null);
  };

  const markPurchased = (item) => {
    deleteWishlistItem(item.id);
    const shoppingCat = categories.find(c => c.id === 'shopping') || categories.find(c => c.type === 'expense');
    addTransaction({
      title: item.name,
      amount: item.price,
      type: 'expense',
      category: shoppingCat?.id || 'shopping',
      walletId: wallets.length > 0 ? wallets[0].id : null
    });
    addToast('Barang dibeli!');
  };

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
            transactions={transactions}
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
            addToast={addToast}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onAddClick={() => openModal('transaction')} 
      />

      {/* Action Modal */}
      <ActionModal 
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          if (window.history.state?.modal) window.history.back();
        }}
        mode={modalMode}
        type={modalType}
        editingItem={editingItem}
        addToast={addToast}
      />

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => {
          setConfirmDelete(null);
          if (window.history.state?.modal) window.history.back();
        }}>
          <div className="modal-content" style={{ paddingBottom: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Trash2 size={48} />
              <h3 style={{ fontSize: '24px', fontWeight: '900', marginTop: '16px' }}>Hapus?</h3>
              <p>Yakin ingin menghapus ini?</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => {
                setConfirmDelete(null);
                if (window.history.state?.modal) window.history.back();
              }} style={{ flex: 1, padding: '16px', background: '#fff', border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700' }}>Batal</button>
              <button onClick={() => {
                handleDelete();
                if (window.history.state?.modal) window.history.back();
              }} style={{ flex: 1, padding: '16px', background: '#FFC0C0', border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;