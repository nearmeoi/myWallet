import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchDebts, createDebt as apiCreateDebt, updateDebt as apiUpdateDebt, deleteDebt as apiDeleteDebt,
  createDebtPayment as apiCreateDebtPayment,
  isSupabaseConfigured
} from '../lib/supabase';

const DebtContext = createContext();

export function useDebt() {
  return useContext(DebtContext);
}

export function DebtProvider({ children }) {
  const { user } = useAuth();

  const [debts, setDebts] = useState(() =>
    JSON.parse(localStorage.getItem('mywallet_debts') || '[]')
  );
  const [syncing, setSyncing] = useState(false);

  // Persist to localStorage
  useEffect(() => localStorage.setItem('mywallet_debts', JSON.stringify(debts)), [debts]);

  const resetData = useCallback(() => {
    setDebts([]);
    localStorage.removeItem('mywallet_debts');
  }, []);

  const prevUserRef = React.useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      resetData();
    }
    prevUserRef.current = user;
  }, [user, resetData]);

  const loadDebts = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    setSyncing(true);
    try {
      const { data } = await fetchDebts(user.id);
      if (data) setDebts(data);
    } catch (err) {
      console.error('DebtContext load error:', err);
    } finally {
      setSyncing(false);
    }
  }, [user]);

  // Load from cloud on login
  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const addDebt = async (debt) => {
    const tempId = Date.now();
    const newDebt = {
      ...debt,
      id: tempId,
      paidAmount: 0,
      status: 'ongoing',
      createdAt: new Date().toISOString(),
      payments: []
    };
    setDebts(prev => [newDebt, ...prev]);

    if (user && isSupabaseConfigured) {
      const { data } = await apiCreateDebt(user.id, newDebt);
      if (data) {
        setDebts(prev => prev.map(d => d.id.toString() === tempId.toString() ? { ...d, id: data.id } : d));
      }
    }
  };

  const updateDebt = (id, updates) => {
    setDebts(prev => prev.map(d => d.id.toString() === id.toString() ? { ...d, ...updates } : d));
    if (user && isSupabaseConfigured) {
      apiUpdateDebt(id, updates);
    }
  };

  const deleteDebt = (id) => {
    setDebts(prev => prev.filter(d => d.id.toString() !== id.toString()));
    if (user && isSupabaseConfigured) {
      apiDeleteDebt(id);
    }
  };

  const addPayment = async (debtId, payment) => {
    const tempPayId = Date.now();
    const newPayment = { ...payment, id: tempPayId, createdAt: new Date().toISOString() };

    setDebts(prev => prev.map(d => {
      if (d.id.toString() !== debtId.toString()) return d;
      const newPaid = (d.paidAmount || 0) + payment.amount;
      const status = newPaid >= d.totalAmount ? 'paid' : 'partial';
      return {
        ...d,
        paidAmount: newPaid,
        status,
        payments: [...(d.payments || []), newPayment]
      };
    }));

    if (user && isSupabaseConfigured) {
      apiCreateDebtPayment(debtId, newPayment);
    }
  };

  // Computed
  const totalOwed = debts.filter(d => d.type === 'owe' && d.status !== 'paid').reduce((a, d) => a + (d.totalAmount - d.paidAmount), 0);
  const totalLent = debts.filter(d => d.type === 'lend' && d.status !== 'paid').reduce((a, d) => a + (d.totalAmount - d.paidAmount), 0);

  const value = {
    debts,
    syncing,
    totalOwed,
    totalLent,
    addDebt,
    updateDebt,
    deleteDebt,
    addPayment,
    refreshDebts: loadDebts,
    resetDebtData: resetData
  };

  return (
    <DebtContext.Provider value={value}>
      {children}
    </DebtContext.Provider>
  );
}
