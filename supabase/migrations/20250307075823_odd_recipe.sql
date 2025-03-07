/*
  # Add Username and Chat History
  
  1. New Fields
    - Add username field to users table
  
  2. New Tables
    - Create chat_history table to store user conversation history
  
  3. RLS Policies
    - Add appropriate RLS policies for secure access control
*/

-- Add username column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;

-- Create chat_history table
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id UUID,
  token_id TEXT,
  sentiment_score INTEGER,
  sentiment_type TEXT CHECK (sentiment_type IN ('BULLISH', 'BEARISH', 'NEUTRAL', 'APE IN', NULL))
);

-- Add RLS to chat_history table
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- Create policies for chat_history
CREATE POLICY "Users can insert their own chat messages" ON public.chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chat history" ON public.chat_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index on user_id and created_at for faster querying
CREATE INDEX IF NOT EXISTS chat_history_user_id_created_at_idx ON public.chat_history(user_id, created_at DESC);

-- Create function to update username
CREATE OR REPLACE FUNCTION update_username(uid UUID, new_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the username
  UPDATE public.users
  SET username = new_username
  WHERE id = uid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get recent chat history
CREATE OR REPLACE FUNCTION get_recent_chat_history(uid UUID, limit_count INTEGER DEFAULT 50)
RETURNS SETOF public.chat_history AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.chat_history
  WHERE user_id = uid
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;