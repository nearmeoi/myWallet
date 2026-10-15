import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchSavings, createSaving as apiCreateSaving, updateSaving as apiUpdateSaving, deleteSaving as apiDeleteSaving,
  isSupabaseConfigured
} from '../lib/supabase';

const SavingsContext = createContext();

export function useSavings() {
  return useContext(SavingsContext);
}

export function SavingsProvider({ children }) {
  const { user } = useAuth();

  const [savings, setSavings] = useState(() =>
    JSON.parse(localStorage.getItem('mywallet_savings') || '[]')
  );

  // Persist to localStorage
  useEffect(() => localStorage.setItem('mywallet_savings', JSON.stringify(savings)), [savings]);

  const resetData = useCallback(() => {
    setSavings([]);
    localStorage.removeItem('mywallet_savings');
  }, []);

  const prevUserRef = React.useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      resetData();
    }
    prevUserRef.current = user;
  }, [user, resetData]);

  const loadSavings = useCallback(async () => {
    if (!user || !isSupabaseConfigured) return;
    try {
      const { data } = await fetchSavings(user.id);
      if (data) setSavings(data);
    } catch (err) {
      console.error('SavingsContext load error:', err);
    }
  }, [user]);

  // Load from cloud on login
  useEffect(() => {
    loadSavings();
  }, [loadSavings]);

  // Add a new savings goal
  const addSaving = async (saving) => {
    const tempId = Date.now();
    const newSaving = {
      ...saving,
      id: tempId,
      currentAmount: 0,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    setSavings(prev => [newSaving, ...prev]);

    if (user && isSupabaseConfigured) {
      const { data } = await apiCreateSaving(user.id, newSaving);
      if (data) {
        setSavings(prev => prev.map(s => s.id.toString() === tempId.toString() ? { ...s, id: data.id } : s));
      }
    }
  };

  // Top-up: add money to savings goal (wallet deduction handled in WalletContext via callback)
  const topUpSaving = (id, amount) => {
    setSavings(prev => prev.map(s => {
      if (s.id.toString() !== id.toString()) return s;
      const newAmount = (s.currentAmount || 0) + amount;
      const isCompleted = newAmount >= s.targetAmount;
      return { ...s, currentAmount: newAmount, isCompleted };
    }));

    if (user && isSupabaseConfigured) {
      const saving = savings.find(s => s.id.toString() === id.toString());
      if (saving) {
        const newAmount = (saving.currentAmount || 0) + amount;
        apiUpdateSaving(id, { current_amount: newAmount, is_completed: newAmount >= saving.targetAmount });
      }
    }
  };

  // Withdraw: pull money back from savings
  const withdrawSaving = (id, amount) => {
    setSavings(prev => prev.map(s => {
      if (s.id.toString() !== id.toString()) return s;
      const newAmount = Math.max(0, (s.currentAmount || 0) - amount);
      return { ...s, currentAmount: newAmount, isCompleted: false };
    }));

    if (user && isSupabaseConfigured) {
      const saving = savings.find(s => s.id.toString() === id.toString());
      if (saving) {
        const newAmount = Math.max(0, (saving.currentAmount || 0) - amount);
        apiUpdateSaving(id, { current_amount: newAmount, is_completed: false });
      }
    }
  };

  const updateSaving = (id, updates) => {
    setSavings(prev => prev.map(s => s.id.toString() === id.toString() ? { ...s, ...updates } : s));
    if (user && isSupabaseConfigured) {
      apiUpdateSaving(id, updates);
    }
  };

  const deleteSaving = (id) => {
    setSavings(prev => prev.filter(s => s.id.toString() !== id.toString()));
    if (user && isSupabaseConfigured) {
      apiDeleteSaving(id);
    }
  };

  const totalSaved = savings.reduce((a, s) => a + (s.currentAmount || 0), 0);

  const value = {
    savings,
    totalSaved,
    addSaving,
    topUpSaving,
    withdrawSaving,
    updateSaving,
    deleteSaving,
    refreshSavings: loadSavings,
    resetSavingsData: resetData
  };

  return (
    <SavingsContext.Provider value={value}>
      {children}
    </SavingsContext.Provider>
  );
}
