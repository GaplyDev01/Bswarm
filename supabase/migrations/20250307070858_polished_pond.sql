/*
  # Create signals table
  
  1. New Tables
    - `signals` - Stores AI-generated trading signals
      - `id` (uuid, primary key): Unique signal identifier
      - `token_id` (text): Reference to tokens table
      - `type` (text): Signal type (BULLISH, BEARISH, NEUTRAL)
      - `message` (text): Signal description and reasoning
      - `confidence` (numeric): AI confidence score (0-100)
      - `created_at` (timestamptz): When signal was generated
      - `entry_price` (numeric): Recommended entry price
      - `target_price` (numeric): Target price for taking profit
      - `stop_loss` (numeric): Recommended stop loss price
      - `timeframe` (text): Signal timeframe (e.g., "1D", "4H")
      - `user_id` (uuid): User who generated the signal (if applicable)
      
  2. Security
    - Enable RLS on signals table
    - Policies for public reading but authenticated creating
*/

-- Create signals table
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL REFERENCES tokens(id),
  type TEXT NOT NULL CHECK (type IN ('BULLISH', 'BEARISH', 'NEUTRAL')),
  message TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entry_price NUMERIC,
  target_price NUMERIC,
  stop_loss NUMERIC,
  timeframe TEXT,
  user_id UUID REFERENCES users(id)
);

-- Enable Row Level Security
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Signals are viewable by everyone"
  ON signals
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert signals"
  ON signals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update signals they created"
  ON signals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);