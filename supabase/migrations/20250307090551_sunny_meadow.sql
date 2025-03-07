/*
  # Create function to get recent chat history

  1. New Function
    - `get_recent_chat_history` - RPC function to efficiently retrieve a user's chat history
    
  2. Details
    - Takes user ID and limit parameters
    - Returns chat history ordered by creation date
    - Includes all message details including sentiment data
    - Optimized query with proper indexing
*/

-- Create function to get chat history efficiently
CREATE OR REPLACE FUNCTION get_recent_chat_history(uid uuid, limit_count integer DEFAULT 50)
RETURNS SETOF chat_history AS $$
  SELECT *
  FROM chat_history
  WHERE user_id = uid
  ORDER BY created_at DESC
  LIMIT limit_count;
$$ LANGUAGE sql SECURITY DEFINER;

-- Add index to improve the performance of chat history queries
CREATE INDEX IF NOT EXISTS chat_history_user_id_created_at_idx ON chat_history (user_id, created_at DESC);