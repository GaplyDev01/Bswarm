import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { createTradeAnalysis, chatWithAgent, directAnthropicChat } from '../services/ai/langchain';
import { chatHistoryApi } from '../services/api/supabaseApi';
import { useSupabase } from './SupabaseContext';
import { ChatHistoryItem } from '../types/supabase';
import { registerAIContext, unregisterAIContext } from '../services/aiService';

// Define sentiment type to match exactly what saveAssistantMessage accepts
type SentimentType = 'BEARISH' | 'BULLISH' | 'APE IN' | 'NEUTRAL' | undefined;

// Define market data type to replace 'any'
interface MarketData {
  volumes?: number[];
  prices?: number[];
  marketCaps?: number[];
  [key: string]: unknown;
}

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
  addDirectMessage: (userMessage: string, aiResponse: string) => void;
  clearChatHistory: () => void;
  generateTradeSignal: (tokenName: string, currentPrice: number, marketData: MarketData) => Promise<TradeSignal | null>;
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

  // Extract sentiment details from AI response - memoized to prevent recreation
  const extractSentimentDetails = useCallback((content: string) => {
    // Extract sentiment score using regex
    const scoreMatch = content.toString().match(/Sentiment Score: (\d+)\/100/i);
    let sentimentScore: number | undefined = undefined;
    let sentimentType: SentimentType = undefined;
    
    if (scoreMatch && scoreMatch[1]) {
      sentimentScore = parseInt(scoreMatch[1]);
      
      // Determine sentiment type
      if (sentimentScore <= 35) {
        sentimentType = 'BEARISH';
      } else if (sentimentScore <= 66) {
        // Use NEUTRAL instead of DYOR
        sentimentType = 'NEUTRAL';
      } else {
        sentimentType = 'BULLISH';
      }
      
      // Check for APE IN signal
      if (sentimentScore > 65 && content.toString().includes('APE IN SIGNAL')) {
        sentimentType = 'APE IN';
      }
    }
    
    return { sentimentScore, sentimentType };
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

  // Define addUserMessage using useCallback to prevent recreation on every render
  const addUserMessage = useCallback(async (message: string) => {
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
            sentimentScore !== null ? sentimentScore : undefined, // Convert null to undefined
            sentimentType as SentimentType
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
        // Convert MessageContent to string if needed
        const responseText = typeof response === 'string' ? response : JSON.stringify(response);
        const aiMessage = new AIMessage(responseText);
        setChatHistory(prev => [...prev, aiMessage]);
        
        // Extract sentiment if present
        const { sentimentScore, sentimentType } = extractSentimentDetails(responseText);
        
        // Save assistant response to database
        try {
          await chatHistoryApi.saveAssistantMessage(
            user.id, 
            responseText, 
            currentSessionId || undefined,
            undefined,  // tokenId
            sentimentScore !== null ? sentimentScore : undefined, // Convert null to undefined
            sentimentType as SentimentType
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
  }, [user, currentSessionId, useDirectAnthropicAPI, directChatHistory, chatHistory, fetchChatHistory, extractSentimentDetails]);

  // Method to add messages directly without API call - used for background tasks
  const addDirectMessage = useCallback((userMessage: string, aiResponse: string) => {
    if (useDirectAnthropicAPI) {
      setDirectChatHistory(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      ]);
    } else {
      setChatHistory(prev => [
        ...prev,
        new HumanMessage(userMessage),
        new AIMessage(aiResponse)
      ]);
    }
  }, [useDirectAnthropicAPI]);

  // Create a memoized bridge to this context's methods
  const contextBridge = useMemo(() => {
    const handleDirectMessage = (userMessage: string, aiResponse: string) => {
      // Add messages directly to chat history
      if (useDirectAnthropicAPI) {
        setDirectChatHistory(prev => [
          ...prev,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: aiResponse }
        ]);
      } else {
        setChatHistory(prev => [
          ...prev,
          new HumanMessage(userMessage),
          new AIMessage(aiResponse)
        ]);
      }
      
      // Also save to database if user is logged in
      if (user && currentSessionId) {
        // Save user message
        chatHistoryApi.saveUserMessage(
          user.id,
          userMessage,
          currentSessionId
        ).catch(err => console.error('Error saving background user message:', err));
        
        // Extract sentiment if present (reusing the function)
        const { sentimentScore, sentimentType } = extractSentimentDetails(aiResponse);
        
        // Save AI response
        chatHistoryApi.saveAssistantMessage(
          user.id,
          aiResponse,
          currentSessionId,
          undefined, // tokenId
          sentimentScore !== null ? sentimentScore : undefined, // Convert null to undefined
          sentimentType as SentimentType
        ).catch(err => console.error('Error saving background AI message:', err));
      }
    };
    
    return {
      addUserMessage,
      addDirectMessage: handleDirectMessage
    };
  }, [currentSessionId, addUserMessage, useDirectAnthropicAPI, user, extractSentimentDetails]);

  // Register with aiService for background task integration
  useEffect(() => {
    // Register with aiService using the memoized bridge
    registerAIContext(contextBridge);
    
    // Return cleanup function to prevent multiple registrations
    return () => {
      unregisterAIContext();
    };
  }, [contextBridge]); // Only depend on the memoized bridge

  // Load chat history when user changes
  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
  }, [user, fetchChatHistory]);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    setDirectChatHistory([]);
    // Generate a new session ID when clearing history
    setCurrentSessionId(crypto.randomUUID());
  }, []);

  const generateTradeSignal = useCallback(async (tokenName: string, currentPrice: number, marketData: MarketData): Promise<TradeSignal | null> => {
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
  }, []);

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
        addDirectMessage,
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