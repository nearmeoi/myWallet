import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dgvjiiaunqaonvpwytej.supabase.co';
const supabaseAnonKey = 'sb_publishable_Y9E9LyR2cYzLJPtAgD4Qhg_L74fnUHX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
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

export const getUser = () => supabase.auth.getUser();

export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange(callback);
};

// Data sync helpers
export const syncTransactions = async (userId, transactions) => {
    // Delete existing and insert new (simple sync strategy)
    await supabase.from('transactions').delete().eq('user_id', userId);
    if (transactions.length > 0) {
        const toInsert = transactions.map(t => ({
            user_id: userId,
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            created_at: t.timestamp
        }));
        return supabase.from('transactions').insert(toInsert);
    }
    return { error: null };
};

export const fetchTransactions = async (userId) => {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (data) {
        return {
            data: data.map(t => ({
                id: t.id,
                title: t.title,
                amount: parseFloat(t.amount),
                type: t.type,
                category: t.category,
                timestamp: t.created_at
            })),
            error
        };
    }
    return { data: [], error };
};

export const syncCategories = async (userId, categories) => {
    await supabase.from('categories').delete().eq('user_id', userId);
    if (categories.length > 0) {
        const toInsert = categories.map(c => ({
            user_id: userId,
            cat_id: c.id,
            name: c.name,
            icon: c.icon,
            bg: c.bg,
            type: c.type,
            is_default: c.isDefault || false
        }));
        return supabase.from('categories').insert(toInsert);
    }
    return { error: null };
};

export const fetchCategories = async (userId) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

    if (data && data.length > 0) {
        return {
            data: data.map(c => ({
                id: c.cat_id,
                name: c.name,
                icon: c.icon,
                bg: c.bg,
                type: c.type,
                isDefault: c.is_default
            })),
            error
        };
    }
    return { data: null, error };
};

export const syncWishlist = async (userId, wishlist) => {
    await supabase.from('wishlist').delete().eq('user_id', userId);
    if (wishlist.length > 0) {
        const toInsert = wishlist.map(w => ({
            user_id: userId,
            name: w.name,
            price: w.price,
            purchased: w.purchased || false
        }));
        return supabase.from('wishlist').insert(toInsert);
    }
    return { error: null };
};

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

export const syncBudget = async (userId, budget) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
        return supabase.from('profiles').update({ monthly_budget: budget }).eq('id', userId);
    } else {
        return supabase.from('profiles').insert({ id: userId, monthly_budget: budget });
    }
};

export const fetchBudget = async (userId) => {
    const { data, error } = await supabase.from('profiles').select('monthly_budget').eq('id', userId).single();
    return { budget: data?.monthly_budget || 0, error };
};
