import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- AUTH ---
export const signUp = async (email, password, options = {}) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options });
    return { data, error };
};

export const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const resendConfirmation = async (email, options = {}) => {
    const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options
    });
    return { data, error };
};

export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange(callback);
};

export const updateProfile = async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
        data: updates
    });
    return { data, error };
};

// --- TRANSACTIONS ---
export const fetchTransactions = async (userId) => {
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
};

export const createTransaction = async (userId, transaction) => {
    const { data, error } = await supabase.from('transactions').insert([{
        user_id: userId,
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        wallet_id: transaction.walletId || null,
        created_at: transaction.timestamp
    }]).select().single();
    
    // Return mapped format
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
};

export const updateTransaction = async (id, updates) => {
    const dbUpdates = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.walletId !== undefined) dbUpdates.wallet_id = updates.walletId;
    if (updates.timestamp !== undefined) dbUpdates.created_at = updates.timestamp;

    const { data, error } = await supabase.from('transactions').update(dbUpdates).eq('id', id).select().single();
    return { data, error };
};

export const deleteTransaction = async (id) => {
    return await supabase.from('transactions').delete().eq('id', id);
};


// --- WALLETS ---
export const fetchWallets = async (userId) => {
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
};

export const createWallet = async (userId, wallet) => {
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
};

export const updateWallet = async (id, updates) => {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.color !== undefined) dbUpdates.color = updates.color;

    const { data, error } = await supabase.from('wallets').update(dbUpdates).eq('id', id).select().single();
    return { data, error };
};

export const deleteWallet = async (id) => {
    return await supabase.from('wallets').delete().eq('id', id);
};


// --- CATEGORIES ---
export const fetchCategories = async (userId) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

    if (data) {
        return {
            data: data.map(c => ({
                id: c.cat_id, // Use cat_id as the primary identifier for frontend
                name: c.name,
                icon: c.icon,
                bg: c.bg,
                type: c.type,
                budgetLimit: parseFloat(c.budget_limit || 0), // Add budget limit
                isDefault: c.is_default
            })),
            error
        };
    }
    return { data: null, error };
};

export const createCategory = async (userId, category) => {
    const { data, error } = await supabase.from('categories').insert([{
        user_id: userId,
        cat_id: category.id, // We must preserve the string ID (e.g. 'custom_123')
        name: category.name,
        icon: category.icon,
        bg: category.bg,
        type: category.type,
        budget_limit: category.budgetLimit || 0, // Add budget limit
        is_default: category.isDefault || false
    }]).select().single();
    return { data, error };
};

export const updateCategory = async (catId, updates) => {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.bg !== undefined) dbUpdates.bg = updates.bg;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.budgetLimit !== undefined) dbUpdates.budget_limit = updates.budgetLimit; // Add budget limit

    // Use cat_id for filtering
    const { data, error } = await supabase.from('categories').update(dbUpdates).eq('cat_id', catId).eq('user_id', updates.userId).select().single();
    return { data, error };
};

export const deleteCategory = async (catId) => {
    // Delete by cat_id
    return await supabase.from('categories').delete().eq('cat_id', catId);
};


// --- WISHLIST ---
export const fetchWishlist = async (userId) => {
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
};

export const createWishlist = async (userId, item) => {
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
};

export const updateWishlist = async (id, updates) => {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.purchased !== undefined) dbUpdates.purchased = updates.purchased;

    const { data, error } = await supabase.from('wishlist').update(dbUpdates).eq('id', id).select().single();
    return { data, error };
};

export const deleteWishlist = async (id) => {
    return await supabase.from('wishlist').delete().eq('id', id);
};


// --- BUDGET ---
export const fetchBudget = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('monthly_budget').eq('id', userId).single();
    return { budget: data?.monthly_budget || 0, error };
};

export const syncBudget = async (userId, budget) => {
    return supabase.from('profiles').upsert(
        { id: userId, monthly_budget: budget },
        { onConflict: 'id' }
    );
};