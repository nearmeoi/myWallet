import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signIn as supabaseSignIn, 
  signUp as supabaseSignUp, 
  signOut as supabaseSignOut, 
  onAuthStateChange,
  resendConfirmation as supabaseResend,
  updateProfile as supabaseUpdateProfile,
  isSupabaseConfigured
} from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;
    try {
      const res = onAuthStateChange((event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      });
      subscription = res?.data?.subscription;
    } catch (err) {
      console.warn('Auth state change subscription error:', err);
      setTimeout(() => setLoading(false), 0);
    }

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.')
      };
    }
    return supabaseSignIn(email, password);
  };

  const signUp = async (email, password) => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error('Supabase belum dikonfigurasi. Atur VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env.')
      };
    }
    return supabaseSignUp(email, password, { emailRedirectTo: window.location.origin });
  };

  const signOut = async () => {
    await supabaseSignOut();
    setUser(null);
  };

  const resendConfirmation = async (email) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
    }
    return supabaseResend(email, { emailRedirectTo: window.location.origin });
  };

  const updateProfile = async (updates) => {
    if (!isSupabaseConfigured) {
      return { data: null, error: new Error('Supabase belum dikonfigurasi.') };
    }
    const { data, error } = await supabaseUpdateProfile(updates);
    if (data?.user) setUser(data.user);
    return { data, error };
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resendConfirmation,
    updateProfile,
    isSupabaseConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
