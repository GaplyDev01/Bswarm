/*
  # Create tokens table
  
  1. New Tables
    - `tokens` - Stores token information and market data
      - `id` (text, primary key): Unique token identifier (from CoinGecko)
      - `name` (text): Token name
      - `symbol` (text): Token symbol
      - `image_url` (text): URL to token logo
      - `current_price` (numeric): Current token price
      - `market_cap` (numeric): Current market capitalization
      - `price_change_24h` (numeric): 24h price change percentage
      - `created_at` (timestamptz): Record creation timestamp
      - `updated_at` (timestamptz): Last update timestamp
      - `user_id` (uuid): Reference to user who added the token (if applicable)
      
  2. Security
    - Enable RLS on tokens table
    - Policies for public reading but authenticated creating/updating
*/

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  image_url TEXT,
  current_price NUMERIC NOT NULL,
  market_cap NUMERIC,
  price_change_24h NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES users(id)
);

-- Enable Row Level Security
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tokens are viewable by everyone"
  ON tokens
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can insert tokens"
  ON tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tokens they created"
  ON tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tokens_updated_at
BEFORE UPDATE ON tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();