// AI Service for managing background tasks and AI context integration

// Define the interface for the AI context bridge
interface AIContextBridge {
  addUserMessage: (message: string) => Promise<void>;
  addDirectMessage: (userMessage: string, aiResponse: string) => void;
}

// Store the current AI context
let currentAIContext: AIContextBridge | null = null;

// Background tasks tracking
interface BackgroundTask {
  id: string;
  userMessage: string;
  aiResponse?: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  timestamp: number;
  addedToChat: boolean;
}

const backgroundTasks: BackgroundTask[] = [];

// Register an AI context
export const registerAIContext = (context: AIContextBridge): void => {
  currentAIContext = context;
  console.log('AIContext registered with aiService');
};

// Unregister the AI context
export const unregisterAIContext = (): void => {
  currentAIContext = null;
  console.log('AIContext unregistered from aiService');
};

// Add a background task
export const addBackgroundTask = (userMessage: string): string => {
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  backgroundTasks.push({
    id: taskId,
    userMessage,
    status: 'pending',
    timestamp: Date.now(),
    addedToChat: false
  });
  
  return taskId;
};

// Update a background task
export const updateBackgroundTask = (
  taskId: string, 
  status: 'pending' | 'completed' | 'failed', 
  aiResponse?: string,
  error?: string
): void => {
  const taskIndex = backgroundTasks.findIndex(task => task.id === taskId);
  
  if (taskIndex !== -1) {
    backgroundTasks[taskIndex] = {
      ...backgroundTasks[taskIndex],
      status,
      aiResponse,
      error
    };
    
    // If task is completed and we have an AI context, add to chat
    if (status === 'completed' && aiResponse && currentAIContext) {
      currentAIContext.addDirectMessage(
        backgroundTasks[taskIndex].userMessage,
        aiResponse
      );
      
      // Mark as added to chat
      backgroundTasks[taskIndex].addedToChat = true;
    }
  }
};

// Get all background tasks
export const getBackgroundTasks = (): BackgroundTask[] => {
  return [...backgroundTasks];
};

// Get a specific background task
export const getBackgroundTask = (taskId: string): BackgroundTask | undefined => {
  return backgroundTasks.find(task => task.id === taskId);
};

// Clear completed background tasks
export const clearCompletedBackgroundTasks = (): void => {
  const pendingTasks = backgroundTasks.filter(task => task.status === 'pending');
  backgroundTasks.length = 0;
  backgroundTasks.push(...pendingTasks);
};

// Add a message directly to the chat (if AI context is registered)
export const addMessageToChat = (userMessage: string, aiResponse: string): boolean => {
  if (currentAIContext) {
    currentAIContext.addDirectMessage(userMessage, aiResponse);
    return true;
  }
  return false;
}; 