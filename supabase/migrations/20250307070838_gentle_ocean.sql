/*
  # Create users table
  
  1. New Tables
    - `users` - Stores user profile and portfolio information
      - `id` (uuid, primary key): References the auth.users id
      - `email` (text, unique): User's email address
      - `balance` (numeric): User's available balance
      - `invested_amount` (numeric): Total amount invested
      - `portfolio_value` (numeric): Current portfolio value
      - `join_date` (date): When the user joined
      - `next_distribution` (date): Next scheduled payment
      - `monthly_return` (numeric): Current month return percentage
      - `all_time_return` (numeric): Lifetime return percentage
      - `created_at` (timestamptz): Record creation timestamp
      
  2. Security
    - Enable RLS on users table
    - Policies for users to read/update only their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  invested_amount NUMERIC NOT NULL DEFAULT 0,
  portfolio_value NUMERIC NOT NULL DEFAULT 0,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_distribution DATE,
  monthly_return NUMERIC,
  all_time_return NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);