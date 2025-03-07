/*
  # Demo Data Setup

  1. Insert test tokens
    - Add some Solana ecosystem tokens for demonstration
  
  2. Insert demo signals
    - Add example trading signals
*/

-- Insert some sample token data if the table is empty
INSERT INTO public.tokens (id, name, symbol, image_url, current_price, market_cap, price_change_24h)
SELECT * FROM (VALUES
    ('solana', 'Solana', 'SOL', 'https://assets.coingecko.com/coins/images/4128/large/solana.png', 122.45, 51800000000, 2.5),
    ('raydium', 'Raydium', 'RAY', 'https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg', 0.8740, 223000000, -1.2),
    ('bonk', 'Bonk', 'BONK', 'https://assets.coingecko.com/coins/images/28600/large/bonk.png', 0.00002953, 1750000000, 5.7),
    ('pyth-network', 'Pyth Network', 'PYTH', 'https://assets.coingecko.com/coins/images/27055/large/pyth-200x200.png', 0.5420, 690000000, 7.2),
    ('jito', 'Jito', 'JTO', 'https://assets.coingecko.com/coins/images/33969/large/jito.jpeg', 3.24, 373000000, -0.8)
) AS t(id, name, symbol, image_url, current_price, market_cap, price_change_24h)
WHERE NOT EXISTS (
    SELECT 1 FROM public.tokens
);

-- Insert sample signals if the table is empty
INSERT INTO public.signals (token_id, type, message, confidence, entry_price, target_price, stop_loss, timeframe)
SELECT * FROM (VALUES
    ('solana', 'BULLISH', 'Solana is showing strong bullish momentum with increasing volume and positive on-chain metrics.', 87, 122.45, 146.94, 110.20, '4H'),
    ('raydium', 'BULLISH', 'Raydium is forming a potential reversal pattern at a strong support level.', 73, 0.8740, 1.0488, 0.8130, '1D'),
    ('bonk', 'BEARISH', 'BONK is showing signs of exhaustion after a strong rally.', 65, 0.00002953, 0.00002362, 0.00003100, '1D')
) AS t(token_id, type, message, confidence, entry_price, target_price, stop_loss, timeframe)
WHERE NOT EXISTS (
    SELECT 1 FROM public.signals
);