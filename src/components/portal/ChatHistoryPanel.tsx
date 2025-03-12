import React, { useEffect, useState } from 'react';
import { X, MessageCircle, ArrowRight, MessageSquare, Search, Calendar, AlertCircle } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { format } from 'date-fns';
import { ChatHistoryItem } from '../../types/supabase';

interface ChatHistoryPanelProps {
  onClose: () => void;
}

interface GroupedMessages {
  date: string;
  messages: ChatHistoryItem[];
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({ onClose }) => {
  const { storedChatHistory, fetchChatHistory } = useAI();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedHistory, setGroupedHistory] = useState<GroupedMessages[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedMessages, setExpandedMessages] = useState<string[]>([]);
  
  // Load chat history when component mounts
  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);
  
  // Group messages by date
  useEffect(() => {
    const filtered = searchTerm 
      ? storedChatHistory.filter(msg => 
          msg.message.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : storedChatHistory;
    
    const groups: { [key: string]: ChatHistoryItem[] } = {};
    
    filtered.forEach(msg => {
      const date = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    
    // Convert to array and sort by date (most recent first)
    const groupedArray = Object.keys(groups).map(date => ({
      date,
      messages: groups[date]
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setGroupedHistory(groupedArray);
    
    // Expand the most recent group by default
    if (groupedArray.length > 0 && expandedGroups.length === 0) {
      setExpandedGroups([groupedArray[0].date]);
    }
  }, [storedChatHistory, searchTerm]);
  
  const toggleGroup = (date: string) => {
    setExpandedGroups(prev => 
      prev.includes(date) 
        ? prev.filter(d => d !== date) 
        : [...prev, date]
    );
  };
  
  const toggleMessage = (id: string) => {
    setExpandedMessages(prev => 
      prev.includes(id) 
        ? prev.filter(msgId => msgId !== id) 
        : [...prev, id]
    );
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };
  
  const formatMessage = (message: string, expanded: boolean) => {
    if (!expanded && message.length > 120) {
      return message.substring(0, 120) + '...';
    }
    return message;
  };
  
  const getSentimentBadge = (sentimentType: string | null, score: number | null) => {
    if (!sentimentType || !score) return null;
    
    let bgColor = '';
    let textColor = '';
    
    switch(sentimentType) {
      case 'BEARISH':
        bgColor = 'bg-red-500/20';
        textColor = 'text-red-500';
        break;
      case 'NEUTRAL':
      case 'DYOR':
        bgColor = 'bg-yellow-500/20';
        textColor = 'text-yellow-500';
        break;
      case 'BULLISH':
        bgColor = 'bg-lime/20';
        textColor = 'text-lime';
        break;
      case 'APE IN':
        bgColor = 'bg-viridian/20';
        textColor = 'text-viridian';
        break;
      default:
        return null;
    }
    
    return (
      <div className={`text-xs px-2 py-1 rounded-full ${bgColor} ${textColor} flex items-center gap-1`}>
        <AlertCircle size={10} />
        <span>{sentimentType} {score}/100</span>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-light-card dark:bg-dark-card border border-light-border/20 dark:border-viridian/30 rounded-lg w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden shadow-lg">
        <div className="flex justify-between items-center p-4 border-b border-light-border/10 dark:border-viridian/20">
          <h2 className="text-xl font-bold text-light-text dark:text-dark-text flex items-center gap-2">
            <MessageSquare size={20} className="text-viridian" />
            Chat History
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-viridian/10 rounded-lg text-light-subtext dark:text-dark-subtext"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-light-border/10 dark:border-viridian/20">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-light-bg/90 dark:bg-dark-bg/90 border border-light-border/20 dark:border-viridian/40 rounded-lg py-2 pl-10 pr-3 text-light-text dark:text-dark-text focus:outline-none focus:border-viridian/40 dark:focus:border-viridian/70"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-subtext dark:text-dark-subtext">
              <Search size={16} />
            </div>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {groupedHistory.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={48} className="mx-auto mb-4 text-light-subtext dark:text-dark-subtext opacity-30" />
              <p className="text-light-subtext dark:text-dark-subtext">
                {searchTerm ? 'No chat messages found for your search.' : 'No chat history found.'}
              </p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-viridian hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedHistory.map(group => (
                <div key={group.date} className="bg-light-bg/30 dark:bg-forest/20 rounded-lg">
                  <button 
                    onClick={() => toggleGroup(group.date)}
                    className="w-full flex justify-between items-center p-3 font-medium text-light-text dark:text-dark-text hover:bg-light-bg/50 dark:hover:bg-forest/30 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-viridian" />
                      <span>{formatDate(group.date)}</span>
                      <span className="text-xs text-light-subtext dark:text-dark-subtext">
                        ({group.messages.length} messages)
                      </span>
                    </div>
                    <ArrowRight 
                      size={16} 
                      className={`transform transition-transform ${expandedGroups.includes(group.date) ? 'rotate-90' : ''}`}
                    />
                  </button>
                  
                  {expandedGroups.includes(group.date) && (
                    <div className="p-2 space-y-2">
                      {group.messages.map(msg => (
                        <div 
                          key={msg.id}
                          className={`p-3 rounded-lg border ${
                            msg.role === 'user' 
                              ? 'border-light-border/10 dark:border-viridian/20 bg-light-bg/50 dark:bg-dark-bg/30' 
                              : 'border-light-border/20 dark:border-viridian/30 bg-light-bg/80 dark:bg-viridian/5'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                msg.role === 'user' 
                                  ? 'bg-viridian/20 text-viridian' 
                                  : 'bg-viridian text-white'
                              }`}>
                                {msg.role === 'user' ? 'U' : 'AI'}
                              </div>
                              <span className="font-medium text-sm text-light-text dark:text-dark-text">
                                {msg.role === 'user' ? 'You' : 'TradesXBT AI'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {msg.role === 'assistant' && getSentimentBadge(msg.sentiment_type, msg.sentiment_score)}
                              <span className="text-xs text-light-subtext dark:text-dark-subtext">
                                {formatTime(msg.created_at)}
                              </span>
                            </div>
                          </div>
                          
                          <div 
                            className={`text-sm ${
                              msg.role === 'user' 
                                ? 'text-light-text dark:text-dark-text' 
                                : 'text-light-text dark:text-dark-text'
                            }`}
                          >
                            {formatMessage(msg.message, expandedMessages.includes(msg.id))}
                          </div>
                          
                          {msg.message.length > 120 && (
                            <button 
                              onClick={() => toggleMessage(msg.id)}
                              className="mt-1 text-xs text-viridian hover:underline"
                            >
                              {expandedMessages.includes(msg.id) ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};