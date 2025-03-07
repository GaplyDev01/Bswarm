import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

type SupabaseContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: { user: User | null; session: Session | null } | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  createUserProfile: (userId: string, email: string) => Promise<boolean>;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    const response = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Explicitly disable email confirmation for local development
        emailRedirectTo: `${window.location.origin}/portal`,
        data: {
          email: email,
        }
      }
    });
    
    if (response.data.user && !response.error) {
      try {
        // Try both methods to create user profile
        
        // Method 1: Insert directly (might fail due to RLS)
        await supabase
          .from('users')
          .insert([
            {
              id: response.data.user.id,
              email: email,
              balance: 25000,
              invested_amount: 0,
              portfolio_value: 0,
              join_date: new Date().toISOString().split('T')[0],
            },
          ]);
          
        // Method 2: Use the RPC function (more reliable, bypasses RLS)
        await supabase.rpc('create_user_profile', {
          user_id: response.data.user.id,
          user_email: email
        });
      } catch (err) {
        console.error('Error creating user profile:', err);
      }
    }
    
    setLoading(false);
    return response;
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const response = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // If sign in successful, ensure user profile exists
    if (response.data.user && !response.error) {
      try {
        await createUserProfile(response.data.user.id, email);
      } catch (err) {
        console.error('Error ensuring user profile exists:', err);
      }
    }
    
    setLoading(false);
    return response;
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    return { error };
  };
  
  // Function to create user profile if it doesn't exist
  const createUserProfile = async (userId: string, email: string): Promise<boolean> => {
    try {
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (!existingProfile) {
        // Create profile using the RPC function
        const { data, error } = await supabase.rpc('create_user_profile', {
          user_id: userId,
          user_email: email
        });
        
        if (error) throw error;
        return true;
      }
      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return false;
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
        createUserProfile
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};