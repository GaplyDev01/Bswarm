import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RGL, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { Brain, Settings, Grid3X3, Grid2X2, ChevronDown, CheckSquare, Square, LayoutGrid, Eye, EyeOff, Move, Bell, Star, X, User, ChevronRight, ChevronLeft, Layout, MessageSquare, History, Maximize, Minimize } from 'lucide-react';

import { TokenSearch } from './TokenSearch';
import { Portfolio } from './Portfolio';
import { TradingSignals } from './TradingSignals';
import { ProfileCard } from './ProfileCard';
import { InvestmentCard } from './InvestmentCard';
import { SignalsCard } from './SignalsCard';
import { TokenDetailsCard } from './TokenDetailsCard';
import { SocialCard } from './SocialCard';
import { PerformanceCard } from './PerformanceCard';
import { NavBar } from './NavBar';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { UserMenu } from './UserMenu';
import { ChatHistoryTool } from './tools/ChatHistoryTool';
import { DashboardPreferences } from './DashboardPreferences';

// Tab views
import { ChartsView } from './tabs/ChartsView';
import { PortfolioView } from './tabs/PortfolioView';
import { ProfileView } from './tabs/ProfileView';
import { SignalsView } from './tabs/SignalsView';
import { ChatView } from './tabs/ChatView';

// Apply width provider to the grid layout
const ResponsiveGridLayout = WidthProvider(RGL);

// Define the card options
interface CardOption {
  id: string;
  title: string;
  component: React.ReactNode;
  visible: boolean;
}

export const Dashboard: React.FC = () => {
  const { isDark } = useTheme();
  const [cols, setCols] = useState(3);
  const [editMode, setEditMode] = useState(false);
  const [showCustomMenu, setShowCustomMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  
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
  const getActiveTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return tab || 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/portal?tab=${tab}`, { replace: true });
  };
  
  // Update activeTab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location]);
  
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
  }, []);
  
  // Define available cards
  const availableCards = [
    {
      id: 'profile',
      title: 'AI Agent Profile',
      description: 'View and interact with your AI trading assistant'
    },
    {
      id: 'investment',
      title: 'Investment Portfolio',
      description: 'Track your investments and portfolio performance'
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
      id: 'performance',
      title: 'Performance Analytics',
      description: 'Track trading performance and returns'
    },
    {
      id: 'chatHistory',
      title: 'Chat History',
      description: 'View your conversation history with the AI'
    }
  ];
  
  // Define all available cards
  const [cardOptions, setCardOptions] = useState<CardOption[]>([
    { id: 'profile', title: 'Agent Profile', component: <ProfileCard />, visible: true },
    { id: 'investment', title: 'Investment Portfolio', component: <InvestmentCard />, visible: true },
    { id: 'signals', title: 'Trading Signals', component: <SignalsCard />, visible: true },
    { id: 'tokenSearch', title: 'Token Search', component: <TokenSearch />, visible: true },
    { id: 'tokenDetails', title: 'Token Details', component: <TokenDetailsCard />, visible: true },
    { id: 'social', title: 'Social Presence', component: <SocialCard />, visible: true },
    { id: 'performance', title: 'Performance Analytics', component: <PerformanceCard />, visible: true },
    { id: 'chatHistory', title: 'Chat History', component: <ChatHistoryTool />, visible: true },
  ]);

  // Function to toggle card minimization
  const toggleCardMinimize = (cardId: string) => {
    setMinimizedCards(prev => 
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Generate layout based on visible cards
  const generateLayout = (columns: number) => {
    const visibleCards = cardOptions.filter(card => card.visible);
    let layout: RGL.Layout[] = [];
    
    if (columns === 3) {
      // 3-column layout (default)
      layout = [
        { i: 'profile', x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'investment', x: 1, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'signals', x: 2, y: 0, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'tokenSearch', x: 0, y: 2, w: 2, h: 2, minW: 1 },
        { i: 'tokenDetails', x: 2, y: 2, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'social', x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: 1 },
        { i: 'performance', x: 1, y: 4, w: 1, h: 2, minW: 1 },
        { i: 'chatHistory', x: 2, y: 4, w: 1, h: 2, minW: 1 },
      ].filter(item => visibleCards.some(card => card.id === item.i));
    } else if (columns === 2) {
      // 2-column layout
      let x = 0;
      let y = 0;
      
      visibleCards.forEach((card, index) => {
        const isWide = ['tokenSearch'].includes(card.id);
        const width = isWide && x < 1 ? 2 : 1;
        
        if (isWide && x === 1) {
          x = 0;
          y += 2;
        }
        
        layout.push({
          i: card.id,
          x,
          y,
          w: width,
          h: 2,
          minW: 1,
          maxW: width,
        });
        
        if (width === 2 || x === 1) {
          x = 0;
          y += 2;
        } else {
          x += 1;
        }
      });
    } else if (columns === 1) {
      // Single column layout for mobile
      visibleCards.forEach((card, index) => {
        layout.push({
          i: card.id,
          x: 0,
          y: index * 2,
          w: 1,
          h: 2,
          minW: 1,
          maxW: 1,
        });
      });
    }
    
    return layout;
  };

  // State for layout
  const [layout, setLayout] = useState(generateLayout(cols));

  // Update layout when columns or visible cards change
  useEffect(() => {
    setLayout(generateLayout(cols));
  }, [cols, cardOptions]);

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

  const handleLayoutChange = (newLayout: RGL.Layout[]) => {
    setLayout(newLayout);
  };

  const toggleCardVisibility = (id: string) => {
    setCardOptions(prevCards =>
      prevCards.map(card =>
        card.id === id ? { ...card, visible: !card.visible } : card
      )
    );
  };

  const setColumnCount = (count: number) => {
    setCols(count);
    setShowCustomMenu(false);
  };

  // Function to handle saving dashboard preferences
  const handlePreferencesSave = (preferences: { columns: number; visibleCards: string[] }) => {
    setCols(preferences.columns);
    setCardOptions(prev => 
      prev.map(card => ({
        ...card,
        visible: preferences.visibleCards.includes(card.id)
      }))
    );
    
    // Save preferences to localStorage
    localStorage.setItem('dashboard_preferences', JSON.stringify({
      columns: preferences.columns,
      visibleCards: preferences.visibleCards,
      timestamp: new Date().toISOString()
    }));
    
    setShowPreferences(false);
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
            margin={[12, 12]}
            containerPadding={[0, 0]}
            isDraggable={editMode}
            isResizable={editMode}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            compactType="vertical"
            preventCollision={false}
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
      case 'portfolio':
        return <PortfolioView />;
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

  return (
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
                <button 
                  onClick={() => setShowCustomMenu(!showCustomMenu)}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors bg-[#141c26] border border-viridian/40 text-viridian flex items-center gap-1.5"
                >
                  <LayoutGrid size={16} />
                  Customize
                  <ChevronDown size={14} className={`transition-transform ${showCustomMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showCustomMenu && (
                  <div className="dropdown-menu">
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200">
                      Dashboard Layout
                    </div>
                    <div className="p-2">
                      <div className="flex justify-between gap-2 mb-2">
                        <button 
                          onClick={() => setColumnCount(1)} 
                          className={`flex-1 p-1.5 rounded ${cols === 1 ? 'bg-viridian/20 dark:bg-viridian/30 text-viridian dark:text-viridian dark:border dark:border-viridian/70' : 'bg-gray-100 dark:bg-dark-bg dark:border dark:border-gray-700'}`}
                        >
                          <div className="flex justify-center">
                            <div className="w-5 h-5 border-2 border-current rounded"></div>
                          </div>
                          <div className="text-xs mt-1 text-center">1 Column</div>
                        </button>
                        <button 
                          onClick={() => setColumnCount(2)} 
                          className={`flex-1 p-1.5 rounded ${cols === 2 ? 'bg-viridian/20 dark:bg-viridian/30 text-viridian dark:text-viridian dark:border dark:border-viridian/70' : 'bg-gray-100 dark:bg-dark-bg dark:border dark:border-gray-700'}`}
                        >
                          <div className="flex justify-center gap-1">
                            <div className="w-2.5 h-5 border-2 border-current rounded"></div>
                            <div className="w-2.5 h-5 border-2 border-current rounded"></div>
                          </div>
                          <div className="text-xs mt-1 text-center">2 Columns</div>
                        </button>
                        <button 
                          onClick={() => setColumnCount(3)} 
                          className={`flex-1 p-1.5 rounded ${cols === 3 ? 'bg-viridian/20 dark:bg-viridian/30 text-viridian dark:text-viridian dark:border dark:border-viridian/70' : 'bg-gray-100 dark:bg-dark-bg dark:border dark:border-gray-700'}`}
                        >
                          <div className="flex justify-center gap-1">
                            <div className="w-1.5 h-5 border-2 border-current rounded"></div>
                            <div className="w-1.5 h-5 border-2 border-current rounded"></div>
                            <div className="w-1.5 h-5 border-2 border-current rounded"></div>
                          </div>
                          <div className="text-xs mt-1 text-center">3 Columns</div>
                        </button>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200 dark:border-viridian/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium">Visible Cards</div>
                          <button 
                            onClick={() => setEditMode(!editMode)} 
                            className={`px-2 py-0.5 text-xs rounded ${editMode ? 'bg-viridian text-white dark:border dark:border-viridian' : 'bg-gray-200 dark:bg-dark-bg dark:border dark:border-gray-700'}`}
                          >
                            {editMode ? 'Save Layout' : 'Edit Layout'}
                          </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto smart-scroll pr-1">
                          {cardOptions.map(card => (
                            <div key={card.id} className="dropdown-item" onClick={() => toggleCardVisibility(card.id)}>
                              {card.visible ? <CheckSquare size={14} className="mr-2 text-viridian" /> : <Square size={14} className="mr-2" />}
                              <span>{card.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
          onSave={handlePreferencesSave}
          onClose={() => setShowPreferences(false)}
          defaultColumns={cols}
          availableCards={availableCards}
        />
      )}
    </div>
  );
};