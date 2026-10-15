import React, { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useWallet } from './context/WalletContext';
import { useDebt } from './context/DebtContext';
import { useSavings } from './context/SavingsContext';
import Toast from './components/ui/Toast';
import ConfirmDialog from './components/ui/ConfirmDialog';
import PullToRefresh from './components/ui/PullToRefresh';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import ActionModal from './components/modals/ActionModal';
import DebtModal from './components/modals/DebtModal';
import SavingsModal from './components/modals/SavingsModal';

// Tabs
import HomeTab from './components/tabs/HomeTab';
import DebtTab from './components/tabs/DebtTab';
import SavingsTab from './components/tabs/SavingsTab';
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
    transactions, wallets, categories, monthlyBudget, syncing,
    displayBalance, totalExpense, totalIncome, syncToCloud,
    deleteTransaction, deleteWallet, deleteCategory,
    addTransaction
  } = useWallet();

  const { deleteDebt, refreshDebts } = useDebt();
  const { deleteSaving, refreshSavings } = useSavings();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState('home');
  const [toasts, setToasts] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('transaction');
  const [modalType, setModalType] = useState('income');
  const [editingItem, setEditingItem] = useState(null);

  // Confirm Delete State
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, type }

  // Scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Back button handling for modals and sub-tabs
  useEffect(() => {
    const handlePopState = () => {
      if (showModal || confirmDelete) {
        setShowModal(false);
        setConfirmDelete(null);
      } else if (activeTab === 'wallet' || activeTab === 'categories') {
        setActiveTab('account');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showModal, confirmDelete, activeTab]);

  useEffect(() => {
    if (showModal || confirmDelete) {
      window.history.pushState({ modal: true }, '');
    }
  }, [showModal, confirmDelete]);

  const handleTabChange = (newTab) => {
    if ((newTab === 'wallet' || newTab === 'categories') && activeTab === 'account') {
      window.history.pushState({ subTab: newTab }, '');
    }
    setActiveTab(newTab);
  };

  const handleBackFromSubTab = () => {
    if (window.history.state?.subTab) {
      window.history.back();
    } else {
      setActiveTab('account');
    }
  };

  // Computed Values
  const currentMonthExpenses = transactions.filter(t => {
    const d = new Date(t.timestamp);
    const now = new Date();
    return t.type === 'expense' && t.category !== 'transfer' && t.category !== 'saving'
      && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((a, b) => a + b.amount, 0);
  const budgetProgress = monthlyBudget > 0 ? (currentMonthExpenses / monthlyBudget) * 100 : 0;
  
  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Toast Helpers
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => {
      const next = [...prev, { id, message, type }];
      return next.length > 3 ? next.slice(1) : next;
    });
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Auth Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setShowResend(false);

    if (authMode === 'register') {
      if (!authEmail || !authPassword || !authConfirmPassword) {
        setAuthError('Email, password, dan konfirmasi password harus diisi');
        return;
      }
      if (authPassword.length < 6) { setAuthError('Password minimal 6 karakter'); return; }
      if (authPassword !== authConfirmPassword) { setAuthError('Password tidak cocok'); return; }
    } else {
      if (!authEmail || !authPassword) { setAuthError('Email dan password harus diisi'); return; }
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const { error } = await signIn(authEmail, authPassword);
        if (error) {
          if (error.message.includes('Email not confirmed')) setShowResend(true);
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

  // Delete Handler
  const handleDelete = () => {
    if (!confirmDelete) return;
    const { id, type } = confirmDelete;

    if (type === 'transaction') deleteTransaction(id);
    else if (type === 'category') deleteCategory(id);
    else if (type === 'wallet') deleteWallet(id);
    else if (type === 'debt') deleteDebt(id);
    else if (type === 'saving') deleteSaving(id);

    addToast('Dihapus', 'info');
    setConfirmDelete(null);
    if (window.history.state?.modal) window.history.back();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const p = [];
      if (syncToCloud) p.push(syncToCloud());
      if (refreshDebts) p.push(refreshDebts());
      if (refreshSavings) p.push(refreshSavings());
      await Promise.all(p);
      addToast('Data tersinkronisasi!', 'success');
    } catch (err) {
      addToast('Gagal memuat ulang data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const triggerDelete = (id, type) => {
    setConfirmDelete({ id, type });
  };

  // Determine which modal to render
  const isDebtModal = showModal && (modalMode === 'debt' || modalMode === 'debtPayment');
  const isSavingsModal = showModal && (modalMode === 'saving' || modalMode === 'savingTopUp' || modalMode === 'savingWithdraw');
  const isActionModal = showModal && !isDebtModal && !isSavingsModal;

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
      <Header 
        user={user} 
        syncing={syncing || isRefreshing} 
        onSettingsClick={() => handleTabChange('account')} 
        onRefresh={handleRefresh}
      />

      {/* Main Content with Pull-To-Refresh */}
      <PullToRefresh onRefresh={handleRefresh} refreshing={syncing || isRefreshing}>
        <main style={{ paddingBottom: '20px' }}>
          {activeTab === 'home' && (
            <HomeTab 
              balance={displayBalance}
              transactions={transactions}
              categories={categories}
              wallets={wallets}
              onOpenModal={openModal}
              onDelete={(id) => triggerDelete(id, 'transaction')}
              onEdit={(item) => openModal('transaction', item.type, item)}
            />
          )}

          {activeTab === 'debt' && (
            <DebtTab
              onOpenModal={openModal}
              onDelete={(id, type) => triggerDelete(id, type)}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsTab
              onOpenModal={openModal}
              onDelete={(id, type) => triggerDelete(id, type)}
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
              onBack={handleBackFromSubTab}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab 
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              transactions={transactions}
              onOpenModal={openModal}
              onDelete={(id) => triggerDelete(id, 'category')}
              onBack={handleBackFromSubTab}
            />
          )}

          {activeTab === 'account' && (
            <AccountTab 
              user={user}
              authMode={authMode}
              authEmail={authEmail}
              authPassword={authPassword}
              authConfirmPassword={authConfirmPassword}
              authError={authError}
              isSubmitting={isSubmitting}
              showResend={showResend}
              syncing={syncing || isRefreshing}
              wallets={wallets}
              onAuth={handleAuth}
              onResend={handleResend}
              onLogout={handleLogout}
              onSetAuthMode={setAuthMode}
              onSetAuthEmail={setAuthEmail}
              onSetAuthPassword={setAuthPassword}
              onSetAuthConfirmPassword={setAuthConfirmPassword}
              onSetAuthError={setAuthError}
              onSetShowResend={setShowResend}
              onSync={handleRefresh}
              onOpenModal={openModal}
              onTabChange={handleTabChange}
              onDelete={(id) => triggerDelete(id, 'wallet')}
              addToast={addToast}
            />
          )}
        </main>
      </PullToRefresh>

      {/* Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onAddClick={() => openModal('transaction')} 
      />

      {/* Action Modal (transaction, wallet, category, budget, transfer) */}
      {isActionModal && (
        <ActionModal 
          key={`${modalMode}-${modalType}-${editingItem?.id || 'new'}`}
          isOpen={isActionModal}
          onClose={() => {
            setShowModal(false);
            if (window.history.state?.modal) window.history.back();
          }}
          mode={modalMode}
          type={modalType}
          editingItem={editingItem}
          addToast={addToast}
        />
      )}

      {/* Debt Modal */}
      {isDebtModal && (
        <DebtModal
          key={`debt-${editingItem?.id || 'new'}`}
          isOpen={isDebtModal}
          onClose={() => {
            setShowModal(false);
            if (window.history.state?.modal) window.history.back();
          }}
          mode={modalMode}
          editingItem={editingItem}
          addToast={addToast}
        />
      )}

      {/* Savings Modal */}
      {isSavingsModal && (
        <SavingsModal
          key={`saving-${modalMode}-${editingItem?.id || 'new'}`}
          isOpen={isSavingsModal}
          onClose={() => {
            setShowModal(false);
            if (window.history.state?.modal) window.history.back();
          }}
          mode={modalMode}
          editingItem={editingItem}
          addToast={addToast}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          onConfirm={handleDelete}
          onCancel={() => {
            setConfirmDelete(null);
            if (window.history.state?.modal) window.history.back();
          }}
        />
      )}
    </div>
  );
}

export default App;