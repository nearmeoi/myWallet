import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if valid Supabase configuration is provided
export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  typeof rawUrl === 'string' &&
  rawUrl.trim().startsWith('http') &&
  !rawUrl.includes('your-project') &&
  typeof rawKey === 'string' &&
  rawKey.trim().length > 10 &&
  !rawKey.includes('your-anon-key')
);

// Fallback dummy client for local/offline mode
const createDummyClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signUp: async () => ({
      data: null,
      error: new Error('Supabase belum dikonfigurasi. Tambahkan kredensial di file .env untuk mengaktifkan akun cloud.')
    }),
    signInWithPassword: async () => ({
      data: null,
      error: new Error('Supabase belum dikonfigurasi. Tambahkan kredensial di file .env untuk mengaktifkan akun cloud.')
    }),
    signOut: async () => ({ error: null }),
    resend: async () => ({
      data: null,
      error: new Error('Supabase belum dikonfigurasi.')
    }),
    onAuthStateChange: (callback) => {
      // Defer to next event loop tick so components can mount
      const timer = setTimeout(() => {
        try {
          callback('INITIAL_SESSION', null);
        } catch (e) {
          console.warn('onAuthStateChange callback error:', e);
        }
      }, 0);
      return {
        data: {
          subscription: {
            unsubscribe: () => clearTimeout(timer)
          }
        }
      };
    },
    updateUser: async () => ({
      data: null,
      error: new Error('Supabase belum dikonfigurasi.')
    })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
        select: () => Promise.resolve({ data: [], error: null }),
        limit: () => Promise.resolve({ data: [], error: null })
      }),
      order: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null })
    }),
    insert: () => ({
      select: () => ({
        single: () => Promise.resolve({ data: null, error: null })
      })
    }),
    update: () => ({
      eq: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        }),
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      })
    }),
    delete: () => ({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
        then: (resolve) => Promise.resolve({ error: null }).then(resolve)
      })
    }),
    upsert: () => Promise.resolve({ error: null })
  })
});

let clientInstance = null;
if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(rawUrl.trim(), rawKey.trim());
  } catch (err) {
    console.warn('Gagal menginisialisasi Supabase client, beralih ke fallback mode:', err);
    clientInstance = createDummyClient();
  }
} else {
  clientInstance = createDummyClient();
}

export const supabase = clientInstance;

// --- AUTH ---
export const signUp = async (email, password, options = {}) => {
  try {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase belum dikonfigurasi. Tambahkan kredensial di file .env untuk mengaktifkan akun cloud.')
      };
    }
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const signIn = async (email, password) => {
  try {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase belum dikonfigurasi. Tambahkan kredensial di file .env untuk mengaktifkan akun cloud.')
      };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    return { error: err };
  }
};

export const resendConfirmation = async (email, options = {}) => {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
    }
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options
    });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

export const updateProfile = async (updates) => {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
    }
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

// --- TRANSACTIONS ---
export const fetchTransactions = async (userId) => {
  try {
    if (!isSupabaseConfigured) return { data: [], error: null };
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Supabase Fetch Error:", error);
    }

    if (data) {
      return {
        data: data.map(t => ({
          id: t.id,
          title: t.title,
          amount: parseFloat(t.amount),
          type: t.type,
          category: t.category,
          walletId: t.wallet_id,
          timestamp: t.created_at
        })),
        error
      };
    }
    return { data: [], error };
  } catch (err) {
    console.error("❌ fetchTransactions error:", err);
    return { data: [], error: err };
  }
};

export const createTransaction = async (userId, transaction) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const { data, error } = await supabase.from('transactions').insert([{
      user_id: userId,
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      wallet_id: transaction.walletId || null,
      created_at: transaction.timestamp
    }]).select().single();
    
    if (data) {
      return {
        data: {
          id: data.id,
          title: data.title,
          amount: parseFloat(data.amount),
          type: data.type,
          category: data.category,
          walletId: data.wallet_id,
          timestamp: data.created_at
        },
        error
      };
    }
    return { data: null, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const updateTransaction = async (id, updates) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.walletId !== undefined) dbUpdates.wallet_id = updates.walletId;
    if (updates.timestamp !== undefined) dbUpdates.created_at = updates.timestamp;

    const { data, error } = await supabase.from('transactions').update(dbUpdates).eq('id', id).select().single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const deleteTransaction = async (id) => {
  try {
    if (!isSupabaseConfigured) return { error: null };
    return await supabase.from('transactions').delete().eq('id', id);
  } catch (err) {
    return { error: err };
  }
};

// --- WALLETS ---
export const fetchWallets = async (userId) => {
  try {
    if (!isSupabaseConfigured) return { data: [], error: null };
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    if (data) {
      return {
        data: data.map(w => ({
          id: w.id,
          name: w.name,
          type: w.type,
          balance: parseFloat(w.balance),
          color: w.color
        })),
        error
      };
    }
    return { data: [], error };
  } catch (err) {
    return { data: [], error: err };
  }
};

export const createWallet = async (userId, wallet) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const { data, error } = await supabase.from('wallets').insert([{
      user_id: userId,
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      color: wallet.color
    }]).select().single();

    if (data) {
      return {
        data: {
          id: data.id,
          name: data.name,
          type: data.type,
          balance: parseFloat(data.balance),
          color: data.color
        },
        error
      };
    }
    return { data: null, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const updateWallet = async (id, updates) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.color !== undefined) dbUpdates.color = updates.color;

    const { data, error } = await supabase.from('wallets').update(dbUpdates).eq('id', id).select().single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const deleteWallet = async (id) => {
  try {
    if (!isSupabaseConfigured) return { error: null };
    return await supabase.from('wallets').delete().eq('id', id);
  } catch (err) {
    return { error: err };
  }
};

// --- CATEGORIES ---
export const fetchCategories = async (userId) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (data) {
      return {
        data: data.map(c => ({
          id: c.cat_id,
          name: c.name,
          icon: c.icon,
          bg: c.bg,
          type: c.type,
          budgetLimit: parseFloat(c.budget_limit || 0),
          isDefault: c.is_default
        })),
        error
      };
    }
    return { data: null, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const createCategory = async (userId, category) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const { data, error } = await supabase.from('categories').insert([{
      user_id: userId,
      cat_id: category.id,
      name: category.name,
      icon: category.icon,
      bg: category.bg,
      type: category.type,
      budget_limit: category.budgetLimit || 0,
      is_default: category.isDefault || false
    }]).select().single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const updateCategory = async (catId, updates) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.bg !== undefined) dbUpdates.bg = updates.bg;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.budgetLimit !== undefined) dbUpdates.budget_limit = updates.budgetLimit;

    const { data, error } = await supabase
      .from('categories')
      .update(dbUpdates)
      .eq('cat_id', catId)
      .eq('user_id', updates.userId)
      .select()
      .single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const deleteCategory = async (catId) => {
  try {
    if (!isSupabaseConfigured) return { error: null };
    return await supabase.from('categories').delete().eq('cat_id', catId);
  } catch (err) {
    return { error: err };
  }
};

// --- WISHLIST ---
export const fetchWishlist = async (userId) => {
  try {
    if (!isSupabaseConfigured) return { data: [], error: null };
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId);

    if (data) {
      return {
        data: data.map(w => ({
          id: w.id,
          name: w.name,
          price: parseFloat(w.price),
          purchased: w.purchased
        })),
        error
      };
    }
    return { data: [], error };
  } catch (err) {
    return { data: [], error: err };
  }
};

export const createWishlist = async (userId, item) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const { data, error } = await supabase.from('wishlist').insert([{
      user_id: userId,
      name: item.name,
      price: item.price,
      purchased: item.purchased || false
    }]).select().single();

    if (data) {
      return {
        data: {
          id: data.id,
          name: data.name,
          price: parseFloat(data.price),
          purchased: data.purchased
        },
        error
      };
    }
    return { data: null, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const updateWishlist = async (id, updates) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.purchased !== undefined) dbUpdates.purchased = updates.purchased;

    const { data, error } = await supabase.from('wishlist').update(dbUpdates).eq('id', id).select().single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const deleteWishlist = async (id) => {
  try {
    if (!isSupabaseConfigured) return { error: null };
    return await supabase.from('wishlist').delete().eq('id', id);
  } catch (err) {
    return { error: err };
  }
};

// --- BUDGET ---
export const fetchBudget = async (userId) => {
  try {
    if (!isSupabaseConfigured) return { budget: 0, error: null };
    const { data, error } = await supabase.from('profiles').select('monthly_budget').eq('id', userId).single();
    return { budget: data?.monthly_budget || 0, error };
  } catch (err) {
    return { budget: 0, error: err };
  }
};

export const syncBudget = async (userId, budget) => {
  try {
    if (!isSupabaseConfigured) return { error: null };
    return await supabase.from('profiles').upsert(
      { id: userId, monthly_budget: budget },
      { onConflict: 'id' }
    );
  } catch (err) {
    return { error: err };
  }
};

// --- DEBTS ---
export const fetchDebts = async (userId) => {
  try {
    if (!isSupabaseConfigured) return { data: [], error: null };
    const { data, error } = await supabase
      .from('debts')
      .select('*, debt_payments(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      return {
        data: data.map(d => ({
          id: d.id,
          type: d.type,
          personName: d.person_name,
          totalAmount: parseFloat(d.total_amount),
          paidAmount: parseFloat(d.paid_amount || 0),
          dueDate: d.due_date,
          notes: d.notes,
          status: d.status,
          createdAt: d.created_at,
          payments: (d.debt_payments || []).map(p => ({
            id: p.id,
            amount: parseFloat(p.amount),
            notes: p.notes,
            createdAt: p.created_at
          }))
        })),
        error
      };
    }
    return { data: [], error };
  } catch (err) {
    return { data: [], error: err };
  }
};

export const createDebt = async (userId, debt) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const { data, error } = await supabase.from('debts').insert([{
      user_id: userId,
      type: debt.type,
      person_name: debt.personName,
      total_amount: debt.totalAmount,
      paid_amount: 0,
      due_date: debt.dueDate || null,
      notes: debt.notes || '',
      status: 'ongoing'
    }]).select().single();

    if (data) {
      return {
        data: { id: data.id, type: data.type, personName: data.person_name, totalAmount: parseFloat(data.total_amount), paidAmount: 0, status: data.status },
        error
      };
    }
    return { data: null, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const updateDebt = async (id, updates) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const dbUpdates = {};
    if (updates.personName !== undefined) dbUpdates.person_name = updates.personName;
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;

    const { data, error } = await supabase.from('debts').update(dbUpdates).eq('id', id).select().single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const deleteDebt = async (id) => {
  try {
    if (!isSupabaseConfigured) return { error: null };
    return await supabase.from('debts').delete().eq('id', id);
  } catch (err) {
    return { error: err };
  }
};

export const createDebtPayment = async (debtId, payment) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };

    // 1. Insert payment record
    const { data: payData, error: payError } = await supabase.from('debt_payments').insert([{
      debt_id: debtId,
      amount: payment.amount,
      notes: payment.notes || ''
    }]).select().single();

    if (payError) return { data: null, error: payError };

    // 2. Fetch current debt to recalculate
    const { data: debt } = await supabase.from('debts').select('paid_amount, total_amount').eq('id', debtId).single();
    if (debt) {
      const newPaid = parseFloat(debt.paid_amount || 0) + payment.amount;
      const status = newPaid >= parseFloat(debt.total_amount) ? 'paid' : 'partial';
      await supabase.from('debts').update({ paid_amount: newPaid, status }).eq('id', debtId);
    }

    return { data: payData, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
};

// --- SAVINGS ---
export const fetchSavings = async (userId) => {
  try {
    if (!isSupabaseConfigured) return { data: [], error: null };
    const { data, error } = await supabase
      .from('savings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      return {
        data: data.map(s => ({
          id: s.id,
          name: s.name,
          targetAmount: parseFloat(s.target_amount),
          currentAmount: parseFloat(s.current_amount || 0),
          icon: s.icon || 'Target',
          color: s.color || '#D4F7E6',
          deadline: s.deadline,
          isCompleted: s.is_completed,
          createdAt: s.created_at
        })),
        error
      };
    }
    return { data: [], error };
  } catch (err) {
    return { data: [], error: err };
  }
};

export const createSaving = async (userId, saving) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const { data, error } = await supabase.from('savings').insert([{
      user_id: userId,
      name: saving.name,
      target_amount: saving.targetAmount,
      current_amount: 0,
      icon: saving.icon || 'Target',
      color: saving.color || '#D4F7E6',
      deadline: saving.deadline || null,
      is_completed: false
    }]).select().single();

    if (data) {
      return {
        data: {
          id: data.id, name: data.name,
          targetAmount: parseFloat(data.target_amount),
          currentAmount: 0, icon: data.icon, color: data.color,
          deadline: data.deadline, isCompleted: data.is_completed
        },
        error
      };
    }
    return { data: null, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const updateSaving = async (id, updates) => {
  try {
    if (!isSupabaseConfigured) return { data: null, error: null };
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
    if (updates.target_amount !== undefined) dbUpdates.target_amount = updates.target_amount;
    if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
    if (updates.current_amount !== undefined) dbUpdates.current_amount = updates.current_amount;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
    if (updates.is_completed !== undefined) dbUpdates.is_completed = updates.is_completed;

    const { data, error } = await supabase.from('savings').update(dbUpdates).eq('id', id).select().single();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
};

export const deleteSaving = async (id) => {
  try {
    if (!isSupabaseConfigured) return { error: null };
    return await supabase.from('savings').delete().eq('id', id);
  } catch (err) {
    return { error: err };
  }
};