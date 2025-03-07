import { supabase } from '../../utils/supabaseClient';
import type { Database } from '../../types/supabase';
import type { 
  TokenData,
  PortfolioToken,
  Signal
} from '../../types';

// Token related functions
export const tokenApi = {
  // Add a token to the database
  async addToken(token: TokenData) {
    const { data, error } = await supabase
      .from('tokens')
      .insert({
        id: token.id,
        name: token.name,
        symbol: token.symbol,
        image_url: token.image,
        current_price: token.current_price,
        market_cap: token.market_cap,
        price_change_24h: token.price_change_percentage_24h
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get a token by ID
  async getToken(id: string) {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get all tokens
  async getAllTokens() {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('market_cap', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Update token price information
  async updateTokenPrice(
    id: string, 
    currentPrice: number, 
    priceChange24h: number,
    marketCap?: number
  ) {
    const { data, error } = await supabase
      .from('tokens')
      .update({
        current_price: currentPrice,
        price_change_24h: priceChange24h,
        market_cap: marketCap,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Portfolio related functions
export const portfolioApi = {
  // Get user's portfolio
  async getUserPortfolio(userId: string) {
    const { data, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        tokens (
          id,
          name,
          symbol,
          image_url,
          current_price,
          price_change_24h
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },
  
  // Add token to portfolio
  async addToPortfolio(
    userId: string,
    tokenId: string,
    amount: number,
    buyPrice: number,
    notes?: string
  ) {
    // First check if this token already exists in the portfolio
    const { data: existing } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('token_id', tokenId)
      .maybeSingle();
    
    let result;
    
    if (existing) {
      // Update existing entry
      const { data, error } = await supabase
        .from('portfolios')
        .update({
          amount: existing.amount + amount,
          buy_price: (existing.buy_price * existing.amount + buyPrice * amount) / (existing.amount + amount),
          notes: notes || existing.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new entry
      const { data, error } = await supabase
        .from('portfolios')
        .insert({
          user_id: userId,
          token_id: tokenId,
          amount: amount,
          buy_price: buyPrice,
          notes: notes
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    return result;
  },
  
  // Remove token from portfolio
  async removeFromPortfolio(portfolioId: string) {
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId);
    
    if (error) throw error;
    return true;
  },
  
  // Update portfolio entry
  async updatePortfolioEntry(
    portfolioId: string,
    amount: number,
    buyPrice?: number,
    notes?: string
  ) {
    const updates: any = {
      amount,
      updated_at: new Date().toISOString()
    };
    
    if (buyPrice !== undefined) updates.buy_price = buyPrice;
    if (notes !== undefined) updates.notes = notes;
    
    const { data, error } = await supabase
      .from('portfolios')
      .update(updates)
      .eq('id', portfolioId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Trading signals related functions
export const signalApi = {
  // Get all signals
  async getAllSignals(limit = 20) {
    const { data, error } = await supabase
      .from('signals')
      .select(`
        *,
        tokens (
          id,
          name,
          symbol,
          image_url,
          current_price,
          price_change_24h
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },
  
  // Get signals for a specific token
  async getTokenSignals(tokenId: string) {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .eq('token_id', tokenId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Create a new signal
  async createSignal(
    tokenId: string,
    type: 'BULLISH' | 'BEARISH' | 'NEUTRAL',
    message: string,
    confidence: number,
    entryPrice?: number,
    targetPrice?: number,
    stopLoss?: number,
    timeframe?: string,
    userId?: string
  ) {
    const { data, error } = await supabase
      .from('signals')
      .insert({
        token_id: tokenId,
        type: type,
        message: message,
        confidence: confidence,
        entry_price: entryPrice,
        target_price: targetPrice,
        stop_loss: stopLoss,
        timeframe: timeframe,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// User related functions
export const userApi = {
  // Get user profile
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        // Try to create the user profile if it doesn't exist
        if (error.code === 'PGRST116') {
          // Get user email from auth
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser && authUser.user) {
            // Create profile using RPC function (bypasses RLS)
            await supabase.rpc('create_user_profile', {
              user_id: userId,
              user_email: authUser.user.email || 'user@example.com'
            });
            
            // Try to fetch again
            const { data: newData, error: newError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
              
            if (newError) throw newError;
            return newData;
          }
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  },
  
  // Create user profile if it doesn't exist
  async ensureUserProfile(userId: string, email: string) {
    try {
      // Try to get the user profile
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      // If user profile doesn't exist, create it
      if (!data) {
        // Use the RPC function to create profile (bypasses RLS)
        await supabase.rpc('create_user_profile', {
          user_id: userId,
          user_email: email
        });
        
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Error ensuring user profile exists:', error);
      return false;
    }
  },
  
  // Update user balance
  async updateUserBalance(userId: string, newBalance: number) {
    const { data, error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Update invested amount
  async updateInvestedAmount(userId: string, amount: number) {
    try {
      // First get current values
      const { data: user } = await supabase
        .from('users')
        .select('invested_amount, balance')
        .eq('id', userId)
        .single();
      
      if (!user) throw new Error('User not found');
      
      // Calculate new invested amount and balance
      const newInvestedAmount = user.invested_amount + amount;
      const newBalance = user.balance - amount;
      
      if (newBalance < 0 && amount > 0) {
        throw new Error('Insufficient balance');
      }
      
      // Update with new values
      const { data, error } = await supabase
        .from('users')
        .update({ 
          invested_amount: newInvestedAmount,
          balance: newBalance
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating invested amount:', error);
      throw error;
    }
  },
  
  // Update portfolio value
  async updatePortfolioValue(userId: string, value: number) {
    const { data, error } = await supabase
      .from('users')
      .update({ portfolio_value: value })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Update user returns
  async updateUserReturns(userId: string, monthlyReturn: number, allTimeReturn: number) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        monthly_return: monthlyReturn,
        all_time_return: allTimeReturn
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};