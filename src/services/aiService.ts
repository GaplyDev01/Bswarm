// AI Service to handle sending data to AI and managing background tasks

// Define a type for imported data
export type ImportedCardData = Record<string, Record<string, unknown>>;

// Interface for AI request
interface AIRequest {
  id: string;
  text: string;
  importedData: ImportedCardData | null;
  timestamp: number;
  processInBackground: boolean;
}

// Interface for AI response
interface AIResponse {
  id: string;
  requestId: string;
  content: string;
  timestamp: number;
}

// Enhanced interface for background tasks with responses
interface BackgroundTaskWithResponse extends AIRequest {
  response?: AIResponse;
  status?: 'pending' | 'completed' | 'failed';
  addedToChatHistory?: boolean; // Track if this has been added to chat history
}

// Define payload type for task events
interface TaskEventPayload {
  id: string;
  title?: string;
  message?: string;
  error?: string;
}

// AIContext bridge - allows aiService to call methods on AIContext
interface AIContextBridge {
  addUserMessage: (message: string) => Promise<void>;
  addDirectMessage: (userMessage: string, aiResponse: string) => void;
}

// Keep track of background tasks
const backgroundTasks: Map<string, BackgroundTaskWithResponse> = new Map();

// Reference to AIContext methods
let aiContextBridge: AIContextBridge | null = null;

// Register AI Context methods
export const registerAIContext = (bridge: AIContextBridge) => {
  aiContextBridge = bridge;
  console.log('AIContext registered with aiService');
};

// Unregister AI Context methods
export const unregisterAIContext = () => {
  aiContextBridge = null;
  console.log('AIContext unregistered from aiService');
};

// Generate a unique request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Dispatch a task event
const dispatchTaskEvent = (type: string, payload: TaskEventPayload) => {
  const event = new CustomEvent('ai_task_event', {
    detail: { type, payload }
  });
  window.dispatchEvent(event);
};

// Save history of responses
const saveToHistory = (response: AIResponse) => {
  // Update the corresponding background task with response if it exists
  if (backgroundTasks.has(response.requestId)) {
    const task = backgroundTasks.get(response.requestId);
    if (task) {
      task.response = response;
      task.status = 'completed';
      
      // If not already added to chat history and AIContext bridge is available
      if (!task.addedToChatHistory && aiContextBridge) {
        // Add this task and response to the chat history
        try {
          if (aiContextBridge.addDirectMessage) {
            // Use direct message if available (faster than async method)
            aiContextBridge.addDirectMessage(task.text, response.content);
          } else {
            // Fallback to standard method
            aiContextBridge.addUserMessage(task.text)
              .then(() => {
                console.log('Background task added to chat history', task.id);
              })
              .catch(err => {
                console.error('Failed to add background task to chat history', err);
              });
          }
          
          // Mark as added to chat history
          task.addedToChatHistory = true;
          
          // Show toast notification
          showToast('Background task completed and added to chat history', 'success');
          
          // Dispatch special event for UI to know this was added to chat
          dispatchTaskEvent('task_added_to_chat', {
            id: task.id,
            message: 'This task has been added to your chat history'
          });
        } catch (error) {
          console.error('Error adding background task to chat history:', error);
        }
      }
      
      backgroundTasks.set(response.requestId, task);
    }
  }
};

// Process AI request
const processAIRequest = async (request: AIRequest): Promise<AIResponse> => {
  // This is a mock implementation
  // In a real app, this would call your AI backend
  return new Promise((resolve, reject) => {
    // Simulate API processing time (longer for complex requests)
    const processingTime = 2000 + Math.random() * (request.text.length > 100 ? 5000 : 3000);
    
    setTimeout(() => {
      if (Math.random() > 0.95) { // Reduce failure rate for better testing
        // Simulate occasional failure
        reject(new Error('Failed to process request: The server is currently experiencing high load. Please try again.'));
        return;
      }
      
      // Generate a more realistic response based on the request content
      let responseContent = '';
      
      if (request.text.toLowerCase().includes('bitcoin') || request.text.toLowerCase().includes('btc')) {
        responseContent = `
Analysis of Bitcoin (BTC):

Current market conditions show Bitcoin trading in a consolidation pattern after recent volatility. Technical indicators suggest:

1. RSI: 58 (neutral but trending positive)
2. MACD: Bullish crossover forming
3. Support levels: $34,200, $32,800
4. Resistance levels: $36,500, $38,200

Volume has been increasing on upward movements, which is a positive sign. The 50-day moving average is now providing support at $33,400.

Sentiment Score: 72/100
Recommendation: BULLISH

There appears to be accumulation happening at current levels, suggesting institutional interest remains strong.
`;
      } else if (request.text.toLowerCase().includes('solana') || request.text.toLowerCase().includes('sol')) {
        responseContent = `
Analysis of Solana (SOL):

SOL has shown remarkable strength relative to the broader market, with significant development activity and growing DeFi TVL.

Technical analysis:
1. RSI: 73 (approaching overbought territory)
2. MACD: Strong positive momentum but extended
3. Support levels: $148.50, $138.20
4. Resistance levels: $165.00, $172.80

On-chain metrics show increasing daily active addresses, suggesting strong user adoption. However, the current price level might see short-term resistance.

Sentiment Score: 84/100
Recommendation: BULLISH (with caution on entry points)

APE IN SIGNAL: SOL's technicals combined with ecosystem growth make it a high-conviction opportunity for the next 30-45 days.
`;
      } else if (request.importedData && Object.keys(request.importedData).length > 0) {
        responseContent = `I've analyzed the data you provided from ${Object.keys(request.importedData).length} data sources. 

Key insights from your imported data:
${Object.keys(request.importedData).map(source => `- ${source}: Found interesting patterns in the ${Object.keys(request.importedData[source]).length} metrics provided`).join('\n')}

Based on this analysis, I recommend monitoring these key indicators closely as they show potential signals for market movement in the next 24-48 hours.

Sentiment Score: 65/100
Recommendation: DYOR

The data suggests moderate opportunity with defined risk parameters.`;
      } else {
        responseContent = `Response to: ${request.text}

I've analyzed your request and found several key points to consider:

1. Market conditions currently show mixed signals with a slight bullish bias
2. Volatility indicators suggest preparing for increased price action in the coming week
3. Sentiment analysis from social media shows growing interest but remains below peak levels

For specific trading recommendations, please provide a token or asset name for detailed analysis.

Sentiment Score: 58/100
Recommendation: DYOR
`;
      }
      
      const response: AIResponse = {
        id: `resp_${Date.now()}`,
        requestId: request.id,
        content: responseContent.trim(),
        timestamp: Date.now()
      };
      
      resolve(response);
    }, processingTime);
  });
};

// Send request to AI
export const sendToAI = async (
  text: string, 
  importedData: ImportedCardData | null = null, 
  processInBackground: boolean = false
): Promise<string> => {
  const requestId = generateRequestId();
  
  const request: AIRequest = {
    id: requestId,
    text,
    importedData,
    timestamp: Date.now(),
    processInBackground
  };
  
  if (processInBackground) {
    // Track background task
    backgroundTasks.set(requestId, {
      ...request,
      status: 'pending',
      addedToChatHistory: false
    });
    
    // Notify that a background task has started
    dispatchTaskEvent('task_started', {
      id: requestId,
      title: `${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
    });
    
    // Process in background
    processAIRequest(request)
      .then(response => {
        // Save response to history or state
        saveToHistory(response);
        
        // Notify that the task is complete
        dispatchTaskEvent('task_completed', {
          id: requestId,
          message: response.content
        });
        
        // We keep the task in the map for history viewing
      })
      .catch(error => {
        console.error('Background task failed:', error);
        
        // Mark task as failed but keep it for history
        if (backgroundTasks.has(requestId)) {
          const task = backgroundTasks.get(requestId);
          if (task) {
            task.status = 'failed';
            backgroundTasks.set(requestId, task);
          }
        }
        
        // Notify that the task failed
        dispatchTaskEvent('task_failed', {
          id: requestId,
          error: error.message
        });
      });
    
    return requestId;
  } else {
    // Process immediately and return result
    try {
      const response = await processAIRequest(request);
      saveToHistory(response);
      return requestId;
    } catch (error) {
      console.error('AI request failed:', error);
      throw error;
    }
  }
};

// Function to show a toast notification
export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // This is a placeholder. In a real app, you would use a toast library
  console.log(`Toast: ${message} (${type})`);
  
  // Dispatch a toast event for UI to handle
  const event = new CustomEvent('toast_notification', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};

// Get all background tasks with their responses
export const getBackgroundTasks = (): BackgroundTaskWithResponse[] => {
  return Array.from(backgroundTasks.values());
};

// Get interaction history
export const getInteractionHistory = (): AIResponse[] => {
  const historyString = localStorage.getItem('ai_interaction_history');
  return historyString ? JSON.parse(historyString) : [];
};

// Clear interaction history
export const clearInteractionHistory = (): void => {
  localStorage.removeItem('ai_interaction_history');
}; 