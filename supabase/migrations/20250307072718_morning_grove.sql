/*
  # User Authentication Schema Setup

  1. Database Schema
    - Users table connecting with Auth
    - Tokens and trading data structures
    - Portfolio tracking system
  
  2. Security
    - Row Level Security (RLS) policies
    - Safe policy creation with existence checks
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 25000,
  invested_amount NUMERIC NOT NULL DEFAULT 0,
  portfolio_value NUMERIC NOT NULL DEFAULT 0,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_distribution DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  monthly_return NUMERIC DEFAULT 0,
  all_time_return NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add row level security to users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Safely create policies on users table
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can view own data'
  ) THEN
    CREATE POLICY "Users can view own data" ON public.users 
      FOR SELECT 
      USING (auth.uid() = id);
  END IF;

  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can update own data'
  ) THEN
    CREATE POLICY "Users can update own data" ON public.users 
      FOR UPDATE 
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Create or update the tokens table
CREATE TABLE IF NOT EXISTS public.tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  image_url TEXT,
  current_price NUMERIC NOT NULL,
  market_cap NUMERIC,
  price_change_24h NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES public.users(id)
);

-- Add row level security to tokens table
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

-- Safely create policies on tokens table
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tokens' AND policyname = 'Tokens are viewable by everyone'
  ) THEN
    CREATE POLICY "Tokens are viewable by everyone" ON public.tokens 
      FOR SELECT 
      USING (true);
  END IF;

  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tokens' AND policyname = 'Authenticated users can insert tokens'
  ) THEN
    CREATE POLICY "Authenticated users can insert tokens" ON public.tokens 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
  END IF;

  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tokens' AND policyname = 'Users can update tokens they created'
  ) THEN
    CREATE POLICY "Users can update tokens they created" ON public.tokens 
      FOR UPDATE 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create or update the portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  token_id TEXT NOT NULL REFERENCES public.tokens(id),
  amount NUMERIC NOT NULL,
  buy_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, token_id)
);

-- Add row level security to portfolios table
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Safely create policies on portfolios table
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolios' AND policyname = 'Users can view own portfolio'
  ) THEN
    CREATE POLICY "Users can view own portfolio" ON public.portfolios
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolios' AND policyname = 'Users can insert into own portfolio'
  ) THEN
    CREATE POLICY "Users can insert into own portfolio" ON public.portfolios
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolios' AND policyname = 'Users can update own portfolio'
  ) THEN
    CREATE POLICY "Users can update own portfolio" ON public.portfolios
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'portfolios' AND policyname = 'Users can delete from own portfolio'
  ) THEN
    CREATE POLICY "Users can delete from own portfolio" ON public.portfolios
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Create or update signals table
CREATE TABLE IF NOT EXISTS public.signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id TEXT NOT NULL REFERENCES public.tokens(id),
  type TEXT NOT NULL CHECK (type IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  message TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entry_price NUMERIC,
  target_price NUMERIC,
  stop_loss NUMERIC,
  timeframe TEXT,
  user_id UUID REFERENCES public.users(id)
);

-- Add row level security to signals table
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Safely create policies on signals table
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'signals' AND policyname = 'Signals are viewable by everyone'
  ) THEN
    CREATE POLICY "Signals are viewable by everyone" ON public.signals
      FOR SELECT
      USING (true);
  END IF;

  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'signals' AND policyname = 'Authenticated users can insert signals'
  ) THEN
    CREATE POLICY "Authenticated users can insert signals" ON public.signals
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'signals' AND policyname = 'Users can update signals they created'
  ) THEN
    CREATE POLICY "Users can update signals they created" ON public.signals
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

-- Create function for decrementing user balance (for transaction handling)
CREATE OR REPLACE FUNCTION decrement_balance(user_id UUID, amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  current_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance FROM public.users WHERE id = user_id;
  
  -- Return the new balance
  RETURN greatest(0, current_balance - amount);
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns (safely)
DO $$
BEGIN
  -- Check if trigger exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_portfolios_updated_at'
  ) THEN
    CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Check if trigger exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tokens_updated_at'
  ) THEN
    CREATE TRIGGER update_tokens_updated_at
    BEFORE UPDATE ON public.tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;