import axios from 'axios';

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_COINGECKO_API_KEY;

// List of Solana ecosystem token IDs for filtering
const SOLANA_ECOSYSTEM_TOKENS = [
  'solana',
  'raydium',
  'bonk',
  'jito',
  'pyth-network',
  'render-token',
  'serum',
  'bonfida',
  'step-finance',
  'oxygen',
  'mango-markets',
  'star-atlas',
  'samoyedcoin',
  'marinade-staked-sol',
  'jito-staked-sol'
];

// Create a base API instance
const api = axios.create({
  baseURL: 'https://pro-api.coingecko.com/api/v3',
  timeout: 15000, // Increase timeout
  headers: {
    'x-cg-pro-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for retries
api.interceptors.request.use(
  config => {
    // Add cache-busting parameter and API key
    const timestamp = Date.now();
    config.params = {
      ...config.params,
      _t: timestamp,
      x_cg_pro_api_key: API_KEY
    };
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  async error => {
    const errorMessage = error.response?.data?.error || error.message || 'An unknown error occurred';
    console.error('API Error:', errorMessage);

    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }
    
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        throw new Error('API key is missing or invalid. Please check your VITE_COINGECKO_API_KEY.');
      case 429:
        throw new Error('Rate limit exceeded. Please try again later.');
      case 403:
        throw new Error('API key invalid or expired.');
      case 404:
        throw new Error('Resource not found.');
      default:
        throw new Error(errorMessage);
    }
  }
);

// Error handler
const handleApiError = (error: any) => {
  if (error.message) {
    console.error('API Error:', error.message);
  } else {
    console.error('API Error:', error);
  }
  throw error;
};

// Generate mock market data for testing and fallbacks
const generateMockMarketData = (coinIds: string[]) => {
  const mockData = coinIds.map(id => {
    const basePrice = {
      'solana': 122.45,
      'raydium': 0.874,
      'bonk': 0.00002953,
      'jito': 3.24,
      'pyth-network': 0.542,
      'render-token': 7.82,
      'samoyedcoin': 0.0065
    }[id] || 1.0;
    
    const marketCap = {
      'solana': 55453245123,
      'raydium': 1253412515,
      'bonk': 1851123456,
      'jito': 985632145,
      'pyth-network': 725412365,
      'render-token': 3121489536,
      'samoyedcoin': 412563254
    }[id] || 1000000000;
    
    // Randomize price change slightly
    const priceChange = (Math.random() * 10) - 5; // between -5% and +5%
    
    return {
      id,
      symbol: id.split('-')[0],
      name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      image: `https://via.placeholder.com/64/1c4532/FFFFFF?text=${id.charAt(0).toUpperCase()}`,
      current_price: basePrice,
      market_cap: marketCap,
      market_cap_rank: Math.floor(Math.random() * 200) + 1,
      fully_diluted_valuation: marketCap * 1.5,
      total_volume: marketCap * (Math.random() * 0.2),
      high_24h: basePrice * (1 + (Math.random() * 0.1)),
      low_24h: basePrice * (1 - (Math.random() * 0.1)),
      price_change_24h: basePrice * (priceChange / 100),
      price_change_percentage_24h: priceChange,
      price_change_percentage_7d: (Math.random() * 20) - 10,
      price_change_percentage_30d: (Math.random() * 40) - 20,
      market_cap_change_24h: marketCap * (priceChange / 100),
      market_cap_change_percentage_24h: priceChange,
      circulating_supply: marketCap / basePrice,
      total_supply: (marketCap / basePrice) * 1.5,
      max_supply: (marketCap / basePrice) * 2,
      ath: basePrice * 2,
      ath_change_percentage: -50,
      ath_date: "2021-11-01T00:00:00.000Z",
      atl: basePrice * 0.1,
      atl_change_percentage: 1000,
      atl_date: "2020-01-01T00:00:00.000Z",
      last_updated: new Date().toISOString(),
      sparkline_in_7d: {
        price: Array(168).fill(0).map((_, i) => [Date.now() - (i * 3600000), basePrice * (1 + ((Math.random() * 0.2) - 0.1))])
      }
    };
  });
  
  return mockData;
};

// Define API endpoints
export const coinGeckoAPI = {
  // Get detailed market data for a specific coin
  getCoinDetails: async (coinId: string) => {
    try {
      // If API key is not available, use mock data
      if (!API_KEY) {
        return generateMockMarketData([coinId])[0];
      }
      
      const { data } = await api.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: true,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: true
        }
      });
      return data;
    } catch (error) {
      console.warn('Falling back to mock data due to API error');
      return generateMockMarketData([coinId])[0];
    }
  },

  // Get OHLC data for charts
  getOHLCData: async (coinId: string, days = 1, vsCurrency = 'usd') => {
    try {
      // If API key is not available, use mock data
      if (!API_KEY) {
        return generateMockOHLCData(coinId, days);
      }
      
      const { data } = await api.get(`/coins/${coinId}/ohlc`, {
        params: {
          vs_currency: vsCurrency,
          days: days,
          precision: 'full'
        }
      });
      return data;
    } catch (error) {
      console.warn('Falling back to mock data due to API error');
      return generateMockOHLCData(coinId, days);
    }
  },

  // Get coin market chart
  getCoinMarketChart: async (coinId: string, days = 1, vsCurrency = 'usd') => {
    try {
      // If API key is not available, use mock data
      if (!API_KEY) {
        return generateMockMarketChart(coinId, days);
      }
      
      const { data } = await api.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: vsCurrency,
          days: days,
          interval: days === 1 ? 'minute' : days <= 90 ? 'hourly' : 'daily',
          precision: 'full'
        }
      });
      return data;
    } catch (error) {
      console.warn('Falling back to mock data due to API error');
      return generateMockMarketChart(coinId, days);
    }
  },

  // Search for tokens
  searchCoins: async (query: string) => {
    try {
      // Validate query
      if (!query?.trim()) {
        return { coins: [] };
      }

      // If API key is not available, use mock data
      if (!API_KEY) {
        return generateMockSearchResults(query);
      }

      // Make API request with proper headers and error handling
      const { data } = await api.get('/search', {
        params: {
          query: query.trim()
        }
      });
      
      // Validate response
      if (!data || !Array.isArray(data.coins)) {
        throw new Error('Invalid API response format');
      }
      
      // Sort results by market cap rank and take top results
      const sortedCoins = data.coins
        .filter(coin => coin && coin.id && coin.symbol)
        // Sort by market cap rank
        .sort((a, b) => (a.market_cap_rank || 999999) - (b.market_cap_rank || 999999))
        // Take top 6 results
        .slice(0, 6);
      
      return { ...data, coins: sortedCoins };
    } catch (error) {
      console.error('Search API error:', error);
      console.warn('Falling back to mock search results');
      return generateMockSearchResults(query);
    }
  },
  
  // Get market data for multiple coins
  getMarketData: async (ids: string[], vsCurrency = 'usd') => {
    try {
      if (!ids.length) return [];
      
      // If API key is not available, use mock data
      if (!API_KEY) {
        return generateMockMarketData(ids);
      }
      
      const { data } = await api.get('/coins/markets', {
        params: {
          vs_currency: vsCurrency,
          ids: ids.join(','),
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: true, // Need sparkline for 30m calculations
          price_change_percentage: '24h,7d,30d',
          include_market_cap: true,
          include_24h_vol: true,
          include_24h_change: true,
          include_last_updated_at: true,
          precision: 'full'
        }
      });
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      return data;
    } catch (error) {
      console.warn('Falling back to mock market data due to API error:', error);
      return generateMockMarketData(ids);
    }
  },
  
  // Get trending coins
  getTrendingCoins: async () => {
    try {
      // If API key is not available, use mock data
      if (!API_KEY) {
        return {
          coins: SOLANA_ECOSYSTEM_TOKENS.slice(0, 5).map(id => ({
            item: {
              id,
              name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              symbol: id.split('-')[0].toUpperCase(),
              market_cap_rank: Math.floor(Math.random() * 100) + 1
            }
          }))
        };
      }
      
      const { data } = await api.get('/search/trending', {
        params: {
          include_platform: false
        }
      });
      
      // Take top 5 trending coins
      const trendingCoins = data.coins.slice(0, 5);
      
      return { ...data, coins: trendingCoins };
    } catch (error) {
      console.warn('Falling back to mock trending data due to API error');
      return {
        coins: SOLANA_ECOSYSTEM_TOKENS.slice(0, 5).map(id => ({
          item: {
            id,
            name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            symbol: id.split('-')[0].toUpperCase(),
            market_cap_rank: Math.floor(Math.random() * 100) + 1
          }
        }))
      };
    }
  },
  
  // Get global crypto data
  getGlobalData: async () => {
    try {
      // If API key is not available, use mock data
      if (!API_KEY) {
        return generateMockGlobalData();
      }
      
      const response = await api.get('/global');
      return response.data;
    } catch (error) {
      console.warn('Falling back to mock global data due to API error');
      return generateMockGlobalData();
    }
  },
  
  // Explicitly get mock market data (for testing or fallbacks)
  getMockMarketData: (coinIds: string[]) => {
    return generateMockMarketData(coinIds);
  }
};

// Helper functions to generate mock data
const generateMockOHLCData = (coinId: string, days: number) => {
  const basePrice = {
    'solana': 122.45,
    'raydium': 0.874,
    'bonk': 0.00002953,
    'jito': 3.24,
    'pyth-network': 0.542,
    'render-token': 7.82,
    'samoyedcoin': 0.0065
  }[coinId] || 1.0;
  
  const volatility = 0.05; // 5% volatility
  const points = days === 1 ? 24 : days === 7 ? 7 * 24 : 30;
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / points;
  
  return Array(points).fill(0).map((_, i) => {
    const timestamp = now - (i * interval);
    const open = basePrice * (1 + ((Math.random() * 2 * volatility) - volatility));
    const close = open * (1 + ((Math.random() * 2 * volatility) - volatility));
    const high = Math.max(open, close) * (1 + (Math.random() * volatility));
    const low = Math.min(open, close) * (1 - (Math.random() * volatility));
    
    return [timestamp, open, high, low, close];
  }).sort((a, b) => a[0] - b[0]);
};

const generateMockMarketChart = (coinId: string, days: number) => {
  const basePrice = {
    'solana': 122.45,
    'raydium': 0.874,
    'bonk': 0.00002953,
    'jito': 3.24,
    'pyth-network': 0.542,
    'render-token': 7.82,
    'samoyedcoin': 0.0065
  }[coinId] || 1.0;
  
  const volatility = 0.05; // 5% volatility
  const points = days === 1 ? 24 * 60 : days === 7 ? 7 * 24 : 30;
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / points;
  
  const prices = Array(points).fill(0).map((_, i) => {
    const timestamp = now - (i * interval);
    const price = basePrice * (1 + ((Math.random() * 2 * volatility) - volatility));
    return [timestamp, price];
  }).sort((a, b) => a[0] - b[0]);
  
  const marketCaps = prices.map(([timestamp, price]) => 
    [timestamp, price * 1000000000 * (1 + ((Math.random() * 0.1) - 0.05))]
  );
  
  const totalVolumes = prices.map(([timestamp]) => 
    [timestamp, basePrice * 100000000 * Math.random()]
  );
  
  return {
    prices,
    market_caps: marketCaps,
    total_volumes: totalVolumes
  };
};

const generateMockSearchResults = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  
  // Filter tokens that match the query
  const matchedTokens = SOLANA_ECOSYSTEM_TOKENS.filter(token => 
    token.toLowerCase().includes(lowercaseQuery)
  );
  
  // Generate mock results
  const results = matchedTokens.map(id => ({
    id,
    name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    api_symbol: id.split('-')[0],
    symbol: id.split('-')[0].toUpperCase(),
    market_cap_rank: Math.floor(Math.random() * 100) + 1,
    thumb: `https://via.placeholder.com/32/1c4532/FFFFFF?text=${id.charAt(0).toUpperCase()}`,
    large: `https://via.placeholder.com/64/1c4532/FFFFFF?text=${id.charAt(0).toUpperCase()}`
  }));
  
  return { coins: results };
};

const generateMockGlobalData = () => {
  return {
    data: {
      active_cryptocurrencies: 12735,
      upcoming_icos: 0,
      ongoing_icos: 49,
      ended_icos: 3376,
      markets: 867,
      total_market_cap: {
        btc: 43723047.31701299,
        eth: 674663420.2641096,
        ltc: 19210649108.45694,
        bch: 5183717447.505764,
        bnb: 10340493545.316301,
        eos: 1543231621587.84,
        xrp: 3010371451652.8,
        xlm: 13029361924322.24,
        link: 123894889342.77957,
        dot: 258244697479.9891,
        yfi: 166848093.3147797,
        usd: 2570744333395.6,
        aed: 9442332370532.945,
        ars: 2287281580855647.5,
        aud: 3924989223902.5337,
        bdt: 283669246161061.06,
        bhd: 968813000789.1708,
        bmd: 2570744333395.6
      },
      total_volume: {
        btc: 3284470.8811074196,
        eth: 50667586.92366956,
        ltc: 1442508321.3866518,
        bch: 389371207.8244444,
        bnb: 776712952.2795725,
        eos: 115896985878.66644,
        xrp: 226054086661.54068,
        xlm: 978636353121.1169,
        link: 9305414599.158852,
        dot: 19394724551.15374,
        yfi: 12529825.94748035,
        usd: 193046478901.95438,
        aed: 709033335764.4089,
        ars: 171763964864906.25,
        aud: 294698742258.71,
        bdt: 21304288935599.777,
        bhd: 72780394414.71654,
        bmd: 193046478901.95438
      },
      market_cap_percentage: {
        btc: 54.05549737825564,
        eth: 17.81374308096737,
        usdt: 3.5493585932419145,
        bnb: 2.2717913760648415,
        sol: 1.4654858691817595,
        xrp: 1.1155275437137576,
        usdc: 1.069693194867863,
        steth: 0.9771340297101757,
        ada: 0.7599693808791318,
        avax: 0.5447526582860154
      },
      market_cap_change_percentage_24h_usd: 1.015133986113322,
      updated_at: 1676613952
    }
  };
};

// Use mock data only if API key is not available
export const USE_MOCK_DATA = !API_KEY;