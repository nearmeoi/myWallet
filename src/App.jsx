import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useWallet } from './context/WalletContext';
import { useDebt } from './context/DebtContext';
import { useSavings } from './context/SavingsContext';
import { parseReceiptText } from './lib/receiptParser';
import { formatRupiah } from './lib/utils';
import Toast from './components/ui/Toast';
import ConfirmDialog from './components/ui/ConfirmDialog';
import ReceiptConfirmModal from './components/modals/ReceiptConfirmModal';
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
    addTransaction, resetWalletData
  } = useWallet();

  const { deleteDebt, refreshDebts, resetDebtData } = useDebt();
  const { deleteSaving, refreshSavings, resetSavingsData } = useSavings();
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

  const [returnTab, setReturnTab] = useState('home');

  // Back button handling for modals and sub-tabs
  useEffect(() => {
    const handlePopState = (event) => {
      if (showModal || confirmDelete) {
        setShowModal(false);
        setConfirmDelete(null);
      } else if (activeTab === 'wallet' || activeTab === 'categories') {
        const from = event.state?.from || returnTab || 'home';
        setActiveTab(from);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showModal, confirmDelete, activeTab, returnTab]);

  useEffect(() => {
    if (showModal || confirmDelete) {
      window.history.pushState({ modal: true }, '');
    }
  }, [showModal, confirmDelete]);

  const handleTabChange = (newTab) => {
    if (newTab === 'wallet' || newTab === 'categories') {
      setReturnTab(activeTab);
      window.history.pushState({ subTab: newTab, from: activeTab }, '');
    }
    setActiveTab(newTab);
  };

  const handleBackFromSubTab = () => {
    if (window.history.state?.subTab) {
      window.history.back();
    } else {
      setActiveTab(returnTab || 'home');
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

  // Incoming Receipt Confirmation State & Handlers with localStorage persistence
  const [receiptConfirmData, setReceiptConfirmData] = useState(() => {
    try {
      const saved = localStorage.getItem('mywallet_pending_receipt');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const setAndPersistReceipt = useCallback((data) => {
    setReceiptConfirmData(data);
    try {
      if (data) {
        localStorage.setItem('mywallet_pending_receipt', JSON.stringify(data));
      } else {
        localStorage.removeItem('mywallet_pending_receipt');
      }
    } catch (e) {
      console.warn('Error persisting receipt:', e);
    }
  }, []);

  const handleConfirmReceipt = () => {
    if (!receiptConfirmData) return;
    addTransaction({
      title: receiptConfirmData.title,
      amount: receiptConfirmData.amount,
      type: 'expense',
      category: receiptConfirmData.category,
      walletId: receiptConfirmData.walletId || null
    });
    addToast(`Transaksi ${formatRupiah(receiptConfirmData.amount)} berhasil dicatat!`, 'success');
    setAndPersistReceipt(null);
  };

  const triggerSampleReceipt = () => {
    setAndPersistReceipt({
      title: 'Kopi Kenangan Grand Indonesia',
      amount: 52000,
      bank: 'Mandiri',
      category: 'coffee',
      walletId: wallets[0]?.id || ''
    });
  };

  const handleEditReceipt = () => {
    if (!receiptConfirmData) return;
    setModalMode('transaction');
    setModalType('expense');
    setEditingItem({
      title: receiptConfirmData.title,
      amount: receiptConfirmData.amount,
      category: receiptConfirmData.category,
      walletId: receiptConfirmData.walletId,
      type: 'expense',
      _receiptKey: Date.now()
    });
    setAndPersistReceipt(null);
    setShowModal(true);
  };

  const processReceiptUrl = useCallback(() => {
    let receiptRaw = '';
    try {
      // 1. Check searchParams (?receipt=... or ?ocr=... or ?text=...)
      if (window.location.search) {
        const searchParams = new URLSearchParams(window.location.search);
        receiptRaw = searchParams.get('receipt') || searchParams.get('ocr') || searchParams.get('text') || '';
      }

      // 2. Check hash (#receipt=... or #?receipt=... or #/receipt=... or #ocr=... or #text=...)
      if (!receiptRaw && window.location.hash) {
        const hashStr = window.location.hash.replace(/^#\/?/, '');
        const queryPart = hashStr.includes('?') ? hashStr.substring(hashStr.indexOf('?') + 1) : hashStr;
        const hashParams = new URLSearchParams(queryPart);
        receiptRaw = hashParams.get('receipt') || hashParams.get('ocr') || hashParams.get('text') || '';
        
        if (!receiptRaw && hashStr.startsWith('receipt=')) {
          receiptRaw = hashStr.substring('receipt='.length);
        } else if (!receiptRaw && hashStr.length > 20 && (hashStr.includes('%') || hashStr.includes('Rp') || hashStr.includes('rp'))) {
          // Fallback: direct text in hash
          receiptRaw = hashStr;
        }
      }
    } catch (e) {
      console.warn('Error reading URL params:', e);
    }

    if (!receiptRaw) return;

    let receiptText = receiptRaw;
    try {
      // Decode percent encoding (handles single and double encoding)
      let safetyCounter = 0;
      while (receiptText.includes('%') && safetyCounter < 3) {
        const decoded = decodeURIComponent(receiptText);
        if (decoded === receiptText) break;
        receiptText = decoded;
        safetyCounter++;
      }
    } catch (e) {
      // ignore URI malformed error
    }

    // Clean query parameter and hash from URL after reading
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('receipt');
      url.searchParams.delete('ocr');
      url.searchParams.delete('text');
      let cleanHash = '';
      if (url.hash && (url.hash.includes('receipt') || url.hash.includes('ocr') || url.hash.includes('text'))) {
        cleanHash = '';
      } else {
        cleanHash = url.hash;
      }
      window.history.replaceState({}, document.title, url.pathname + cleanHash);
    } catch (e) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const parsed = parseReceiptText(receiptText);
    if (parsed && parsed.success && parsed.amount > 0) {
      // Find matching wallet by bank name
      let matchWalletId = wallets.length > 0 ? wallets[0].id : '';
      if (parsed.bank) {
        const matched = wallets.find(w => {
          const wName = (w.name || '').toLowerCase();
          const bName = (parsed.bank || '').toLowerCase();
          return wName.includes(bName) || bName.includes(wName);
        });
        if (matched) matchWalletId = matched.id;
      }

      // Find matching category
      let catId = parsed.category || 'other_expense';
      const catExists = categories.find(c => c.id === catId && c.type === 'expense');
      if (!catExists) {
        const defaultExp = categories.find(c => c.type === 'expense');
        catId = defaultExp ? defaultExp.id : 'other_expense';
      }

      // Show confirmation dialog so user can verify before saving!
      setAndPersistReceipt({
        title: parsed.title || `Transaksi ${parsed.bank}`,
        amount: parsed.amount,
        bank: parsed.bank,
        category: catId,
        walletId: matchWalletId
      });
    } else {
      addToast('Teks struk terbaca, tetapi nominal belum terdeteksi. Silakan periksa format.', 'info');
      setModalMode('transaction');
      setModalType('expense');
      setEditingItem(null);
      setShowModal(true);
    }
  }, [wallets, categories, setAndPersistReceipt]);

  const checkClipboardReceipt = useCallback(async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) return;
      const text = await navigator.clipboard.readText();
      if (!text || text.length < 20) return;

      const lastProcessed = sessionStorage.getItem('mywallet_last_clip_receipt');
      if (lastProcessed === text) return;

      const parsed = parseReceiptText(text);
      if (parsed && parsed.success && parsed.amount > 0) {
        sessionStorage.setItem('mywallet_last_clip_receipt', text);

        let matchWalletId = wallets.length > 0 ? wallets[0].id : '';
        if (parsed.bank) {
          const matched = wallets.find(w => {
            const wName = (w.name || '').toLowerCase();
            const bName = (parsed.bank || '').toLowerCase();
            return wName.includes(bName) || bName.includes(wName);
          });
          if (matched) matchWalletId = matched.id;
        }

        let catId = parsed.category || 'other_expense';
        const catExists = categories.find(c => c.id === catId && c.type === 'expense');
        if (!catExists) {
          const defaultExp = categories.find(c => c.type === 'expense');
          catId = defaultExp ? defaultExp.id : 'other_expense';
        }

        setAndPersistReceipt({
          title: parsed.title || `Transaksi ${parsed.bank}`,
          amount: parsed.amount,
          bank: parsed.bank,
          category: catId,
          walletId: matchWalletId
        });
      }
    } catch (e) {
      // Ignore clipboard permission rejection if user didn't grant
    }
  }, [wallets, categories, setAndPersistReceipt]);

  useEffect(() => {
    processReceiptUrl();

    const handleResume = () => {
      setTimeout(processReceiptUrl, 150);
      setTimeout(checkClipboardReceipt, 400);
    };

    window.addEventListener('visibilitychange', handleResume);
    window.addEventListener('pageshow', handleResume);
    window.addEventListener('focus', handleResume);
    window.addEventListener('popstate', handleResume);
    window.addEventListener('hashchange', handleResume);

    return () => {
      window.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('pageshow', handleResume);
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('popstate', handleResume);
      window.removeEventListener('hashchange', handleResume);
    };
  }, [processReceiptUrl, checkClipboardReceipt]);

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
          if (error.message?.includes('Email not confirmed')) setShowResend(true);
          throw error;
        }
        addToast('Login berhasil!');
        setAuthEmail('');
        setAuthPassword('');
        setAuthConfirmPassword('');
      } else {
        const { data, error } = await signUp(authEmail, authPassword);
        if (error) throw error;
        if (data?.session) {
          addToast('Registrasi berhasil! Selamat datang.');
          setAuthEmail('');
          setAuthPassword('');
          setAuthConfirmPassword('');
        } else {
          addToast('Registrasi berhasil! Silakan cek email Anda.', 'info');
          setShowResend(true);
        }
      }
    } catch (err) {
      let msg = err.message || 'Terjadi kesalahan pada sistem autentikasi.';
      if (msg.includes('Error sending confirmation email') || err.status === 500) {
        msg = 'Gagal mengirim email verifikasi (kuota SMTP bawaan Supabase habis / limit 3 email/jam). Solusi: Buka Supabase Dashboard > Authentication > Providers > Email, lalu matikan toggle "Confirm email" agar user bisa langsung mendaftar tanpa verifikasi email.';
      } else if (msg.includes('User already registered') || msg.includes('already registered')) {
        msg = 'Email ini sudah terdaftar. Silakan langsung login.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Email atau password salah.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Email belum dikonfirmasi. Cek inbox/spam Anda atau hubungi admin.';
      } else if (msg.includes('Password should be at least 6 characters')) {
        msg = 'Password minimal 6 karakter.';
      }
      setAuthError(msg);
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
      let msg = err.message || 'Gagal mengirim ulang verifikasi.';
      if (msg.includes('Error sending') || err.status === 500) {
        msg = 'Gagal mengirim email (kuota mailer Supabase limit). Matikan "Confirm email" di Supabase Dashboard.';
      }
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('SignOut error:', e);
    }
    if (resetWalletData) resetWalletData();
    if (resetDebtData) resetDebtData();
    if (resetSavingsData) resetSavingsData();

    localStorage.removeItem('mywallet_transactions');
    localStorage.removeItem('mywallet_wishlist');
    localStorage.removeItem('mywallet_budget');
    localStorage.removeItem('mywallet_wallets');
    localStorage.removeItem('mywallet_debts');
    localStorage.removeItem('mywallet_savings');
    localStorage.setItem('mywallet_categories', JSON.stringify(DEFAULT_CATEGORIES));

    addToast('Berhasil logout. Data akun telah dibersihkan.', 'info');
  };

  // Modal Helpers
  const openModal = (mode, type = 'income', item = null) => {
    if (!user) {
      addToast('Silakan login terlebih dahulu untuk menambah atau mengedit data.', 'info');
      handleTabChange('account');
      return;
    }
    setModalMode(mode);
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  // Delete Handler
  const handleDelete = () => {
    if (!user) {
      addToast('Silakan login terlebih dahulu.', 'info');
      handleTabChange('account');
      setConfirmDelete(null);
      return;
    }
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
    if (!user) {
      addToast('Silakan login terlebih dahulu untuk menghapus data.', 'info');
      handleTabChange('account');
      return;
    }
    setConfirmDelete({ id, type });
  };

  // Determine which modal to render
  const isDebtModal = showModal && (modalMode === 'debt' || modalMode === 'debtPayment' || modalMode === 'debtEdit');
  const isSavingsModal = showModal && (modalMode === 'saving' || modalMode === 'savingTopUp' || modalMode === 'savingWithdraw' || modalMode === 'savingEdit');
  const isActionModal = showModal && !isDebtModal && !isSavingsModal;

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <LoaderCircle size={32} className="animate-spin" />
        {receiptConfirmData && (
          <ReceiptConfirmModal
            isOpen={Boolean(receiptConfirmData)}
            receiptData={receiptConfirmData}
            wallets={wallets}
            categories={categories}
            onConfirm={handleConfirmReceipt}
            onEdit={handleEditReceipt}
            onCancel={() => setAndPersistReceipt(null)}
          />
        )}
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
              user={user}
              balance={displayBalance}
              transactions={transactions}
              categories={categories}
              wallets={wallets}
              onOpenModal={openModal}
              onOpenSummary={() => handleTabChange('wallet')}
              onRequireAuth={() => handleTabChange('account')}
              onDelete={(id) => triggerDelete(id, 'transaction')}
              onEdit={(item) => openModal(item.category === 'transfer' ? 'transfer' : 'transaction', item.type, item)}
              onTriggerReceipt={setAndPersistReceipt}
              addToast={addToast}
            />
          )}

          {activeTab === 'debt' && (
            <DebtTab
              user={user}
              onOpenModal={openModal}
              onRequireAuth={() => handleTabChange('account')}
              onDelete={(id, type) => triggerDelete(id, type)}
              addToast={addToast}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsTab
              user={user}
              onOpenModal={openModal}
              onRequireAuth={() => handleTabChange('account')}
              onDelete={(id, type) => triggerDelete(id, type)}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletTab 
              monthlyBudget={monthlyBudget}
              budgetProgress={budgetProgress}
              wallets={wallets}
              categories={categories}
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
              onTriggerSampleReceipt={triggerSampleReceipt}
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
          key={`${modalMode}-${modalType}-${editingItem?.id || editingItem?._receiptKey || 'new'}`}
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

      {/* Quick Receipt Confirmation Dialog */}
      {receiptConfirmData && (
        <ReceiptConfirmModal
          isOpen={Boolean(receiptConfirmData)}
          receiptData={receiptConfirmData}
          wallets={wallets}
          categories={categories}
          onConfirm={handleConfirmReceipt}
          onEdit={handleEditReceipt}
          onCancel={() => setAndPersistReceipt(null)}
        />
      )}
    </div>
  );
}

export default App;