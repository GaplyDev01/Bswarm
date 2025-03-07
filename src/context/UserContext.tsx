import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from './SupabaseContext';
import { userApi } from '../services/api/supabaseApi';

interface UserState {
  id: string;
  email: string;
  username: string | null;
  balance: number;
  investedAmount: number;
  portfolioValue: number;
  joinDate: string;
  nextDistribution: string;
  monthlyReturn: number;
  allTimeReturn: number;
}

type UserContextType = {
  user: UserState;
  loading: boolean;
  error: string | null;
  updatePortfolioValue: (newValue: number) => Promise<void>;
  updateInvestedAmount: (amount: number) => Promise<void>;
  updateUsername: (username: string) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
};

const initialUserState: UserState = {
  id: '',
  email: '',
  username: null,
  balance: 25000,
  investedAmount: 0,
  portfolioValue: 0,
  joinDate: new Date().toLocaleDateString(),
  nextDistribution: new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString(),
  monthlyReturn: 18.7,
  allTimeReturn: 142.3,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(initialUserState);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user: supabaseUser } = useSupabase();

  // Load user data from Supabase when authentication state changes
  useEffect(() => {
    const loadUserData = async () => {
      if (supabaseUser) {
        setLoading(true);
        try {
          const userData = await userApi.getUserProfile(supabaseUser.id);
          
          if (userData) {
            // Format date to local string
            const joinDate = new Date(userData.join_date).toLocaleDateString();
            const nextDistribution = userData.next_distribution 
              ? new Date(userData.next_distribution).toLocaleDateString() 
              : new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString();
            
            setUser({
              id: userData.id,
              email: userData.email,
              username: userData.username,
              balance: userData.balance,
              investedAmount: userData.invested_amount,
              portfolioValue: userData.portfolio_value,
              joinDate,
              nextDistribution,
              monthlyReturn: userData.monthly_return || initialUserState.monthlyReturn,
              allTimeReturn: userData.all_time_return || initialUserState.allTimeReturn
            });
          } else {
            // If user profile doesn't exist yet, use default values
            setUser({
              ...initialUserState,
              id: supabaseUser.id,
              email: supabaseUser.email || ''
            });
          }
        } catch (err) {
          console.error('Error loading user data:', err);
          setError('Failed to load user profile');
          
          // Fallback to initial state with the authenticated user ID
          setUser({
            ...initialUserState,
            id: supabaseUser.id,
            email: supabaseUser.email || ''
          });
        } finally {
          setLoading(false);
        }
      } else {
        // No authenticated user, reset to initial state
        setUser(initialUserState);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [supabaseUser]);

  const refreshUserData = async () => {
    if (!supabaseUser) return;
    
    setLoading(true);
    try {
      const userData = await userApi.getUserProfile(supabaseUser.id);
      
      if (userData) {
        // Format date to local string
        const joinDate = new Date(userData.join_date).toLocaleDateString();
        const nextDistribution = userData.next_distribution 
          ? new Date(userData.next_distribution).toLocaleDateString() 
          : new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString();
        
        setUser({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          balance: userData.balance,
          investedAmount: userData.invested_amount,
          portfolioValue: userData.portfolio_value,
          joinDate,
          nextDistribution,
          monthlyReturn: userData.monthly_return || initialUserState.monthlyReturn,
          allTimeReturn: userData.all_time_return || initialUserState.allTimeReturn
        });
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Failed to refresh user profile');
    } finally {
      setLoading(false);
    }
  };

  const updatePortfolioValue = async (newValue: number) => {
    if (!supabaseUser) return;
    
    try {
      await userApi.updatePortfolioValue(supabaseUser.id, newValue);
      setUser(prev => ({
        ...prev,
        portfolioValue: newValue
      }));
    } catch (err) {
      console.error('Error updating portfolio value:', err);
      setError('Failed to update portfolio value');
    }
  };

  const updateInvestedAmount = async (amount: number) => {
    if (!supabaseUser) return;
    
    try {
      // If amount is positive, we're investing (reducing balance)
      // If negative, we're withdrawing (increasing balance)
      const newInvestedAmount = user.investedAmount + amount;
      const newBalance = user.balance - amount;
      
      // Update in Supabase
      await userApi.updateInvestedAmount(supabaseUser.id, amount);
      
      // Update local state
      setUser(prev => ({
        ...prev,
        investedAmount: newInvestedAmount,
        balance: newBalance
      }));
    } catch (err) {
      console.error('Error updating invested amount:', err);
      setError('Failed to update investment');
      throw err;
    }
  };

  const updateUsername = async (username: string) => {
    if (!supabaseUser) return false;
    
    try {
      const success = await userApi.updateUsername(supabaseUser.id, username);
      
      if (success) {
        setUser(prev => ({
          ...prev,
          username
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username');
      return false;
    }
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        loading, 
        error,
        updatePortfolioValue, 
        updateInvestedAmount,
        updateUsername,
        refreshUserData 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};