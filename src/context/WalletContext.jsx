import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchTransactions, createTransaction, updateTransaction as apiUpdateTransaction, deleteTransaction as apiDeleteTransaction,
  fetchCategories, createCategory, updateCategory as apiUpdateCategory, deleteCategory as apiDeleteCategory,
  fetchWishlist, createWishlist, updateWishlist as apiUpdateWishlist, deleteWishlist as apiDeleteWishlist,
  fetchBudget, syncBudget,
  fetchWallets, createWallet, updateWallet as apiUpdateWallet, deleteWallet as apiDeleteWallet,
  isSupabaseConfigured
} from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../lib/constants';

const WalletContext = createContext();

export function useWallet() {
  return useContext(WalletContext);
}

export const findTransferTwin = (tx, allTransactions) => {
  if (!tx || tx.category !== 'transfer' || !allTransactions) return null;

  // 1. Match by explicit transferId
  if (tx.transferId) {
    const byTransferId = allTransactions.find(t => 
      t.id.toString() !== tx.id.toString() && t.transferId === tx.transferId
    );
    if (byTransferId) return byTransferId;
  }

  // 2. Exact timestamp match with opposite type
  const exactTwin = allTransactions.find(t => 
    t.id.toString() !== tx.id.toString() && 
    t.category === 'transfer' && 
    t.type !== tx.type &&
    t.timestamp === tx.timestamp
  );
  if (exactTwin) return exactTwin;

  // 3. Approximate timestamp match (within 5 seconds) with same amount and opposite type
  const txTime = new Date(tx.timestamp).getTime();
  const txAmount = parseFloat(tx.amount || 0);

  const approxTwin = allTransactions.find(t => {
    if (t.id.toString() === tx.id.toString() || t.category !== 'transfer') return false;
    if (t.type === tx.type) return false;
    const amountDiff = Math.abs(parseFloat(t.amount || 0) - txAmount);
    if (amountDiff > 0.01) return false;
    const tTime = new Date(t.timestamp).getTime();
    return Math.abs(tTime - txTime) <= 5000;
  });
  if (approxTwin) return approxTwin;

  // 4. Match within 60 seconds with same amount and opposite type
  return allTransactions.find(t => {
    if (t.id.toString() === tx.id.toString() || t.category !== 'transfer') return false;
    if (t.type === tx.type) return false;
    const amountDiff = Math.abs(parseFloat(t.amount || 0) - txAmount);
    if (amountDiff > 0.01) return false;
    const tTime = new Date(t.timestamp).getTime();
    return Math.abs(tTime - txTime) <= 60000;
  }) || null;
};

export function WalletProvider({ children }) {
  const { user } = useAuth();
  
  // Data State
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('mywallet_transactions') || '[]'));
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem('mywallet_wishlist') || '[]'));
  const [monthlyBudget, setMonthlyBudget] = useState(() => parseInt(localStorage.getItem('mywallet_budget') || '0'));
  const [wallets, setWallets] = useState(() => JSON.parse(localStorage.getItem('mywallet_wallets') || '[]'));
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('mywallet_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [syncing, setSyncing] = useState(false);

  // Computed Values
  const netCashFlow = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + parseFloat(curr.amount || 0) : acc - parseFloat(curr.amount || 0), 0);
  const totalWalletBalance = wallets.reduce((acc, w) => acc + (parseFloat(w.balance) || 0), 0);
  const displayBalance = wallets.length > 0 ? totalWalletBalance : netCashFlow;

  const totalExpense = transactions
    .filter(t => t.type === 'expense' && t.category !== 'transfer')
    .reduce((a, b) => a + parseFloat(b.amount || 0), 0);
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.category !== 'transfer')
    .reduce((a, b) => a + parseFloat(b.amount || 0), 0);

  // Load Data from Cloud (manual trigger)
  const loadCloudData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    setSyncing(true);
    try {
      const [txRes, catRes, wishRes, budgetRes, walletRes] = await Promise.all([
        fetchTransactions(user.id),
        fetchCategories(user.id),
        fetchWishlist(user.id),
        fetchBudget(user.id),
        fetchWallets(user.id)
      ]);

      if (txRes.error) console.error("Transaction Fetch Error:", txRes.error);
      if (walletRes.error) console.error("Wallet Fetch Error:", walletRes.error);

      if (txRes.data) {
        setTransactions(txRes.data);
      }
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (wishRes.data) setWishlist(wishRes.data);
      if (budgetRes.budget) setMonthlyBudget(budgetRes.budget);
      if (walletRes.data) setWallets(walletRes.data);
    } catch (err) {
      console.error('CRITICAL LOAD ERROR:', err);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // Initial Load when logged in with Supabase
  useEffect(() => {
    let active = true;
    if (user && isSupabaseConfigured) {
      setSyncing(true);
      Promise.all([
        fetchTransactions(user.id),
        fetchCategories(user.id),
        fetchWishlist(user.id),
        fetchBudget(user.id),
        fetchWallets(user.id)
      ])
        .then(([txRes, catRes, wishRes, budgetRes, walletRes]) => {
          if (!active) return;
          if (txRes?.data) setTransactions(txRes.data);
          if (catRes?.data && catRes.data.length > 0) setCategories(catRes.data);
          if (wishRes?.data) setWishlist(wishRes.data);
          if (budgetRes?.budget) setMonthlyBudget(budgetRes.budget);
          if (walletRes?.data) setWallets(walletRes.data);
        })
        .catch(err => {
          console.error('CRITICAL LOAD ERROR:', err);
        })
        .finally(() => {
          if (active) setSyncing(false);
        });
    }
    return () => {
      active = false;
    };
  }, [user]);

  // Local Persistence
  useEffect(() => localStorage.setItem('mywallet_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('mywallet_wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => localStorage.setItem('mywallet_budget', monthlyBudget.toString()), [monthlyBudget]);
  useEffect(() => localStorage.setItem('mywallet_categories', JSON.stringify(categories)), [categories]);
  useEffect(() => localStorage.setItem('mywallet_wallets', JSON.stringify(wallets)), [wallets]);

  // Actions (Atomic CRUD)
  const addTransaction = (tx) => {
    const tempId = Date.now();
    const timestamp = new Date().toISOString();
    const amount = parseFloat(tx.amount || 0);
    const newTx = { ...tx, amount, id: tempId, timestamp };

    // 1. Calculate Balance BEFORE state updates
    let updatedBalance = null;
    if (tx.walletId) {
      const wallet = wallets.find(w => w.id.toString() === tx.walletId.toString());
      if (wallet) {
        const applyAmount = tx.type === 'income' ? amount : -amount;
        updatedBalance = parseFloat(wallet.balance || 0) + applyAmount;
      }
    }

    // 2. Optimistic Updates
    setTransactions(prev => [newTx, ...prev]);
    if (tx.walletId && updatedBalance !== null) {
      setWallets(prev => prev.map(w => 
        w.id.toString() === tx.walletId.toString() ? { ...w, balance: updatedBalance } : w
      ));
    }

    // 3. API Calls
    if (user && isSupabaseConfigured) {
      createTransaction(user.id, newTx).then(({ data, error }) => {
        if (error) console.error("❌ CREATE TRANSACTION ERROR:", error);
        if (data) {
          setTransactions(prev => prev.map(t => t.id.toString() === tempId.toString() ? { ...t, id: data.id } : t));
        }
      });

      if (tx.walletId && updatedBalance !== null) {
        apiUpdateWallet(tx.walletId, { balance: updatedBalance }).then(({ error }) => {
          if (error) console.error("❌ WALLET UPDATE ERROR:", error);
        });
      }
    }
  };

  const updateTransaction = async (id, updatedFields) => {
    const oldTx = transactions.find(t => t.id.toString() === id.toString());
    if (!oldTx) return;

    // If it's a transfer, route to updateTransfer for atomic 2-way wallet synchronization
    if (oldTx.category === 'transfer') {
      const twin = findTransferTwin(oldTx, transactions);
      if (twin) {
        const fromWalletId = oldTx.type === 'expense' ? (updatedFields.walletId || oldTx.walletId) : twin.walletId;
        const toWalletId = oldTx.type === 'income' ? (updatedFields.walletId || oldTx.walletId) : twin.walletId;
        const amount = updatedFields.amount !== undefined ? parseFloat(updatedFields.amount) : oldTx.amount;
        const notes = updatedFields.title || '';
        return updateTransfer(id, { fromWalletId, toWalletId, amount, notes });
      }
    }

    let nextWallets = [...wallets];
    const affectedWalletIds = new Set();

    // Helper to revert a transaction's effect on its wallet
    const revertTxEffect = (tx, currentWallets) => {
      if (!tx.walletId) return currentWallets;
      return currentWallets.map(w => {
        if (w.id.toString() === tx.walletId.toString()) {
          const amount = parseFloat(tx.amount || 0);
          const revertAmount = tx.type === 'income' ? -amount : amount;
          affectedWalletIds.add(w.id.toString());
          return { ...w, balance: parseFloat(w.balance || 0) + revertAmount };
        }
        return w;
      });
    };

    // Helper to apply a transaction's effect to a wallet
    const applyTxEffect = (tx, currentWallets) => {
      if (!tx.walletId) return currentWallets;
      return currentWallets.map(w => {
        if (w.id.toString() === tx.walletId.toString()) {
          const amount = parseFloat(tx.amount || 0);
          const applyAmount = tx.type === 'income' ? amount : -amount;
          affectedWalletIds.add(w.id.toString());
          return { ...w, balance: parseFloat(w.balance || 0) + applyAmount };
        }
        return w;
      });
    };

    // 1. REVERT OLD EFFECT
    nextWallets = revertTxEffect(oldTx, nextWallets);

    // 2. PREPARE UPDATED TRANSACTION
    const newAmount = updatedFields.amount !== undefined ? parseFloat(updatedFields.amount) : oldTx.amount;
    const updatedMainTx = { ...oldTx, ...updatedFields, amount: newAmount };

    // 3. APPLY NEW EFFECT
    nextWallets = applyTxEffect(updatedMainTx, nextWallets);

    // 4. UPDATE STATE
    setWallets(nextWallets);
    setTransactions(prev => prev.map(t => {
      if (t.id.toString() === id.toString()) return updatedMainTx;
      return t;
    }));

    // 5. SYNC TO API
    if (user && isSupabaseConfigured) {
      apiUpdateTransaction(id, { ...updatedFields, amount: newAmount });
      
      affectedWalletIds.forEach(wid => {
        const w = nextWallets.find(wallet => wallet.id.toString() === wid);
        if (w) apiUpdateWallet(w.id, { balance: w.balance });
      });
    }
  };

  const deleteTransaction = (id) => {
    const txToDelete = transactions.find(t => t.id.toString() === id.toString());
    if (!txToDelete) return;

    // Find twin if it's a transfer using robust helper
    const twin = findTransferTwin(txToDelete, transactions);

    const idsToDelete = [id.toString()];
    if (twin) idsToDelete.push(twin.id.toString());

    // 1. Revert Wallet Balance(s)
    let nextWallets = [...wallets];
    const affectedWalletIds = new Set();
    
    const revertAmount = (tx) => {
      if (tx.walletId) {
        nextWallets = nextWallets.map(w => {
          if (w.id.toString() === tx.walletId.toString()) {
            const amount = parseFloat(tx.amount || 0);
            const revertVal = tx.type === 'income' ? -amount : amount;
            affectedWalletIds.add(w.id.toString());
            return { ...w, balance: parseFloat(w.balance || 0) + revertVal };
          }
          return w;
        });
      }
    };

    revertAmount(txToDelete);
    if (twin) revertAmount(twin);

    // 2. Remove Transactions from state
    setWallets(nextWallets);
    setTransactions(prev => prev.filter(t => !idsToDelete.includes(t.id.toString())));

    // 3. API Calls
    if (user && isSupabaseConfigured) {
      idsToDelete.forEach(targetId => apiDeleteTransaction(targetId));
      affectedWalletIds.forEach(wid => {
        const w = nextWallets.find(wallet => wallet.id.toString() === wid);
        if (w) apiUpdateWallet(w.id, { balance: w.balance });
      });
    }
  };

  const addWallet = (wallet) => {
    const tempId = Date.now();
    const newWallet = { ...wallet, id: tempId, balance: parseFloat(wallet.balance || 0) };
    setWallets(prev => [...prev, newWallet]);

    if (user && isSupabaseConfigured) {
      createWallet(user.id, newWallet).then(({ data }) => {
        if (data) {
          setWallets(prev => prev.map(w => w.id.toString() === tempId.toString() ? { ...w, id: data.id } : w));
        }
      });
    }
  };

  const updateWallet = (id, updatedFields) => {
    if (updatedFields.balance !== undefined) updatedFields.balance = parseFloat(updatedFields.balance);
    setWallets(prev => prev.map(w => w.id.toString() === id.toString() ? { ...w, ...updatedFields } : w));
    if (user && isSupabaseConfigured) {
      apiUpdateWallet(id, updatedFields);
    }
  };

  const deleteWallet = (id) => {
    setWallets(prev => {
      const filtered = prev.filter(w => w.id.toString() !== id.toString());
      return filtered;
    });
    if (user && isSupabaseConfigured) {
      apiDeleteWallet(id).then(({ error }) => {
        if (error) {
          console.error('Failed to delete wallet from DB:', error);
        }
      });
    }
  };

  const addCategory = (category) => {
    const tempId = category.id || `custom_${Date.now()}`;
    const newCat = { ...category, id: tempId, isDefault: false };
    setCategories(prev => [...prev, newCat]);

    if (user && isSupabaseConfigured) {
      createCategory(user.id, newCat);
    }
  };

  const updateCategory = (id, updatedFields) => {
    setCategories(prev => prev.map(c => c.id.toString() === id.toString() ? { ...c, ...updatedFields } : c));
    if (user && isSupabaseConfigured) {
      apiUpdateCategory(id, { ...updatedFields, userId: user.id });
    }
  };

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id.toString() !== id.toString()));
    if (user && isSupabaseConfigured) {
      apiDeleteCategory(id);
    }
  };

  const addWishlistItem = (item) => {
    const tempId = Date.now();
    const newItem = { ...item, id: tempId, purchased: false };
    setWishlist(prev => [...prev, newItem]);

    if (user && isSupabaseConfigured) {
      createWishlist(user.id, newItem).then(({ data }) => {
        if (data) {
          setWishlist(prev => prev.map(i => i.id.toString() === tempId.toString() ? { ...i, id: data.id } : i));
        }
      });
    }
  };

  const updateWishlistItem = (id, updatedFields) => {
    setWishlist(prev => prev.map(i => i.id.toString() === id.toString() ? { ...i, ...updatedFields } : i));
    if (user && isSupabaseConfigured) {
      apiUpdateWishlist(id, updatedFields);
    }
  };

  const deleteWishlistItem = (id) => {
    setWishlist(prev => prev.filter(i => i.id.toString() !== id.toString()));
    if (user && isSupabaseConfigured) {
      apiDeleteWishlist(id);
    }
  };

  const updateBudget = (amount) => {
    setMonthlyBudget(amount);
    if (user && isSupabaseConfigured) {
      syncBudget(user.id, amount);
    }
  };

  const addTransfer = async (transferData) => {
    const { fromWalletId, toWalletId, amount: rawAmount, notes } = transferData;
    const amount = parseFloat(rawAmount || 0);
    const timestamp = new Date().toISOString();
    const tempId1 = Date.now();
    const tempId2 = Date.now() + 1;
    const transferId = `tr_${tempId1}`;

    const fromWallet = wallets.find(w => w.id.toString() === fromWalletId.toString());
    const toWallet = wallets.find(w => w.id.toString() === toWalletId.toString());

    if (!fromWallet || !toWallet) return;

    // 1. Calculate Balances BEFORE state updates
    const finalFromBalance = parseFloat(fromWallet.balance || 0) - amount;
    const finalToBalance = parseFloat(toWallet.balance || 0) + amount;

    const cleanNotes = notes ? notes.trim() : '';

    // 2. Prepare Transactions
    const txOut = {
      id: tempId1,
      transferId,
      title: `Transfer ke ${toWallet.name}${cleanNotes ? ': ' + cleanNotes : ''}`,
      amount: amount,
      type: 'expense',
      category: 'transfer',
      walletId: fromWalletId,
      timestamp
    };

    const txIn = {
      id: tempId2,
      transferId,
      title: `Transfer dari ${fromWallet.name}${cleanNotes ? ': ' + cleanNotes : ''}`,
      amount: amount,
      type: 'income',
      category: 'transfer',
      walletId: toWalletId,
      timestamp
    };

    // 3. Optimistic Updates
    setTransactions(prev => [txOut, txIn, ...prev]);
    setWallets(prev => prev.map(w => {
      if (w.id.toString() === fromWalletId.toString()) return { ...w, balance: finalFromBalance };
      if (w.id.toString() === toWalletId.toString()) return { ...w, balance: finalToBalance };
      return w;
    }));

    // 4. API Calls
    if (user && isSupabaseConfigured) {
      try {
        const results = await Promise.all([
          createTransaction(user.id, txOut),
          createTransaction(user.id, txIn),
          apiUpdateWallet(fromWalletId, { balance: finalFromBalance }),
          apiUpdateWallet(toWalletId, { balance: finalToBalance })
        ]);

        if (results[0]?.data && results[1]?.data) {
          const realOutId = results[0].data.id;
          const realInId = results[1].data.id;
          setTransactions(prev => prev.map(t => {
            if (t.id.toString() === tempId1.toString()) return { ...t, id: realOutId };
            if (t.id.toString() === tempId2.toString()) return { ...t, id: realInId };
            return t;
          }));
        }
        
        const errors = results.filter(r => r?.error);
        if (errors.length > 0) {
          console.error("❌ TRANSFER SYNC ERRORS:", errors.map(e => e.error));
        }
      } catch (err) {
        console.error("❌ TRANSFER CRITICAL ERROR:", err);
      }
    }
  };

  const updateTransfer = async (txId, { fromWalletId, toWalletId, amount: rawAmount, notes }) => {
    const mainTx = transactions.find(t => t.id.toString() === txId.toString());
    if (!mainTx) return;

    const twinTx = findTransferTwin(mainTx, transactions);
    if (!twinTx) {
      console.warn("Transfer twin not found for txId:", txId);
      return;
    }

    const oldOutTx = mainTx.type === 'expense' ? mainTx : twinTx;
    const oldInTx = mainTx.type === 'income' ? mainTx : twinTx;

    const oldAmount = parseFloat(oldOutTx.amount || 0);
    const newAmount = parseFloat(rawAmount || 0);

    const oldFromWalletId = oldOutTx.walletId?.toString();
    const oldToWalletId = oldInTx.walletId?.toString();
    const newFromWalletId = fromWalletId.toString();
    const newToWalletId = toWalletId.toString();

    let nextWallets = [...wallets];
    const affectedWalletIds = new Set([oldFromWalletId, oldToWalletId, newFromWalletId, newToWalletId]);

    // 1. REVERT OLD BALANCES
    nextWallets = nextWallets.map(w => {
      const wid = w.id.toString();
      let bal = parseFloat(w.balance || 0);
      if (wid === oldFromWalletId) bal += oldAmount;
      if (wid === oldToWalletId) bal -= oldAmount;
      return { ...w, balance: bal };
    });

    // 2. APPLY NEW BALANCES
    nextWallets = nextWallets.map(w => {
      const wid = w.id.toString();
      let bal = parseFloat(w.balance || 0);
      if (wid === newFromWalletId) bal -= newAmount;
      if (wid === newToWalletId) bal += newAmount;
      return { ...w, balance: bal };
    });

    const newFromWallet = nextWallets.find(w => w.id.toString() === newFromWalletId);
    const newToWallet = nextWallets.find(w => w.id.toString() === newToWalletId);

    const cleanNotes = notes ? notes.trim() : '';

    // 3. PREPARE UPDATED TRANSACTIONS
    const updatedOutTx = {
      ...oldOutTx,
      title: `Transfer ke ${newToWallet?.name || 'Dompet'}${cleanNotes ? ': ' + cleanNotes : ''}`,
      amount: newAmount,
      walletId: newFromWalletId
    };

    const updatedInTx = {
      ...oldInTx,
      title: `Transfer dari ${newFromWallet?.name || 'Dompet'}${cleanNotes ? ': ' + cleanNotes : ''}`,
      amount: newAmount,
      walletId: newToWalletId
    };

    // 4. UPDATE STATE
    setWallets(nextWallets);
    setTransactions(prev => prev.map(t => {
      if (t.id.toString() === updatedOutTx.id.toString()) return updatedOutTx;
      if (t.id.toString() === updatedInTx.id.toString()) return updatedInTx;
      return t;
    }));

    // 5. SYNC TO SUPABASE
    if (user && isSupabaseConfigured) {
      try {
        await Promise.all([
          apiUpdateTransaction(updatedOutTx.id, {
            title: updatedOutTx.title,
            amount: newAmount,
            wallet_id: newFromWalletId
          }),
          apiUpdateTransaction(updatedInTx.id, {
            title: updatedInTx.title,
            amount: newAmount,
            wallet_id: newToWalletId
          }),
          ...Array.from(affectedWalletIds).map(wid => {
            const w = nextWallets.find(wallet => wallet.id.toString() === wid);
            return w ? apiUpdateWallet(w.id, { balance: w.balance }) : Promise.resolve();
          })
        ]);
      } catch (err) {
        console.error("❌ UPDATE TRANSFER SYNC ERROR:", err);
      }
    }
  };

  const value = {
    transactions,
    wallets,
    categories,
    wishlist,
    monthlyBudget,
    syncing,
    displayBalance,
    totalExpense,
    totalIncome,
    syncToCloud: loadCloudData,
    
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addWallet,
    updateWallet,
    deleteWallet,
    addCategory,
    updateCategory,
    deleteCategory,
    addWishlistItem,
    updateWishlistItem,
    deleteWishlistItem,
    updateBudget,
    addTransfer,
    updateTransfer,
    findTransferTwin
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}