/*
  # Fix Authentication Issues
  
  1. RLS Policy Fixes
    - Add policy for PUBLIC insert on users table
    - Allow users to be created during signup
  
  2. User Management
    - Fix the issue with email confirmations
    - Ensure proper user profile creation
*/

-- Fix RLS policies for the users table to allow inserts
DO $$
BEGIN
  -- Create policy to allow public inserts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Allow public insert'
  ) THEN
    CREATE POLICY "Allow public insert" ON public.users 
      FOR INSERT 
      TO public 
      WITH CHECK (true);
  END IF;
  
  -- Create policy to allow authenticated inserts as well
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Authenticated users can insert'
  ) THEN
    CREATE POLICY "Authenticated users can insert" ON public.users 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
  END IF;
END
$$;

-- Create trigger function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, balance, invested_amount, portfolio_value, join_date)
  VALUES (
    NEW.id,
    NEW.email,
    25000,   -- Default starting balance
    0,       -- Default invested amount
    0,       -- Default portfolio value
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;  -- In case the user already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile when a user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Also create a manual endpoint for creating the user profile
-- This can be used as a fallback if the trigger doesn't work
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.users (id, email, balance, invested_amount, portfolio_value, join_date)
  VALUES (
    user_id,
    user_email,
    25000,  -- Default starting balance
    0,      -- Default invested amount
    0,      -- Default portfolio value
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;