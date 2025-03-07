/*
  # Update user creation process
  
  1. Changes
    - Add a new stored procedure to safely create user profiles
    - Ensure no duplicate entries are created
    - Handle concurrent user creation gracefully

  2. Security
    - Keep all existing RLS policies
*/

-- Create a more robust function to ensure user profiles are created safely
CREATE OR REPLACE FUNCTION public.create_user_profile_safely(
  user_id uuid,
  user_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean;
BEGIN
  -- First check if the user already exists
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = user_id
  ) INTO user_exists;
  
  -- If user doesn't exist, create it
  IF NOT user_exists THEN
    BEGIN
      INSERT INTO public.users (
        id,
        email,
        balance,
        invested_amount,
        portfolio_value,
        join_date
      ) VALUES (
        user_id,
        user_email,
        25000,  -- Default starting balance
        0,      -- Default invested amount
        0,      -- Default portfolio value
        CURRENT_DATE
      );
      RETURN true;
    EXCEPTION
      -- Handle case where user was created by another concurrent process
      WHEN unique_violation THEN
        RETURN true;
    END;
  END IF;
  
  RETURN true;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.create_user_profile_safely TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_safely TO anon;