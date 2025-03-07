/*
  # Authentication Hooks

  1. Functions
    - Create function to handle new user creation
    - Automatically create user profile when a new user signs up
  
  2. Triggers
    - Add trigger to call function on auth.users insert
*/

-- Function to create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into public.users
  INSERT INTO public.users (id, email, balance, join_date)
  VALUES (
    NEW.id,
    NEW.email,
    25000, -- Default starting balance
    CURRENT_DATE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();