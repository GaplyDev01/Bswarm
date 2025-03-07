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
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
  updatePassword: (password: string) => Promise<{
    error: Error | null;
    data: any;
  }>;
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
        // In production, email confirmation is enabled
        emailRedirectTo: `${window.location.origin}/confirm`,
        data: {
          email: email,
        }
      }
    });
    
    if (response.data.user && !response.error) {
      try {
        // Only create profile if it doesn't exist yet
        await createUserProfile(response.data.user.id, email);
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
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking if user profile exists:', checkError);
      }
      
      if (!existingProfile) {
        // Profile doesn't exist, so try to create it using RPC function first (most reliable)
        try {
          const { error: rpcError } = await supabase.rpc('create_user_profile', {
            user_id: userId,
            user_email: email
          });
          
          if (rpcError) {
            console.error('RPC error creating profile:', rpcError);
            
            // Fallback to direct insert if RPC fails
            try {
              const { error: insertError } = await supabase
                .from('users')
                .insert({
                  id: userId,
                  email: email,
                  balance: 25000,
                  invested_amount: 0,
                  portfolio_value: 0,
                  join_date: new Date().toISOString().split('T')[0],
                })
                .single();
                
              if (insertError) {
                // Handle duplicate key error gracefully
                if (insertError.code === '23505') {
                  console.log('User profile already exists (concurrent creation)');
                  return true;
                }
                console.error('Insert error creating profile:', insertError);
                throw insertError;
              }
            } catch (insertCatchError) {
              // If insert also fails, but it's a duplicate key error, that's actually OK
              if (insertCatchError.code === '23505') {
                console.log('User profile already exists (concurrent creation)');
                return true;
              }
              throw insertCatchError;
            }
          }
        } catch (rpcCatchError) {
          console.error('Error in RPC call:', rpcCatchError);
          throw rpcCatchError;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      // Don't throw here, just return false - this allows auth to continue even if profile creation fails
      return false;
    }
  };
  
  // Reset password function
  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };
  
  // Update password function
  const updatePassword = async (password: string) => {
    return await supabase.auth.updateUser({ password });
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
        createUserProfile,
        resetPassword,
        updatePassword
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