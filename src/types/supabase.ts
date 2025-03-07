export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tokens: {
        Row: {
          id: string
          name: string
          symbol: string
          image_url: string | null
          current_price: number
          market_cap: number | null
          price_change_24h: number | null
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id: string
          name: string
          symbol: string
          image_url?: string | null
          current_price: number
          market_cap?: number | null
          price_change_24h?: number | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          symbol?: string
          image_url?: string | null
          current_price?: number
          market_cap?: number | null
          price_change_24h?: number | null
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          token_id: string
          amount: number
          buy_price: number
          created_at: string
          updated_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          token_id: string
          amount: number
          buy_price: number
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          token_id?: string
          amount?: number
          buy_price?: number
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
      }
      signals: {
        Row: {
          id: string
          token_id: string
          type: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
          message: string
          confidence: number
          created_at: string
          entry_price: number | null
          target_price: number | null
          stop_loss: number | null
          timeframe: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          token_id: string
          type: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
          message: string
          confidence: number
          created_at?: string
          entry_price?: number | null
          target_price?: number | null
          stop_loss?: number | null
          timeframe?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          token_id?: string
          type?: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
          message?: string
          confidence?: number
          created_at?: string
          entry_price?: number | null
          target_price?: number | null
          stop_loss?: number | null
          timeframe?: string | null
          user_id?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          balance: number
          invested_amount: number
          portfolio_value: number
          join_date: string
          next_distribution: string | null
          monthly_return: number | null
          all_time_return: number | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          balance?: number
          invested_amount?: number
          portfolio_value?: number
          join_date?: string
          next_distribution?: string | null
          monthly_return?: number | null
          all_time_return?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          balance?: number
          invested_amount?: number
          portfolio_value?: number
          join_date?: string
          next_distribution?: string | null
          monthly_return?: number | null
          all_time_return?: number | null
          created_at?: string
        }
      }
      chat_history: {
        Row: {
          id: string
          user_id: string
          message: string
          role: 'user' | 'assistant'
          created_at: string
          session_id: string | null
          token_id: string | null
          sentiment_score: number | null
          sentiment_type: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'APE IN' | null
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          role: 'user' | 'assistant'
          created_at?: string
          session_id?: string | null
          token_id?: string | null
          sentiment_score?: number | null
          sentiment_type?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'APE IN' | null
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          role?: 'user' | 'assistant'
          created_at?: string
          session_id?: string | null
          token_id?: string | null
          sentiment_score?: number | null
          sentiment_type?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'APE IN' | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_username: {
        Args: {
          uid: string
          new_username: string
        }
        Returns: boolean
      }
      get_recent_chat_history: {
        Args: {
          uid: string
          limit_count?: number
        }
        Returns: {
          id: string
          user_id: string
          message: string
          role: 'user' | 'assistant'
          created_at: string
          session_id: string | null
          token_id: string | null
          sentiment_score: number | null
          sentiment_type: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'APE IN' | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type ChatHistoryItem = Database['public']['Tables']['chat_history']['Row'];