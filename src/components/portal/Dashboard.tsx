import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { CheckSquare, Square, LayoutGrid, ChevronDown, X, ChevronRight, ChevronLeft, Layout, Maximize, Minimize, UserCircle2 } from 'lucide-react';

import { TokenSearch } from './TokenSearch';
import { ProfileCard } from './ProfileCard';
import { SignalsCard } from './SignalsCard';
import { TokenDetailsCard } from './TokenDetailsCard';
import { SocialCard } from './SocialCard';
import { NavBar } from './NavBar';
import { ThemeToggle } from '../ThemeToggle';
import { UserMenu } from './UserMenu';
import { ChatHistoryTool } from './tools/ChatHistoryTool';
import { DashboardPreferences } from './DashboardPreferences';

// Import all tool components
import { ChartTool } from './tools/ChartTool';
import { TradingViewTool } from './tools/TradingViewTool';
import { TechnicalIndicatorsTool } from './tools/TechnicalIndicatorsTool';
import { VolumeProfileTool } from './tools/VolumeProfileTool';
import { MomentumTool } from './tools/MomentumTool';
import { MarketDepthTool } from './tools/MarketDepthTool';
import { OrderFlowTool } from './tools/OrderFlowTool';
import { LiquidityTool } from './tools/LiquidityTool';
import { NewsFeedTool } from './tools/NewsFeedTool';
import { SocialFeedTool } from './tools/SocialFeedTool';
import { PatternAlertsTool } from './tools/PatternAlertsTool';

// Tab views
import { ChartsView } from './tabs/ChartsView';
import { ProfileView } from './tabs/ProfileView';
import { SignalsView } from './tabs/SignalsView';
import { ChatView } from './tabs/ChatView';

// Import AI components
import { AIFloatingButton } from '../AIFloatingButton';
import { sendToAI, ImportedCardData } from '../../services/aiService';
import { AITaskNotifications } from '../AITaskNotifications';
import { CardDataProvider } from '../../contexts/CardDataContext';

// Import dashboard type definitions
import { CardOption, TraderProfile, TraderProfileType, DashboardPreferences as DashboardPrefsType, DashboardLayout } from '../../types/dashboard';

// Apply width provider to the grid layout
const ResponsiveGridLayout = WidthProvider(RGL);

// Trader profiles with predefined settings
const TRADER_PROFILES: TraderProfile[] = [
  {
    id: 'beginner',
    name: 'Beginner Trader',
    description: 'Essential tools for new traders with simplified layout',
    columns: 2,
    visibleCards: ['profile', 'signals', 'tokenSearch', 'tokenDetails', 'social']
  },
  {
    id: 'intermediate',
    name: 'Intermediate Trader',
    description: 'Balanced view with additional technical tools',
    columns: 3,
    visibleCards: ['profile', 'signals', 'tokenSearch', 'tokenDetails', 'social', 'priceChart', 'newsFeed']
  },
  {
    id: 'advanced',
    name: 'Advanced Trader',
    description: 'Full suite of technical analysis tools',
    columns: 3,
    visibleCards: ['profile', 'signals', 'tokenSearch', 'tokenDetails', 'social', 'priceChart', 'tradingView', 'technicalIndicators', 'volumeProfile', 'momentum', 'newsFeed']
  },
  {
    id: 'professional',
    name: 'Professional Trader',
    description: 'Complete trading environment with all tools',
    columns: 3,
    visibleCards: ['profile', 'signals', 'tokenSearch', 'tokenDetails', 'social', 'priceChart', 'tradingView', 'technicalIndicators', 'volumeProfile', 'momentum', 'marketDepth', 'orderFlow', 'liquidity', 'newsFeed', 'socialFeed', 'patternAlerts']
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Your personalized dashboard setup',
    columns: 3,
    visibleCards: [] // Will be populated based on user selections
  }
];

export const Dashboard: React.FC = () => {
  const [cols, setCols] = useState(3);
  const [editMode, setEditMode] = useState(false);
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Current trader profile
  const [activeProfile, setActiveProfile] = useState<TraderProfileType>('beginner');
  
  // Show preferences dialog on first visit
  const [showPreferences, setShowPreferences] = useState(() => {
    // Show preferences dialog on first visit
    const hasSeenPreferences = localStorage.getItem('dashboard_preferences');
    return !hasSeenPreferences;
  });
  
  // Panel visibility and sizing (for ChatView)
  const [leftPanelEnabled, setLeftPanelEnabled] = useState<boolean>(true);
  const [rightPanelEnabled, setRightPanelEnabled] = useState<boolean>(true);
  
  // Card minimization state
  const [minimizedCards, setMinimizedCards] = useState<string[]>([]);
  
  // Load saved preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('dashboard_preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences) as DashboardPrefsType;
        if (preferences.traderProfile) {
          setActiveProfile(preferences.traderProfile);
        }
        if (preferences.columns) {
          setCols(preferences.columns);
        }
        if (preferences.visibleCards && Array.isArray(preferences.visibleCards)) {
          // Only apply saved preferences if they exist and are valid
          setCardOptions(prev => 
            prev.map(card => ({
              ...card,
              visible: preferences.visibleCards.includes(card.id)
            }))
          );
        }
      } catch (error) {
        console.error('Error loading dashboard preferences:', error);
        // If there's an error with stored preferences, reset to defaults
        localStorage.removeItem('dashboard_preferences');
      }
    }
  }, []);
  
  // Handle toggling both panels
  const toggleBothPanels = () => {
    if (leftPanelEnabled || rightPanelEnabled) {
      setLeftPanelEnabled(false);
      setRightPanelEnabled(false);
    } else {
      setLeftPanelEnabled(true);
      setRightPanelEnabled(true);
    }
  };
  
  // Parse tab from URL query parameters
  const getActiveTabFromUrl = useCallback(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return tab || 'dashboard';
  }, [location.search]);
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  
  // Update URL when tab changes
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    navigate(`/portal?tab=${tab}`, { replace: true });
  }, [navigate]);
  
  // Update activeTab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location, getActiveTabFromUrl]);
  
  // Listen for custom navigation events (for chat history)
  useEffect(() => {
    const handleNavigateEvent = (event: CustomEvent) => {
      const { tab } = event.detail;
      if (tab) {
        handleTabChange(tab);
      }
    };
    
    window.addEventListener('navigate', handleNavigateEvent as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigateEvent as EventListener);
    };
  }, [handleTabChange]);
  
  // Define available cards
  const availableCards = [
    {
      id: 'profile',
      title: 'AI Agent Profile',
      description: 'View and interact with your AI trading assistant'
    },
    {
      id: 'signals',
      title: 'Trading Signals',
      description: 'Real-time AI-generated trading signals'
    },
    {
      id: 'tokenSearch',
      title: 'Token Search',
      description: 'Search and analyze Solana ecosystem tokens'
    },
    {
      id: 'tokenDetails',
      title: 'Token Details',
      description: 'In-depth token analysis and metrics'
    },
    {
      id: 'social',
      title: 'Social Presence',
      description: 'Community updates and social metrics'
    },
    {
      id: 'chatHistory',
      title: 'Chat History',
      description: 'View your conversation history with the AI'
    },
    // New tools from AI Chat
    {
      id: 'priceChart',
      title: 'Price Chart',
      description: 'Interactive price chart with historical data'
    },
    {
      id: 'tradingView',
      title: 'TradingView',
      description: 'Advanced TradingView charting interface'
    },
    {
      id: 'technicalIndicators',
      title: 'Technical Indicators',
      description: 'Key technical indicators with buy/sell signals'
    },
    {
      id: 'volumeProfile',
      title: 'Volume Profile',
      description: 'Volume distribution across price levels'
    },
    {
      id: 'momentum',
      title: 'Momentum Scanner',
      description: 'Monitor momentum indicators and market trends'
    },
    {
      id: 'marketDepth',
      title: 'Market Depth',
      description: 'Order book visualization and liquidity analysis'
    },
    {
      id: 'orderFlow',
      title: 'Order Flow',
      description: 'Real-time order flow and buying/selling pressure'
    },
    {
      id: 'liquidity',
      title: 'Liquidity Analysis',
      description: 'Market liquidity and depth visualization'
    },
    {
      id: 'newsFeed',
      title: 'News Feed',
      description: 'Latest news and updates for crypto markets'
    },
    {
      id: 'socialFeed',
      title: 'Social Sentiment',
      description: 'Social media sentiment analysis for tokens'
    },
    {
      id: 'patternAlerts',
      title: 'Pattern Alerts',
      description: 'Detect and alert on chart patterns'
    }
  ];
  
  // Define all available cards
  const [cardOptions, setCardOptions] = useState<CardOption[]>([
    // Basic Dashboard Cards - Visible by Default
    { id: 'profile', title: 'Agent Profile', component: <ProfileCard />, visible: true },
    { id: 'signals', title: 'Trading Signals', component: <SignalsCard />, visible: true },
    { id: 'tokenSearch', title: 'Token Search', component: <TokenSearch />, visible: true },
    { id: 'tokenDetails', title: 'Token Details', component: <TokenDetailsCard />, visible: true },
    { id: 'social', title: 'Social Presence', component: <SocialCard />, visible: true },
    // Chat History is now in the Advanced Tools section, hidden by default
    { id: 'chatHistory', title: 'Chat History', component: <ChatHistoryTool />, visible: false },
    
    // Advanced AI Tools - Hidden by Default
    { id: 'priceChart', title: 'Price Chart', component: <ChartTool />, visible: false },
    { id: 'tradingView', title: 'TradingView', component: <TradingViewTool symbol="SOLUSDT" />, visible: false },
    { id: 'technicalIndicators', title: 'Technical Indicators', component: <TechnicalIndicatorsTool />, visible: false },
    { id: 'volumeProfile', title: 'Volume Profile', component: <VolumeProfileTool />, visible: false },
    { id: 'momentum', title: 'Momentum Scanner', component: <MomentumTool />, visible: false },
    { id: 'marketDepth', title: 'Market Depth', component: <MarketDepthTool />, visible: false },
    { id: 'orderFlow', title: 'Order Flow', component: <OrderFlowTool />, visible: false },
    { id: 'liquidity', title: 'Liquidity Analysis', component: <LiquidityTool />, visible: false },
    { id: 'newsFeed', title: 'News Feed', component: <NewsFeedTool />, visible: false },
    { id: 'socialFeed', title: 'Social Sentiment', component: <SocialFeedTool />, visible: false },
    { id: 'patternAlerts', title: 'Pattern Alerts', component: <PatternAlertsTool />, visible: false },
  ]);

  // Function to toggle card minimization
  const toggleCardMinimize = (cardId: string) => {
    setMinimizedCards(prev => 
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Handle layout change
  const handleLayoutChange = (newLayout: RGL.Layout[]) => {
    // Sort layout items to ensure proper vertical compaction
    const sortedLayout = [...newLayout].sort((a, b) => {
      // First sort by y coordinate
      if (a.y !== b.y) return a.y - b.y;
      // Then by x coordinate for items on the same row
      return a.x - b.x;
    });
    
    // Ensure layout is saved
    setLayout(sortedLayout);
    
    // If in edit mode, save this layout to localStorage so it persists
    if (editMode) {
      localStorage.setItem('dashboard_layout', JSON.stringify({
        layout: sortedLayout,
        timestamp: new Date().toISOString()
      }));
    }
  };
  
  // Handle drag stop event with custom compaction
  const handleDragStop = (layout: RGL.Layout[]) => {
    // Apply our custom compaction algorithm
    const compactedLayout = compactLayout(layout, cols);
    setLayout(compactedLayout);
    
    // Save to localStorage if in edit mode
    if (editMode) {
      localStorage.setItem('dashboard_layout', JSON.stringify({
        layout: compactedLayout,
        timestamp: new Date().toISOString()
      }));
    }
  };
  
  // Handle resize stop event with custom compaction
  const handleResizeStop = (layout: RGL.Layout[]) => {
    // Apply our custom compaction algorithm
    const compactedLayout = compactLayout(layout, cols);
    setLayout(compactedLayout);
    
    // Save to localStorage if in edit mode
    if (editMode) {
      localStorage.setItem('dashboard_layout', JSON.stringify({
        layout: compactedLayout,
        timestamp: new Date().toISOString()
      }));
    }
  };

  // Generate layout based on visible cards
  const generateLayout = useCallback((columns: number) => {
    const visibleCards = cardOptions.filter(card => card.visible);
    let initialLayout: RGL.Layout[] = [];
    
    if (columns === 3) {
      // 3-column layout (default) - more explicit basic card positioning
      initialLayout = [
        // First row - 3 cards in a row
        { i: 'profile', x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'signals', x: 1, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'tokenSearch', x: 2, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        
        // Second row - wide card and regular card
        { i: 'tokenDetails', x: 0, y: 2, w: 2, h: 2, minW: 1 },
        { i: 'social', x: 2, y: 2, w: 1, h: 2, minW: 1, maxW: 1 },
        
        // Chat history moved to advanced tools section
        { i: 'chatHistory', x: 0, y: 6, w: 1, h: 2, minW: 1 },
        
        // Advanced tool cards - will only be included if visible
        // These are organized to follow a clear pattern when enabled
        { i: 'priceChart', x: 0, y: 6, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'tradingView', x: 1, y: 6, w: 2, h: 2, minW: 1 },
        { i: 'technicalIndicators', x: 0, y: 8, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'volumeProfile', x: 1, y: 8, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'momentum', x: 2, y: 8, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'marketDepth', x: 0, y: 10, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'orderFlow', x: 1, y: 10, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'liquidity', x: 2, y: 10, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'newsFeed', x: 0, y: 12, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'socialFeed', x: 1, y: 12, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'patternAlerts', x: 2, y: 12, w: 1, h: 2, minW: 1, maxW: 1 },
      ].filter(item => visibleCards.some(card => card.id === item.i));
    } else if (columns === 2) {
      // 2-column layout with optimized positioning
      initialLayout = [
        // First row
        { i: 'profile', x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'signals', x: 1, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        
        // Second row
        { i: 'tokenSearch', x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'social', x: 1, y: 2, w: 1, h: 2, minW: 1, maxW: 1 },
        
        // Third row - wide card for token details
        { i: 'tokenDetails', x: 0, y: 4, w: 2, h: 2, minW: 1 },
        
        // Chat history moved to advanced tools section
        { i: 'chatHistory', x: 0, y: 8, w: 1, h: 2, minW: 1 },
        
        // Advanced tools with optimized layout
        { i: 'priceChart', x: 0, y: 8, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'tradingView', x: 0, y: 10, w: 2, h: 2, minW: 1 },
        { i: 'technicalIndicators', x: 0, y: 12, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'volumeProfile', x: 1, y: 12, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'momentum', x: 0, y: 14, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'marketDepth', x: 1, y: 14, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'orderFlow', x: 0, y: 16, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'liquidity', x: 1, y: 16, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'newsFeed', x: 0, y: 18, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'socialFeed', x: 1, y: 18, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'patternAlerts', x: 0, y: 20, w: 1, h: 2, minW: 1, maxW: 1 },
      ].filter(item => visibleCards.some(card => card.id === item.i));
    } else if (columns === 1) {
      // Single column layout for mobile - organized for optimal experience
      initialLayout = [
        // Core cards first
        { i: 'profile', x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'signals', x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'tokenSearch', x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'tokenDetails', x: 0, y: 6, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'social', x: 0, y: 8, w: 1, h: 2, minW: 1, maxW: 1 },
        
        // Chat history moved to advanced tools section
        { i: 'chatHistory', x: 0, y: 12, w: 1, h: 2, minW: 1, maxW: 1 },
        
        // Advanced tools
        { i: 'priceChart', x: 0, y: 12, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'tradingView', x: 0, y: 14, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'technicalIndicators', x: 0, y: 16, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'volumeProfile', x: 0, y: 18, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'momentum', x: 0, y: 20, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'marketDepth', x: 0, y: 22, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'orderFlow', x: 0, y: 24, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'liquidity', x: 0, y: 26, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'newsFeed', x: 0, y: 28, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'socialFeed', x: 0, y: 30, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'patternAlerts', x: 0, y: 32, w: 1, h: 2, minW: 1, maxW: 1 },
      ].filter(item => visibleCards.some(card => card.id === item.i));
    }
    
    // Apply compaction to ensure no gaps in the layout
    return compactLayout(initialLayout, columns);
  }, [cardOptions]);

  // Function to compact layout and prevent gaps
  const compactLayout = (layout: RGL.Layout[], cols: number) => {
    if (!layout.length) return layout;
    
    // Create a deep copy of the layout
    const newLayout = [...layout];
    let iterations = 0;
    let madeChanges = true;
    const MAX_ITERATIONS = 10; // Prevent infinite loops
    
    // Repeat the compaction until no more changes are made or max iterations reached
    while (madeChanges && iterations < MAX_ITERATIONS) {
      madeChanges = false;
      iterations++;
      
      // ---- PHASE 1: Vertical Compaction ----
      
      // Sort items by y position (top to bottom), then x position (left to right)
      newLayout.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });
      
      // Vertical compaction: move everything as far up as possible
      const bottomY = Array(cols).fill(0); // Tracks the bottom edge of items in each column
      
      for (let i = 0; i < newLayout.length; i++) {
        const item = newLayout[i];
        
        // Find the lowest position this item can be placed at
        let lowestPossibleY = 0;
        for (let x = item.x; x < item.x + item.w; x++) {
          if (x < cols) { // Ensure we don't go out of bounds
            lowestPossibleY = Math.max(lowestPossibleY, bottomY[x] || 0);
          }
        }
        
        // If we can move the item up, do so and mark that changes were made
        if (item.y !== lowestPossibleY) {
          item.y = lowestPossibleY;
          madeChanges = true;
        }
        
        // Update the bottom edge for all affected columns
        for (let x = item.x; x < item.x + item.w; x++) {
          if (x < cols) {
            bottomY[x] = item.y + item.h;
          }
        }
      }
      
      // ---- PHASE 2: Horizontal Compaction ----
      
      // Create a grid representation to detect empty cells
      const grid: boolean[][] = Array(cols).fill(null).map(() => []);
      const gridHeight = Math.max(...newLayout.map(item => item.y + item.h));
      
      // Fill the grid with the current layout
      for (const item of newLayout) {
        for (let x = item.x; x < item.x + item.w; x++) {
          for (let y = item.y; y < item.y + item.h; y++) {
            if (!grid[x]) grid[x] = [];
            grid[x][y] = true;
          }
        }
      }
      
      // For each item, try to move it left if there's space
      for (let i = 0; i < newLayout.length; i++) {
        const item = newLayout[i];
        
        // Can't move items that are already at x=0
        if (item.x === 0) continue;
        
        // Try to move the item left one column at a time
        let newX = item.x;
        canMoveLeft: while (newX > 0) {
          // Check if we can move the item one position to the left
          newX--;
          
          // Verify each position the item would occupy
          for (let y = item.y; y < item.y + item.h; y++) {
            // If any required cell is occupied, can't move left
            if (grid[newX] && grid[newX][y]) {
              newX++; // Move back to last valid position
              break canMoveLeft;
            }
          }
        }
        
        // If we found a new position, update the item
        if (newX !== item.x) {
          // Remove item from old position in grid
          for (let x = item.x; x < item.x + item.w; x++) {
            for (let y = item.y; y < item.y + item.h; y++) {
              if (grid[x]) grid[x][y] = false;
            }
          }
          
          // Update item position
          item.x = newX;
          madeChanges = true;
          
          // Add item to new position in grid
          for (let x = item.x; x < item.x + item.w; x++) {
            for (let y = item.y; y < item.y + item.h; y++) {
              if (!grid[x]) grid[x][y] = true;
            }
          }
        }
      }
      
      // ---- PHASE 3: Check for and fill empty cells ----
      
      // Identify any empty cells that should be filled
      for (let x = 0; x < cols; x++) {
        // Skip rightmost column as we can't move anything further right
        if (x === cols - 1) continue; 
        
        for (let y = 0; y < gridHeight; y++) {
          // If this cell is empty but the one to its right is filled
          if ((!grid[x] || !grid[x][y]) && grid[x + 1] && grid[x + 1][y]) {
            // Look for items to the right that could be moved left
            for (let i = 0; i < newLayout.length; i++) {
              const item = newLayout[i];
              
              // If this item is to the right and overlaps this y position
              if (item.x > x && item.y <= y && item.y + item.h > y) {
                // Check if we can move it left (depends on its width)
                let canMove = true;
                for (let checkY = item.y; checkY < item.y + item.h; checkY++) {
                  for (let checkX = x; checkX < x + item.w && checkX < item.x; checkX++) {
                    if (grid[checkX] && grid[checkX][checkY]) {
                      canMove = false;
                      break;
                    }
                  }
                  if (!canMove) break;
                }
                
                // If we can move it, do so
                if (canMove) {
                  // Remove from old position
                  for (let itemX = item.x; itemX < item.x + item.w; itemX++) {
                    for (let itemY = item.y; itemY < item.y + item.h; itemY++) {
                      if (grid[itemX]) grid[itemX][itemY] = false;
                    }
                  }
                  
                  // Update position
                  item.x = x;
                  madeChanges = true;
                  
                  // Add to new position
                  for (let itemX = item.x; itemX < item.x + item.w; itemX++) {
                    for (let itemY = item.y; itemY < item.y + item.h; itemY++) {
                      if (!grid[itemX]) grid[itemX] = [];
                      grid[itemX][itemY] = true;
                    }
                  }
                  
                  break; // Found an item to move
                }
              }
            }
          }
        }
      }
    }
    
    // Final vertical pass to ensure everything is as compact as possible
    newLayout.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    
    const finalBottomY = Array(cols).fill(0);
    for (let i = 0; i < newLayout.length; i++) {
      const item = newLayout[i];
      
      let minY = 0;
      for (let x = item.x; x < item.x + item.w; x++) {
        if (x < cols) {
          minY = Math.max(minY, finalBottomY[x] || 0);
        }
      }
      
      item.y = minY;
      
      for (let x = item.x; x < item.x + item.w; x++) {
        if (x < cols) {
          finalBottomY[x] = minY + item.h;
        }
      }
    }
    
    return newLayout;
  };

  // State for layout
  const [layout, setLayout] = useState(generateLayout(cols));

  // Update layout when columns or visible cards change
  useEffect(() => {
    setLayout(generateLayout(cols));
  }, [cols, cardOptions, generateLayout]);
  
  // Load saved layout from localStorage on initialization
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard_layout');
    if (savedLayout) {
      try {
        const { layout: storedLayout } = JSON.parse(savedLayout) as DashboardLayout;
        
        // Only use saved layout if it contains visible cards
        const visibleCardIds = cardOptions.filter(card => card.visible).map(card => card.id);
        const validSavedLayout = storedLayout.filter((item: RGL.Layout) => 
          visibleCardIds.includes(item.i)
        );
        
        // If we have valid layout items, use them
        if (validSavedLayout.length > 0) {
          // Merge with any new cards that might not be in the saved layout
          const existingIds = validSavedLayout.map((item: RGL.Layout) => item.i);
          const newLayoutItems = generateLayout(cols).filter(item => 
            !existingIds.includes(item.i)
          );
          
          // Combine existing and new items
          const mergedLayout = [...validSavedLayout, ...newLayoutItems];
          
          // Apply compaction to ensure proper layout
          const compactedLayout = compactLayout(mergedLayout, cols);
          setLayout(compactedLayout);
        }
      } catch (error) {
        console.error('Error loading saved dashboard layout:', error);
      }
    }
    // Only run this effect once on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCustomMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle card visibility and recompact layout
  const toggleCardVisibility = (id: string) => {
    setCardOptions(prevCards =>
      prevCards.map(card =>
        card.id === id ? { ...card, visible: !card.visible } : card
      )
    );
    
    // Create a new layout with the card toggled
    setTimeout(() => {
      // We use setTimeout to ensure cardOptions state has been updated
      const updatedCards = cardOptions.map(card => 
        card.id === id ? { ...card, visible: !card.visible } : card
      );
      const visibleCards = updatedCards.filter(card => card.visible);
      
      // Generate a new layout with only the visible cards
      const newLayout = layout.filter(item => 
        visibleCards.some(card => card.id === item.i)
      );
      
      // If we're adding a card, add it to the layout
      if (!cardOptions.find(card => card.id === id)?.visible) {
        const defaultPositions = generateLayout(cols);
        const newCardPosition = defaultPositions.find(item => item.i === id);
        if (newCardPosition) {
          newLayout.push(newCardPosition);
        }
      }
      
      // Apply compaction to ensure no gaps
      const compactedLayout = compactLayout(newLayout, cols);
      setLayout(compactedLayout);
      
      // Save the updated preferences to localStorage
      const visibleCardIds = updatedCards.filter(card => card.visible).map(card => card.id);
      localStorage.setItem('dashboard_preferences', JSON.stringify({
        columns: cols,
        visibleCards: visibleCardIds,
        timestamp: new Date().toISOString()
      }));
    }, 0);
  };

  const setColumnCount = (count: number) => {
    setCols(count);
    setShowCustomMenu(false);
  };

  // Function to apply a trader profile
  const applyTraderProfile = useCallback((profileId: TraderProfileType) => {
    // Find the requested profile
    const profile = TRADER_PROFILES.find(p => p.id === profileId);
    if (!profile) return;
    
    // Update active profile
    setActiveProfile(profileId);
    
    // Apply columns setting
    setCols(profile.columns);
    
    // Apply visible cards setting
    setCardOptions(prev => 
      prev.map(card => ({
        ...card,
        visible: profile.visibleCards.includes(card.id)
      }))
    );
    
    // Apply layout if provided, otherwise generate a new one
    if (profile.layout) {
      setLayout(profile.layout);
    } else {
      // We'll let the useEffect handle layout generation based on 
      // the new cols and cardOptions
    }
    
    // Save preferences
    const preferences: DashboardPrefsType = {
      traderProfile: profileId,
      columns: profile.columns,
      visibleCards: profile.visibleCards,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('dashboard_preferences', JSON.stringify(preferences));
    
    // Close preferences if open
    setShowPreferences(false);
  }, []);

  // Handle preferences save
  const handlePreferencesSave = (preferences: { 
    columns: number; 
    visibleCards: string[];
    traderProfile: TraderProfileType;
  }) => {
    // If selecting a predefined profile (not custom), apply it directly
    if (preferences.traderProfile !== 'custom') {
      applyTraderProfile(preferences.traderProfile);
      return;
    }
    
    // For custom profile, apply the specific settings
    setCols(preferences.columns);
    
    // Update card visibility
    setCardOptions(prev =>
      prev.map(card => ({
        ...card,
        visible: preferences.visibleCards.includes(card.id)
      }))
    );
    
    // Save custom profile's settings
    const customProfile = TRADER_PROFILES.find(p => p.id === 'custom');
    if (customProfile) {
      customProfile.columns = preferences.columns;
      customProfile.visibleCards = preferences.visibleCards;
      customProfile.layout = layout;
    }
    
    // Save preferences to localStorage
    const dashboardPrefs: DashboardPrefsType = {
      traderProfile: 'custom',
      columns: preferences.columns,
      visibleCards: preferences.visibleCards,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('dashboard_preferences', JSON.stringify(dashboardPrefs));
    
    // Close preferences modal
    setShowPreferences(false);
  };

  // Handle sending data to AI
  const handleSendToAI = (text: string, importedData: ImportedCardData | null, processInBackground: boolean) => {
    sendToAI(text, importedData, processInBackground)
      .then((requestId) => {
        if (!processInBackground) {
          // Navigate to chat tab
          handleTabChange('chat');
        } else {
          // Show temporary notification
          showToast('AI is processing your request in the background. You can view progress in the chat tab.');
          // If we're not already on the chat tab, highlight it to show there's activity
          if (activeTab !== 'chat') {
            // Visual indication that something is happening in chat tab
            const chatTabElement = document.getElementById('chat-tab');
            if (chatTabElement) {
              chatTabElement.classList.add('tab-notification');
              setTimeout(() => {
                chatTabElement.classList.remove('tab-notification');
              }, 3000);
            }
          }
        }
      })
      .catch(error => {
        console.error('Error sending to AI:', error);
        showToast('Failed to send request to AI', 'error');
      });
  };
  
  // Simple toast notification function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // A very simple toast implementation - in a real app, you'd use a proper toast system
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <ResponsiveGridLayout
            className="layout"
            layout={layout}
            cols={cols}
            rowHeight={160}
            margin={[10, 10]}
            containerPadding={[5, 5]}
            isDraggable={editMode}
            isResizable={editMode}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            compactType="vertical"
            verticalCompact={true}
            preventCollision={false}
            useCSSTransforms={true}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            resizeHandles={['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w']}
          >
            {cardOptions.filter(card => card.visible).map(card => (
              <div key={card.id} className="group relative">
                {editMode && (
                  <div className="absolute top-0 left-0 right-0 p-1 z-10 flex items-center justify-between bg-viridian/10 dark:bg-viridian/20 dark:border-t dark:border-l dark:border-r dark:border-viridian/70 rounded-t-lg drag-handle cursor-move">
                    <div className="text-xs font-medium text-viridian dark:text-viridian px-2">
                      {card.title}
                    </div>
                    <div className="flex items-center">
                      <button 
                        className="p-1 text-viridian hover:text-viridian/70 rounded"
                        onClick={() => toggleCardMinimize(card.id)}
                      >
                        {minimizedCards.includes(card.id) ? <Maximize size={14} /> : <Minimize size={14} />}
                      </button>
                      <button 
                        className="p-1 text-gray-500 hover:text-red-500 rounded"
                        onClick={() => toggleCardVisibility(card.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
                <div className={`h-full ${editMode ? 'pt-7' : ''} overflow-hidden`}>
                  <div className={`dashboard-card ${minimizedCards.includes(card.id) ? 'minimized' : ''}`}>
                    {!editMode && (
                      <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="p-1 text-viridian hover:bg-viridian/10 rounded-full"
                          onClick={() => toggleCardMinimize(card.id)}
                        >
                          {minimizedCards.includes(card.id) ? <Maximize size={14} /> : <Minimize size={14} />}
                        </button>
                      </div>
                    )}
                    {card.component}
                  </div>
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        );
      case 'charts':
        return <ChartsView />;
      case 'signals':
        return <SignalsView />;
      case 'chat':
        return <ChatView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <div>Tab not implemented</div>;
    }
  };

  // Render the profile selector in the dashboard header
  const renderProfileSelector = () => {
    const currentProfile = TRADER_PROFILES.find(p => p.id === activeProfile);
    
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowCustomMenu(!showCustomMenu)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-black/20 rounded-lg hover:bg-black/30 border border-gray-800 transition-colors"
        >
          <UserCircle2 size={16} className="text-viridian" />
          <span>{currentProfile?.name || 'Select Profile'}</span>
          <ChevronDown size={14} />
        </button>
        
        {showCustomMenu && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#0C1016] border border-gray-800 rounded-lg shadow-xl z-50 py-1.5 overflow-hidden">
            {TRADER_PROFILES.map(profile => (
              <button
                key={profile.id}
                onClick={() => {
                  applyTraderProfile(profile.id);
                  setShowCustomMenu(false);
                }}
                className={`w-full px-4 py-2.5 text-left hover:bg-gray-800/50 flex items-start gap-2 ${
                  activeProfile === profile.id ? 'bg-viridian/10' : ''
                }`}
              >
                <div className={`mt-0.5 ${activeProfile === profile.id ? 'text-viridian' : 'text-gray-400'}`}>
                  {activeProfile === profile.id ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
                <div>
                  <div className={`text-sm font-medium ${activeProfile === profile.id ? 'text-viridian' : 'text-white'}`}>
                    {profile.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{profile.description}</div>
                </div>
              </button>
            ))}
            
            <div className="px-4 py-2 border-t border-gray-800 mt-1">
              <button
                onClick={() => {
                  setShowPreferences(true);
                  setShowCustomMenu(false);
                }}
                className="text-sm text-viridian hover:underline"
              >
                Customize Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <CardDataProvider>
      <div className="min-h-screen bg-light-bg dark:bg-black text-light-text dark:text-dark-text p-0 transition-colors">
        {/* Top Navigation Bar */}
        <nav className="bg-light-card dark:bg-[#0C1016] border-b border-gray-200 dark:border-gray-800 py-2 px-4 sticky top-0 z-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold text-viridian">TradesXBT</div>
              <div className="overflow-x-auto">
                <NavBar activeTab={activeTab} onTabChange={handleTabChange} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Add AI Task Notifications */}
              <AITaskNotifications />

              {/* Panel Controls - Only show in chat tab */}
              {activeTab === 'chat' && (
                <div className="mr-2 px-3 py-1.5 bg-[#0C1016]/90 border border-viridian/30 rounded-full flex items-center gap-3">
                  <button
                    onClick={() => setLeftPanelEnabled(!leftPanelEnabled)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      leftPanelEnabled ? 'bg-viridian/20 text-viridian' : 'bg-gray-800/70 text-gray-400'
                    }`}
                    title={leftPanelEnabled ? "Hide Left Panel" : "Show Left Panel"}
                  >
                    <ChevronRight size={16} />
                  </button>
                  
                  <button
                    onClick={toggleBothPanels}
                    className="p-1.5 rounded-lg bg-viridian/20 text-viridian hover:bg-viridian/30 transition-colors"
                    title={leftPanelEnabled || rightPanelEnabled ? "Hide All Panels" : "Show All Panels"}
                  >
                    {leftPanelEnabled || rightPanelEnabled ? (
                      <X size={16} />
                    ) : (
                      <Layout size={16} />
                    )}
                  </button>
                  
                  <button
                    onClick={() => setRightPanelEnabled(!rightPanelEnabled)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      rightPanelEnabled ? 'bg-viridian/20 text-viridian' : 'bg-gray-800/70 text-gray-400'
                    }`}
                    title={rightPanelEnabled ? "Hide Right Panel" : "Show Right Panel"}
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              )}
              
              {/* Only show Customize button on dashboard tab */}
              {activeTab === 'dashboard' && (
                <div className="relative" ref={menuRef}>
                  {renderProfileSelector()}
                </div>
              )}
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-3 md:px-4 dashboard-container overflow-hidden" ref={contentRef}>
          {/* Content Area */}
          <div className="h-full smart-scroll">
            {renderTabContent()}
          </div>
        </div>

        {/* Dashboard Preferences Modal */}
        {showPreferences && (
          <DashboardPreferences
            onClose={() => setShowPreferences(false)}
            onSave={handlePreferencesSave}
            defaultColumns={cols}
            availableCards={availableCards}
            traderProfiles={TRADER_PROFILES}
            activeProfile={activeProfile}
          />
        )}
        
        {/* Add AI Floating Button - Only show when not in chat tab */}
        {activeTab !== 'chat' && <AIFloatingButton onSendToAI={handleSendToAI} />}
      </div>
    </CardDataProvider>
  );
};