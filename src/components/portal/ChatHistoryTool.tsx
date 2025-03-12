import React, { useEffect, useState } from 'react';
import { useAI } from '../../hooks/useAI';
import { useSupabase } from '../../context/SupabaseContext';
import { MessageSquare, BarChart2, ChevronRight, Calendar, ArrowUpRight, RefreshCw } from 'lucide-react';
import { ChatHistoryItem } from '../../types/supabase';
import { format } from 'date-fns';

interface GroupedChatData {
  date: string;
  count: number;
  sentimentCounts: {
    BULLISH: number;
    BEARISH: number;
    NEUTRAL: number;
    'APE IN': number;
  };
}

export const ChatHistoryTool: React.FC = () => {
  const { storedChatHistory, fetchChatHistory } = useAI();
  const { user } = useSupabase();
  const [recentMessages, setRecentMessages] = useState<ChatHistoryItem[]>([]);
  const [sentimentStats, setSentimentStats] = useState<{
    BULLISH: number;
    BEARISH: number;
    NEUTRAL: number;
    'APE IN': number;
  }>({
    BULLISH: 0,
    BEARISH: 0,
    NEUTRAL: 0,
    'APE IN': 0
  });
  const [chatActivity, setChatActivity] = useState<GroupedChatData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      setLoading(true);
      setError(null);
      fetchChatHistory()
        .catch(err => {
          console.error('Error loading chat history:', err);
          setError('Could not load chat history');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, fetchChatHistory]);
  
  // Group messages by date for activity chart
  useEffect(() => {
    try {
      // Get the 5 most recent assistant messages
      const assistantMessages = storedChatHistory
        .filter(msg => msg && msg.role === 'assistant')
        .slice(0, 5);
      
      setRecentMessages(assistantMessages);
      
      // Calculate sentiment stats
      const stats = {
        BULLISH: 0,
        BEARISH: 0,
        NEUTRAL: 0,
        'APE IN': 0
      };
      
      storedChatHistory.forEach(msg => {
        if (msg && msg.role === 'assistant' && msg.sentiment_type) {
          stats[msg.sentiment_type as keyof typeof stats]++;
        }
      });
      
      setSentimentStats(stats);
      
      // Group messages by date for activity chart
      const messagesByDate: Record<string, GroupedChatData> = {};
      
      storedChatHistory.forEach(msg => {
        if (!msg || !msg.created_at) return;
        
        try {
          const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
          
          if (!messagesByDate[date]) {
            messagesByDate[date] = {
              date,
              count: 0,
              sentimentCounts: {
                BULLISH: 0,
                BEARISH: 0,
                NEUTRAL: 0,
                'APE IN': 0
              }
            };
          }
          
          messagesByDate[date].count++;
          
          if (msg.role === 'assistant' && msg.sentiment_type) {
            messagesByDate[date].sentimentCounts[msg.sentiment_type as keyof typeof stats]++;
          }
        } catch (error) {
          console.error('Error processing chat message date:', error);
        }
      });
      
      // Convert to array and sort by date
      const activityData = Object.values(messagesByDate)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7); // Get the last 7 days
      
      setChatActivity(activityData);
    } catch (err) {
      console.error('Error processing chat history:', err);
      // Don't set error state here to avoid breaking the UI
    }
  }, [storedChatHistory]);
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const formatMessage = (message: string) => {
    if (!message) return '';
    if (message.length > 80) {
      return message.substring(0, 80) + '...';
    }
    return message;
  };
  
  const getBadgeColor = (type: string | null) => {
    switch (type) {
      case 'BULLISH':
        return 'bg-lime/20 text-lime';
      case 'BEARISH':
        return 'bg-red-500/20 text-red-500';
      case 'NEUTRAL':
      case 'DYOR':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'APE IN':
        return 'bg-viridian/20 text-viridian';
      default:
        return 'bg-gray-500/20 text-gray-500';
    }
  };
  
  const getTotalSentiments = () => {
    return sentimentStats.BULLISH + sentimentStats.BEARISH + sentimentStats.NEUTRAL + sentimentStats['APE IN'];
  };
  
  const getPercentage = (count: number) => {
    const total = getTotalSentiments();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };
  
  // Skeleton loaders for better UX during loading
  const SentimentSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="h-3 w-20 bg-gray-700 rounded"></div>
            <div className="h-3 w-10 bg-gray-700 rounded"></div>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full"></div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="h-3 w-20 bg-gray-700 rounded"></div>
            <div className="h-3 w-10 bg-gray-700 rounded"></div>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full"></div>
        </div>
        <div className="col-span-2 mt-1">
          <div className="flex justify-between items-center mb-1">
            <div className="h-3 w-24 bg-gray-700 rounded"></div>
            <div className="h-3 w-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const MessagesSkeleton = () => (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-2 rounded bg-gray-800 border border-gray-700">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-700"></div>
              <div className="h-3 w-24 bg-gray-700 rounded"></div>
            </div>
            <div className="h-3 w-14 bg-gray-700 rounded-full"></div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-gray-700 rounded w-full"></div>
            <div className="h-2 bg-gray-700 rounded w-5/6"></div>
            <div className="h-2 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="space-y-4 h-full overflow-y-auto pb-2">
      {/* Usage Stats */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">AI Chat History</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400">
            {loading ? 'Loading...' : `${storedChatHistory.length} messages`}
          </div>
          {loading && (
            <div className="w-4 h-4 border-2 border-viridian border-t-transparent rounded-full animate-spin"></div>
          )}
          {error && (
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchChatHistory()
                  .finally(() => setLoading(false));
              }}
              className="p-1 hover:bg-viridian/10 rounded-full text-viridian"
              title="Retry loading"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      </div>
      
      {/* Sentiment Overview */}
      <div className="bg-black/30 rounded-lg border border-viridian/30 p-3">
        <h3 className="text-xs font-medium text-gray-300 mb-2">Sentiment Analysis</h3>
        {loading ? (
          <SentimentSkeleton />
        ) : error ? (
          <div className="text-center py-1 text-xs text-red-400">
            Error loading sentiment data
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-green-400">Bullish</span>
                <span className="text-xs text-gray-400">{getPercentage(sentimentStats.BULLISH)}%</span>
              </div>
              <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${getPercentage(sentimentStats.BULLISH)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-red-400">Bearish</span>
                <span className="text-xs text-gray-400">{getPercentage(sentimentStats.BEARISH)}%</span>
              </div>
              <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${getPercentage(sentimentStats.BEARISH)}%` }}
                />
              </div>
            </div>
            
            <div className="col-span-2 mt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-viridian">Ape In Signals</span>
                <span className="text-xs text-gray-400">{sentimentStats['APE IN']}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Recent Insights */}
      <div className="bg-black/30 rounded-lg border border-viridian/30 p-3">
        <h3 className="text-xs font-medium text-gray-300 mb-2">Recent AI Insights</h3>
        
        {loading ? (
          <MessagesSkeleton />
        ) : error ? (
          <div className="text-center py-4 text-sm">
            <p className="text-red-400 mb-2">{error}</p>
            <button 
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchChatHistory()
                  .finally(() => setLoading(false));
              }}
              className="text-viridian hover:underline text-xs"
            >
              Try again
            </button>
          </div>
        ) : recentMessages.length > 0 ? (
          <div className="space-y-2">
            {recentMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="p-2 rounded bg-black/50 border border-viridian/20 text-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-viridian" />
                    <span className="text-gray-300">{formatDate(msg.created_at)}</span>
                  </div>
                  {msg.sentiment_type && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${getBadgeColor(msg.sentiment_type)}`}>
                      {msg.sentiment_type}
                    </span>
                  )}
                </div>
                <p className="text-gray-200">{formatMessage(msg.message)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-gray-400 text-xs">
            No chat history yet
          </div>
        )}
      </div>
      
      {/* Start a new chat button */}
      <button 
        className="w-full py-2 bg-viridian/20 hover:bg-viridian/30 text-viridian rounded-lg text-sm flex items-center justify-center gap-1.5 border border-viridian/40 transition-colors"
        onClick={() => {
          // Navigate to chat tab
          const event = new CustomEvent('navigate', { detail: { tab: 'chat' } });
          window.dispatchEvent(event);
        }}
      >
        <MessageSquare size={14} />
        Chat with AI
        <ArrowUpRight size={14} />
      </button>
    </div>
  );
};