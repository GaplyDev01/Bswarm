import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createTradeAnalysis, chatWithAgent, directAnthropicChat } from '../services/ai/langchain';
import { chatHistoryApi } from '../services/api/supabaseApi';
import { useSupabase } from './SupabaseContext';
import { ChatHistoryItem } from '../types/supabase';

interface TradeSignal {
  action: 'BUY' | 'SELL';
  confidence: number;
  target: number;
  stopLoss: number;
  explanation: string;
  riskReward: number;
}

interface AIContextType {
  isLoading: boolean;
  error: string | null;
  chatHistory: Array<HumanMessage | AIMessage>;
  directChatHistory: Array<{role: string, content: string}>;
  storedChatHistory: ChatHistoryItem[];
  currentSessionId: string | null;
  addUserMessage: (message: string) => Promise<void>;
  clearChatHistory: () => void;
  generateTradeSignal: (tokenName: string, currentPrice: number, marketData: any) => Promise<TradeSignal | null>;
  fetchChatHistory: () => Promise<void>;
  useDirectAnthropicAPI: boolean;
  setUseDirectAnthropicAPI: (value: boolean) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<HumanMessage | AIMessage>>([]);
  const [directChatHistory, setDirectChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [storedChatHistory, setStoredChatHistory] = useState<ChatHistoryItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [useDirectAnthropicAPI, setUseDirectAnthropicAPI] = useState<boolean>(false);
  const [fetchInProgress, setFetchInProgress] = useState<boolean>(false);
  
  const { user } = useSupabase();

  // Initialize session ID when component mounts
  useEffect(() => {
    setCurrentSessionId(crypto.randomUUID());
  }, []);

  // Define fetchChatHistory using useCallback to prevent recreation on every render
  const fetchChatHistory = useCallback(async (): Promise<void> => {
    if (!user || fetchInProgress) return;
    
    setFetchInProgress(true);
    
    try {
      const history = await chatHistoryApi.getUserChatHistory(user.id, 100);
      setStoredChatHistory(history || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      // Don't throw - just log the error
    } finally {
      setFetchInProgress(false);
    }
  }, [user, fetchInProgress]);

  // Load chat history when user changes
  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
  }, [user, fetchChatHistory]);

  // Extract sentiment details from AI response
  const extractSentimentDetails = (content: string) => {
    // Extract sentiment score using regex
    const scoreMatch = content.toString().match(/Sentiment Score: (\d+)\/100/i);
    let sentimentScore = null;
    let sentimentType = null;
    
    if (scoreMatch && scoreMatch[1]) {
      sentimentScore = parseInt(scoreMatch[1]);
      
      // Determine sentiment type
      if (sentimentScore <= 35) {
        sentimentType = 'BEARISH';
      } else if (sentimentScore <= 66) {
        sentimentType = 'DYOR';
      } else {
        sentimentType = 'BULLISH';
      }
      
      // Check for APE IN signal
      if (sentimentScore > 65 && content.toString().includes('APE IN SIGNAL')) {
        sentimentType = 'APE IN';
      }
    }
    
    return { sentimentScore, sentimentType };
  };

  const addUserMessage = async (message: string) => {
    if (!user) {
      setError('You must be logged in to chat with the AI');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Save user message to database
      try {
        await chatHistoryApi.saveUserMessage(
          user.id, 
          message, 
          currentSessionId || undefined
        );
      } catch (saveError) {
        console.error('Error saving user message:', saveError);
        // Continue execution - don't let a DB save error stop the chat
      }
      
      if (useDirectAnthropicAPI) {
        // Use direct Anthropic API
        const newUserMessage = { role: 'user', content: message };
        setDirectChatHistory(prev => [...prev, newUserMessage]);
        
        let response;
        try {
          response = await directAnthropicChat(message, directChatHistory);
        } catch (apiError) {
          console.error('Error calling Anthropic API:', apiError);
          throw new Error('Failed to get a response from the AI. Please try again.');
        }
        
        const aiMessage = { role: 'assistant', content: response.content };
        setDirectChatHistory(prev => [...prev, aiMessage]);
        
        // Extract sentiment if present
        const { sentimentScore, sentimentType } = extractSentimentDetails(response.content);
        
        // Save assistant response to database
        try {
          await chatHistoryApi.saveAssistantMessage(
            user.id, 
            response.content, 
            currentSessionId || undefined,
            undefined,  // tokenId
            sentimentScore,
            sentimentType as any
          );
        } catch (saveError) {
          console.error('Error saving assistant message:', saveError);
          // Continue execution - don't let a DB save error stop the chat
        }
      } else {
        // Use LangChain integration
        // Add user message to chat history
        const userMessage = new HumanMessage(message);
        setChatHistory(prev => [...prev, userMessage]);
        
        // Get AI response
        let response;
        try {
          response = await chatWithAgent(message, chatHistory);
        } catch (apiError) {
          console.error('Error calling LangChain API:', apiError);
          throw new Error('Failed to get a response from the AI. Please try again.');
        }
        
        // Add AI response to chat history
        const aiMessage = new AIMessage(response);
        setChatHistory(prev => [...prev, aiMessage]);
        
        // Extract sentiment if present
        const { sentimentScore, sentimentType } = extractSentimentDetails(response);
        
        // Save assistant response to database
        try {
          await chatHistoryApi.saveAssistantMessage(
            user.id, 
            response, 
            currentSessionId || undefined,
            undefined,  // tokenId
            sentimentScore,
            sentimentType as any
          );
        } catch (saveError) {
          console.error('Error saving assistant message:', saveError);
          // Continue execution - don't let a DB save error stop the chat
        }
      }
      
      // Refresh stored chat history
      await fetchChatHistory();
    } catch (err) {
      setError('Failed to get a response. Please try again.');
      console.error('Error in chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setDirectChatHistory([]);
    // Generate a new session ID when clearing history
    setCurrentSessionId(crypto.randomUUID());
  };

  const generateTradeSignal = async (tokenName: string, currentPrice: number, marketData: any): Promise<TradeSignal | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const signal = await createTradeAnalysis(tokenName, currentPrice, marketData);
      return signal;
    } catch (err) {
      setError('Failed to generate trading signal');
      console.error('Error generating signal:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AIContext.Provider
      value={{
        isLoading,
        error,
        chatHistory,
        directChatHistory,
        storedChatHistory,
        currentSessionId,
        addUserMessage,
        clearChatHistory,
        generateTradeSignal,
        fetchChatHistory,
        useDirectAnthropicAPI,
        setUseDirectAnthropicAPI
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};