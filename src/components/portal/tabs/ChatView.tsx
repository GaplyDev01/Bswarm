import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatWithAgent } from '../ChatWithAgent';
import { 
  Search, 
  Bot, 
  Settings, 
  ChevronRight, 
  ChevronLeft, 
  X,
  Loader2
} from 'lucide-react';
import { useAI } from '../../../hooks/useAI';
import { useToken } from '../../../context/TokenContext';
import { coinGeckoAPI } from '../../../services/api';
import { useDebounce } from '../../../hooks/useDebounce';
import type { CoinGeckoSearchCoin, TokenData } from '../../../types';
import { BackgroundTasksBreadcrumb } from '../../../components/BackgroundTasksBreadcrumb';
import { getBackgroundTasks } from '../../../services/aiService';

interface SidebarTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'analysis' | 'charts' | 'news' | 'alerts';
  visible: boolean;
}

type SentimentRating = 'BEARISH' | 'DYOR' | 'BULLISH' | 'APE IN' | null;

export const ChatView: React.FC = () => {
  const navigate = useNavigate();
  const { useDirectAnthropicAPI, setUseDirectAnthropicAPI, addUserMessage, chatHistory, directChatHistory } = useAI();
  const { setSelectedToken, selectTokenById } = useToken();
  
  // Panel visibility and sizing - set to false by default
  const [leftPanelEnabled, setLeftPanelEnabled] = useState<boolean>(false);
  const [rightPanelEnabled, setRightPanelEnabled] = useState<boolean>(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState<boolean>(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState<boolean>(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(260); // Default width in pixels
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(260); // Default width in pixels
  
  // Sentiment tracking
  const [currentSentiment, setCurrentSentiment] = useState<SentimentRating>(null);
  const [sentimentScore, setSentimentScore] = useState<number | null>(null);
  
  // Resizing state
  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false);
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);
  const resizeStartXRef = useRef<number>(0);
  const initialWidthRef = useRef<number>(0);
  
  // Other UI state
  const [showCustomizeModal, setShowCustomizeModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CoinGeckoSearchCoin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [tokenLoading, setTokenLoading] = useState<boolean>(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  
  // Empty sidebar tools array
  const [sidebarTools, setSidebarTools] = useState<SidebarTool[]>([]);
  
  // Map dashboard card IDs to chat tool IDs
  const dashboardToToolMap: { [key: string]: string } = {
    'priceChart': 'price-chart',
    'tradingView': 'trading-view',
    'technicalIndicators': 'indicators',
    'volumeProfile': 'volume-profile',
    'momentum': 'momentum',
    'marketDepth': 'market-depth',
    'orderFlow': 'order-flow',
    'liquidity': 'liquidity',
    'newsFeed': 'news-feed',
    'socialFeed': 'social-feed',
    'patternAlerts': 'pattern-alerts',
  };
  
  // Load tools visibility from dashboard preferences - keep this function but it won't do anything with empty sidebarTools
  useEffect(() => {
    const savedPreferences = localStorage.getItem('dashboard_preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        // No need to update sidebarTools since we're keeping it empty
      } catch (error) {
        console.error('Error loading dashboard preferences:', error);
      }
    }
  }, []);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Extract sentiment from AI responses
  useEffect(() => {
    const extractSentiment = () => {
      let messages;
      if (useDirectAnthropicAPI) {
        messages = directChatHistory;
      } else {
        messages = chatHistory;
      }
      
      if (!messages || messages.length === 0) return;
      
      // Get the latest assistant message
      let latestMessage;
      if (useDirectAnthropicAPI) {
        latestMessage = [...messages]
          .reverse()
          .find(msg => msg.role === 'assistant')?.content;
      } else {
        latestMessage = [...messages]
          .reverse()
          .find(msg => msg._getType && msg._getType() === 'ai')?.content;
      }
      
      if (!latestMessage) return;
      
      // Extract sentiment score using regex
      const scoreMatch = latestMessage.toString().match(/Sentiment Score: (\d+)\/100/i);
      if (scoreMatch && scoreMatch[1]) {
        const score = parseInt(scoreMatch[1]);
        setSentimentScore(score);
        
        // Determine sentiment rating
        if (score <= 35) {
          setCurrentSentiment('BEARISH');
        } else if (score <= 66) {
          setCurrentSentiment('DYOR');
        } else {
          setCurrentSentiment('BULLISH');
        }
        
        // Check for APE IN signal
        if (score > 65 && latestMessage.toString().includes('APE IN SIGNAL')) {
          setCurrentSentiment('APE IN');
        }
      }
    };
    
    extractSentiment();
  }, [chatHistory, directChatHistory, useDirectAnthropicAPI]);
  
  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedLeftEnabled = localStorage.getItem('leftPanelEnabled');
    const savedRightEnabled = localStorage.getItem('rightPanelEnabled');
    const savedLeftWidth = localStorage.getItem('leftPanelWidth');
    const savedRightWidth = localStorage.getItem('rightPanelWidth');
    
    if (savedLeftEnabled !== null) {
      setLeftPanelEnabled(savedLeftEnabled === 'true');
    }
    
    if (savedRightEnabled !== null) {
      setRightPanelEnabled(savedRightEnabled === 'true');
    }
    
    if (savedLeftWidth !== null) {
      const width = parseInt(savedLeftWidth);
      if (!isNaN(width) && width >= 200 && width <= 600) {
        setLeftPanelWidth(width);
      }
    }
    
    if (savedRightWidth !== null) {
      const width = parseInt(savedRightWidth);
      if (!isNaN(width) && width >= 200 && width <= 600) {
        setRightPanelWidth(width);
      }
    }
  }, []);
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('leftPanelEnabled', String(leftPanelEnabled));
    localStorage.setItem('rightPanelEnabled', String(rightPanelEnabled));
    localStorage.setItem('leftPanelWidth', String(leftPanelWidth));
    localStorage.setItem('rightPanelWidth', String(rightPanelWidth));
  }, [leftPanelEnabled, rightPanelEnabled, leftPanelWidth, rightPanelWidth]);
  
  // Handle left panel resize
  const startLeftResize = (e: React.MouseEvent) => {
    setIsResizingLeft(true);
    resizeStartXRef.current = e.clientX;
    initialWidthRef.current = leftPanelWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };
  
  // Handle right panel resize
  const startRightResize = (e: React.MouseEvent) => {
    setIsResizingRight(true);
    resizeStartXRef.current = e.clientX;
    initialWidthRef.current = rightPanelWidth;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };
  
  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const delta = e.clientX - resizeStartXRef.current;
        const newWidth = Math.max(200, Math.min(600, initialWidthRef.current + delta));
        setLeftPanelWidth(newWidth);
      } else if (isResizingRight) {
        const delta = resizeStartXRef.current - e.clientX;
        const newWidth = Math.max(200, Math.min(600, initialWidthRef.current + delta));
        setRightPanelWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      if (isResizingLeft || isResizingRight) {
        setIsResizingLeft(false);
        setIsResizingRight(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };
    
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);
  
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

  useEffect(() => {
    const searchCoins = async () => {
      if (!debouncedSearchTerm) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const searchData = await coinGeckoAPI.searchCoins(debouncedSearchTerm);
        setSearchResults(searchData.coins.slice(0, 6));
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search tokens');
      } finally {
        setLoading(false);
      }
    };
    
    searchCoins();
  }, [debouncedSearchTerm]);

  const toggleToolVisibility = (toolId: string) => {
    // Get the dashboard preferences
    const savedPreferences = localStorage.getItem('dashboard_preferences');
    let dashboardVisibleCards: string[] = [];
    
    // Parse dashboard preferences if they exist
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        if (preferences.visibleCards) {
          dashboardVisibleCards = preferences.visibleCards;
        }
      } catch (error) {
        console.error('Error parsing dashboard preferences:', error);
      }
    }
    
    // Find the corresponding dashboard card ID for this tool
    const dashboardCardId = Object.keys(dashboardToToolMap).find(
      key => dashboardToToolMap[key] === toolId
    );
    
    setSidebarTools(prev => 
      prev.map(tool => {
        if (tool.id === toolId) {
          // If the tool is currently visible, we can always turn it off
          if (tool.visible) {
            return { ...tool, visible: false };
          } 
          // If trying to turn it on, check if it's enabled in the dashboard
          else {
            // If there's no corresponding dashboard card, allow toggle
            if (!dashboardCardId) {
              return { ...tool, visible: true };
            }
            
            // Only allow enabling if it's visible in the dashboard
            return { 
              ...tool, 
              visible: dashboardVisibleCards.includes(dashboardCardId)
            };
          }
        }
        return tool;
      })
    );
  };

  const handleTitleClick = () => {
    navigate('/portal?tab=dashboard');
  };

  // Render sentiment indicator with neon effect
  const renderSentimentIndicator = useCallback(() => {
    if (!currentSentiment || !sentimentScore) return null;
    
    let bgColor = '';
    let textColor = '';
    let shadowColor = '';
    let emoji = '';
    
    switch(currentSentiment) {
      case 'BEARISH':
        bgColor = 'bg-red-600/20';
        textColor = 'text-red-500';
        shadowColor = 'rgba(239, 68, 68, 1)';
        emoji = '🔴';
        break;
      case 'DYOR':
        bgColor = 'bg-yellow-500/20';
        textColor = 'text-yellow-300';
        shadowColor = 'rgba(252, 211, 77, 1)';
        emoji = '🟡';
        break;
      case 'BULLISH':
        bgColor = 'bg-green-500/20';
        textColor = 'text-green-400';
        shadowColor = 'rgba(161, 206, 63, 1)';
        emoji = '🟢';
        break;
      case 'APE IN':
        bgColor = 'bg-purple-500/20';
        textColor = 'text-purple-300';
        shadowColor = 'rgba(168, 85, 247, 1)';
        emoji = '🚀';
        break;
    }
    
    return (
      <div 
        className={`px-4 py-2 rounded-full ${bgColor} flex items-center gap-2 ml-4 neon-sentiment-indicator`}
        style={{
          boxShadow: `0 0 10px ${shadowColor}, 0 0 20px ${shadowColor}`,
          border: `1px solid ${shadowColor}`,
          animation: 'neon-pulse 1.5s infinite alternate'
        }}
      >
        <span 
          className={`font-bold text-lg ${textColor}`} 
          style={{
            textShadow: `0 0 5px ${shadowColor}, 0 0 10px ${shadowColor}, 0 0 15px ${shadowColor}`,
          }}
        >
          {currentSentiment} {emoji}
        </span>
        <span 
          className={`text-sm ${textColor} opacity-90`}
          style={{
            textShadow: `0 0 5px ${shadowColor}`
          }}
        >
          {sentimentScore}/100
        </span>
      </div>
    );
  }, [currentSentiment, sentimentScore]);

  // Handle token selection and initiate AI conversation
  const handleTokenSelect = async (coin: CoinGeckoSearchCoin) => {
    try {
      setTokenLoading(true);
      
      // First fetch full token market data to get price and stats
      await selectTokenById(coin.id);
      
      // Fetch the market data directly to construct the AI message
      const marketData = await coinGeckoAPI.getMarketData([coin.id]);
      
      if (marketData && marketData.length > 0) {
        const token = marketData[0];
        
        // Update UI with token data
        setSelectedToken({
          id: token.id,
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          image: token.image,
          current_price: token.current_price || 0,
          market_cap: token.market_cap || 0,
          price_change_percentage_24h: token.price_change_percentage_24h || 0
        });
        
        // Format a detailed message for the AI with all available data
        const initialMessage = `Analyze ${token.name} (${token.symbol.toUpperCase()}) for me. 
Current price: $${token.current_price?.toLocaleString() || 'N/A'}
24h change: ${token.price_change_percentage_24h?.toFixed(2) || 'N/A'}%
Market cap: $${token.market_cap?.toLocaleString() || 'N/A'}
Volume (24h): $${token.total_volume?.toLocaleString() || 'N/A'}
Circulating supply: ${token.circulating_supply?.toLocaleString() || 'N/A'} ${token.symbol.toUpperCase()}
${token.ath ? `All-time high: $${token.ath.toLocaleString()}` : ''}
${token.atl ? `All-time low: $${token.atl.toLocaleString()}` : ''}

Please provide a detailed analysis including:
1. Current market sentiment based on 5min, 15min, and 30min volume and market cap data
2. Technical analysis with key indicators (RSI, MACD, moving averages)
3. Support and resistance levels
4. Potential trading opportunities and risks
5. Short-term price forecast
6. Momentum sentiment score (0-100) 
7. Your recommendation (BEARISH, DYOR, or BULLISH)`;
        
        // Send message to AI
        await addUserMessage(initialMessage);
      } else {
        // Fallback if we couldn't get market data
        const message = `Analyze ${coin.name} (${coin.symbol.toUpperCase()}) for me. What's your assessment of this token and its current market conditions?`;
        await addUserMessage(message);
      }
      
      // Clear search
      setSearchTerm('');
      setSearchResults([]);
      setShowResults(false);
      
    } catch (err) {
      console.error('Error fetching token details:', err);
      // Even on error, still try to initiate a chat about the token with basic info
      const fallbackMessage = `Analyze ${coin.name} (${coin.symbol.toUpperCase()}) for me. What can you tell me about this token?`;
      await addUserMessage(fallbackMessage);
    } finally {
      setTokenLoading(false);
    }
  };

  // Handle clicks outside the customize modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCustomizeModal(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setShowSettingsModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSideTools = (side: 'left' | 'right') => {
    // Always return an empty array since we're not using any tools
    return [];
  };

  // Render the appropriate tool component based on the tool id
  const renderToolComponent = (toolId: string) => {
    return <div className="text-gray-400 text-center py-4">No tools available</div>;
  };

  // Render an empty tool panel
  const renderToolPanel = (side: 'left' | 'right') => {
    const title = side === 'left' ? 'Trading Tools' : 'News & Alerts';
    
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-viridian/20">
          <h3 className="text-lg font-bold text-viridian">{title}</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => side === 'left' ? setLeftPanelCollapsed(true) : setRightPanelCollapsed(true)}
              className="p-2 rounded-lg hover:bg-viridian/10 text-viridian"
              title={side === 'left' ? "Collapse Left Panel" : "Collapse Right Panel"}
            >
              {side === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center p-6 text-gray-400">
            <p>No tools available</p>
          </div>
        </div>
      </div>
    );
  };
  
  // Define max panel constraints - ensures there's a minimum viable space for the chat
  const minChatWidth = 400; // Minimum width for the chat area
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const maxLeftWidth = containerWidth - rightPanelWidth - minChatWidth;
  const maxRightWidth = containerWidth - leftPanelWidth - minChatWidth;
  
  // Ensure panel sizes are valid
  const constrainedLeftWidth = Math.min(leftPanelWidth, maxLeftWidth);
  const constrainedRightWidth = Math.min(rightPanelWidth, maxRightWidth);

  // Add these state variables for managing chat navigation
  const [highlightedMessageIndex, setHighlightedMessageIndex] = useState<number | null>(null);
  const [needsScroll, setNeedsScroll] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Add this function to handle viewing task in chat
  const handleViewTaskInChat = (taskId: string) => {
    // Find the task to get its text
    const backgroundTasks = getBackgroundTasks();
    const task = backgroundTasks.find(t => t.id === taskId);
    
    if (!task || !task.addedToChatHistory) return;
    
    // Find the message in chat history that matches the task
    let messageIndex = -1;
    
    if (useDirectAnthropicAPI) {
      // For direct API, find in directChatHistory
      for (let i = 0; i < directChatHistory.length; i++) {
        if (directChatHistory[i].role === 'user' && 
            directChatHistory[i].content.includes(task.text.substring(0, 20))) {
          messageIndex = i;
          break;
        }
      }
    } else {
      // For LangChain, find in chatHistory
      for (let i = 0; i < chatHistory.length; i++) {
        const content = chatHistory[i].content as string;
        if (chatHistory[i]._getType() === 'human' && 
            content.includes(task.text.substring(0, 20))) {
          messageIndex = i;
          break;
        }
      }
    }
    
    if (messageIndex >= 0) {
      // Set the highlighted message index
      setHighlightedMessageIndex(messageIndex);
      setNeedsScroll(true);
      
      // Close the breadcrumb
      const event = new CustomEvent('ai_task_event', {
        detail: { type: 'breadcrumb_collapse', payload: {} }
      });
      window.dispatchEvent(event);
    }
  };
  
  // Add an effect to scroll to highlighted message
  useEffect(() => {
    if (needsScroll && highlightedMessageIndex !== null && chatContainerRef.current) {
      // Find the message element by index
      // This assumes ChatWithAgent has refs or data-attributes for messages
      const messageElements = chatContainerRef.current.querySelectorAll('.message-box');
      if (messageElements && messageElements[highlightedMessageIndex]) {
        messageElements[highlightedMessageIndex].scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        
        // Add a highlight class
        messageElements[highlightedMessageIndex].classList.add('highlighted-message');
        
        // Remove the highlight after 3 seconds
        setTimeout(() => {
          if (messageElements[highlightedMessageIndex]) {
            messageElements[highlightedMessageIndex].classList.remove('highlighted-message');
          }
        }, 3000);
        
        setNeedsScroll(false);
      }
    }
  }, [needsScroll, highlightedMessageIndex]);

  return (
    <div className="absolute inset-0 flex overflow-hidden select-none">
      {/* Left Panel */}
      <div 
        className={`h-full transition-all duration-300 border-r border-viridian/20 bg-[#0C1016] flex-shrink-0`}
        style={{ 
          width: leftPanelEnabled ? (leftPanelCollapsed ? 0 : constrainedLeftWidth) : 0,
          minWidth: leftPanelEnabled ? (leftPanelCollapsed ? 0 : 200) : 0,
          maxWidth: leftPanelEnabled ? 600 : 0
        }}
      >
        {leftPanelEnabled && !leftPanelCollapsed && renderToolPanel('left')}
        
        {/* Resize Handle */}
        {leftPanelEnabled && !leftPanelCollapsed && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-transparent hover:bg-viridian/30 cursor-ew-resize z-20"
            style={{ left: constrainedLeftWidth }}
            onMouseDown={startLeftResize}
          />
        )}
        
        {/* Collapse/Expand Button */}
        <button 
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          className={`absolute top-1/2 transform -translate-y-1/2 z-30 w-8 h-12 rounded-r-full bg-viridian/30 border border-viridian/60 flex items-center justify-center transition-colors hover:bg-viridian/40`}
          style={{ 
            left: leftPanelCollapsed ? 0 : constrainedLeftWidth - 4,
            opacity: leftPanelEnabled ? 1 : 0,
            pointerEvents: leftPanelEnabled ? 'auto' : 'none'
          }}
        >
          {leftPanelCollapsed ? (
            <ChevronRight size={18} className="text-viridian" />
          ) : (
            <ChevronLeft size={18} className="text-viridian" />
          )}
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0 border-b border-viridian/20 p-4 flex items-center justify-between bg-[#0C1016]">
          <div className="flex items-center">
            <button 
              onClick={handleTitleClick}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Bot size={24} className="text-viridian" />
              <h2 className="text-xl font-bold text-viridian">TradesXBT AI</h2>
            </button>
            
            {/* Sentiment Indicator */}
            {renderSentimentIndicator()}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tokens..."
                className="w-64 py-2 px-4 rounded-lg bg-black/30 border border-viridian/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-viridian/70"
                disabled={tokenLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-viridian">
                {loading || tokenLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
              </div>
              
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0C1016] border border-viridian/40 rounded-lg shadow-lg overflow-hidden z-50">
                  {searchResults.map((coin) => (
                    <button
                      key={coin.id}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-viridian/10 text-left border-b border-viridian/20 last:border-0"
                      onClick={() => handleTokenSelect(coin)}
                      disabled={tokenLoading}
                    >
                      <img src={coin.large} alt={coin.name} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="text-white font-medium">{coin.symbol.toUpperCase()}</div>
                        <div className="text-sm text-gray-400">{coin.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-lg bg-viridian/10 text-viridian hover:bg-viridian/20 transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative">
          <ChatWithAgent ref={chatContainerRef} />
          
          <BackgroundTasksBreadcrumb 
            onViewInChat={handleViewTaskInChat}
          />
        </div>
      </div>

      {/* Right Panel */}
      <div 
        className={`h-full transition-all duration-300 border-l border-viridian/20 bg-[#0C1016] flex-shrink-0`}
        style={{ 
          width: rightPanelEnabled ? (rightPanelCollapsed ? 0 : constrainedRightWidth) : 0,
          minWidth: rightPanelEnabled ? (rightPanelCollapsed ? 0 : 200) : 0,
          maxWidth: rightPanelEnabled ? 600 : 0
        }}
      >
        {rightPanelEnabled && !rightPanelCollapsed && renderToolPanel('right')}
        
        {/* Resize Handle */}
        {rightPanelEnabled && !rightPanelCollapsed && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-transparent hover:bg-viridian/30 cursor-ew-resize z-20"
            style={{ right: constrainedRightWidth }}
            onMouseDown={startRightResize}
          />
        )}
        
        {/* Collapse/Expand Button */}
        <button 
          onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          className={`absolute top-1/2 transform -translate-y-1/2 z-30 w-8 h-12 rounded-l-full bg-viridian/30 border border-viridian/60 flex items-center justify-center transition-colors hover:bg-viridian/40`}
          style={{ 
            right: rightPanelCollapsed ? 0 : constrainedRightWidth - 4,
            opacity: rightPanelEnabled ? 1 : 0,
            pointerEvents: rightPanelEnabled ? 'auto' : 'none'
          }}
        >
          {rightPanelCollapsed ? (
            <ChevronLeft size={18} className="text-viridian" />
          ) : (
            <ChevronRight size={18} className="text-viridian" />
          )}
        </button>
      </div>

      {/* Customize Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div ref={menuRef} className="bg-[#0C1016] border border-viridian/30 rounded-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Customize Trading Tools</h3>
              <button 
                onClick={() => setShowCustomizeModal(false)}
                className="p-2 hover:bg-viridian/10 rounded-lg"
              >
                <X size={20} className="text-viridian" />
              </button>
            </div>
            
            {/* Dashboard integration notice */}
            <div className="mb-6 p-3 rounded-lg bg-viridian/10 border border-viridian/30">
              <p className="text-sm text-gray-300">
                <span className="text-viridian font-medium">Note:</span> Tools must first be enabled in the dashboard before they can be used in the chat interface. 
                You can enable tools by visiting the <button 
                  onClick={() => {
                    setShowCustomizeModal(false);
                    navigate('/portal?tab=dashboard');
                  }}
                  className="text-viridian underline hover:text-viridian/80"
                >Dashboard</button> and opening preferences.
              </p>
            </div>

            <div className="space-y-6">
              {['analysis', 'charts', 'news', 'alerts'].map(category => (
                <div key={category} className="space-y-3">
                  <h4 className="text-white font-medium capitalize">{category}</h4>
                  <div className="space-y-2">
                    {sidebarTools
                      .filter(tool => tool.category === category)
                      .map(tool => {
                        // Check if this tool is enabled in dashboard
                        const dashboardCardId = Object.keys(dashboardToToolMap).find(
                          key => dashboardToToolMap[key] === tool.id
                        );
                        
                        // Get dashboard preferences
                        const savedPreferences = localStorage.getItem('dashboard_preferences');
                        let isEnabledInDashboard = !dashboardCardId; // If no mapping, assume it's enabled
                        
                        if (dashboardCardId && savedPreferences) {
                          try {
                            const preferences = JSON.parse(savedPreferences);
                            if (preferences.visibleCards) {
                              isEnabledInDashboard = preferences.visibleCards.includes(dashboardCardId);
                            }
                          } catch (error) {
                            console.error('Error parsing preferences:', error);
                          }
                        }
                        
                        return (
                          <div
                            key={tool.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              !isEnabledInDashboard && !tool.visible
                                ? 'bg-black/60 border-gray-800 opacity-70'
                                : 'bg-black/30 border-viridian/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={isEnabledInDashboard ? "text-viridian" : "text-gray-500"}>
                                {tool.icon}
                              </span>
                              <div>
                                <span className="text-white">{tool.name}</span>
                                {!isEnabledInDashboard && !tool.visible && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Enable this tool in Dashboard preferences first
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleToolVisibility(tool.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isEnabledInDashboard || tool.visible
                                  ? 'bg-viridian/10 hover:bg-viridian/20'
                                  : 'bg-gray-800/50 cursor-not-allowed'
                              }`}
                              title={!isEnabledInDashboard && !tool.visible 
                                ? "Enable this tool in Dashboard preferences first" 
                                : tool.visible 
                                  ? "Hide tool" 
                                  : "Show tool"
                              }
                            >
                              {tool.visible ? (
                                <X size={18} className="text-viridian" />
                              ) : (
                                <X size={18} className="text-gray-400" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div ref={settingsMenuRef} className="bg-[#0C1016] border border-viridian/30 rounded-xl p-6 w-[480px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">AI Settings</h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-viridian/10 rounded-lg"
              >
                <X size={20} className="text-viridian" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-white font-medium">API Provider</h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setUseDirectAnthropicAPI(true)}
                    className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                      useDirectAnthropicAPI 
                        ? 'bg-viridian/20 border-2 border-viridian text-viridian'
                        : 'bg-black/30 border border-gray-700 text-gray-400'
                    }`}
                  >
                    Anthropic Claude
                  </button>
                  
                  <button
                    onClick={() => setUseDirectAnthropicAPI(false)}
                    className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                      !useDirectAnthropicAPI 
                        ? 'bg-viridian/20 border-2 border-viridian text-viridian'
                        : 'bg-black/30 border border-gray-700 text-gray-400'
                    }`}
                  >
                    LangChain
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-white font-medium">Panel Settings</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Left Panel</span>
                    <button 
                      onClick={() => setLeftPanelEnabled(!leftPanelEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        leftPanelEnabled ? 'bg-viridian/80' : 'bg-gray-700'
                      }`}
                    >
                      <span 
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          leftPanelEnabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Right Panel</span>
                    <button 
                      onClick={() => setRightPanelEnabled(!rightPanelEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        rightPanelEnabled ? 'bg-viridian/80' : 'bg-gray-700'
                      }`}
                    >
                      <span 
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          rightPanelEnabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3 bg-viridian hover:bg-viridian/90 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};