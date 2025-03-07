/*
  # Create portfolios table
  
  1. New Tables
    - `portfolios` - Stores user token holdings
      - `id` (uuid, primary key): Unique transaction identifier
      - `user_id` (uuid): Reference to users table
      - `token_id` (text): Reference to tokens table
      - `amount` (numeric): Quantity of tokens held
      - `buy_price` (numeric): Price at which tokens were purchased
      - `created_at` (timestamptz): Record creation timestamp
      - `updated_at` (timestamptz): Last update timestamp
      - `notes` (text): Optional user notes about the holding
      
  2. Security
    - Enable RLS on portfolios table
    - Policies for users to manage only their own portfolio entries
*/

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_id TEXT NOT NULL REFERENCES tokens(id),
  amount NUMERIC NOT NULL,
  buy_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, token_id)
);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own portfolio"
  ON portfolios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own portfolio"
  ON portfolios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio"
  ON portfolios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own portfolio"
  ON portfolios
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a trigger to update the updated_at timestamp
CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON portfolios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();