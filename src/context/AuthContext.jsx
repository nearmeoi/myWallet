import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signIn as supabaseSignIn, 
  signUp as supabaseSignUp, 
  signOut as supabaseSignOut, 
  onAuthStateChange,
  resendConfirmation as supabaseResend,
  updateProfile as supabaseUpdateProfile
} from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    return supabaseSignIn(email, password);
  };

  const signUp = async (email, password) => {
    return supabaseSignUp(email, password, { emailRedirectTo: window.location.origin });
  };

  const signOut = async () => {
    await supabaseSignOut();
    setUser(null);
  };

  const resendConfirmation = async (email) => {
    return supabaseResend(email, { emailRedirectTo: window.location.origin });
  };

  const updateProfile = async (updates) => {
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
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
