import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle, MessageSquare, Clock, MessageCircle } from 'lucide-react';
import { getBackgroundTasks } from '../services/aiService';

interface BackgroundTask {
  id: string;
  text: string;
  timestamp: number;
  processInBackground: boolean;
  importedData: Record<string, Record<string, unknown>> | null;
}

interface TaskWithResponse extends BackgroundTask {
  response?: {
    content: string;
    timestamp: number;
  };
  status: 'pending' | 'completed' | 'failed';
  addedToChatHistory?: boolean;
}

interface BackgroundTasksBreadcrumbProps {
  onTaskClick?: (taskId: string) => void;
  onViewInChat?: (taskId: string) => void;
}

export const BackgroundTasksBreadcrumb: React.FC<BackgroundTasksBreadcrumbProps> = ({ 
  onTaskClick,
  onViewInChat
}) => {
  const [tasks, setTasks] = useState<TaskWithResponse[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Load initial tasks and subscribe to task events
  useEffect(() => {
    const updateTasks = () => {
      // Get all background tasks
      const backgroundTasks = getBackgroundTasks();
      
      // Convert to TaskWithResponse format
      const mappedTasks = backgroundTasks.map(task => ({
        ...task,
        status: task.status || 'pending'
      }));
      
      setTasks(mappedTasks);
    };
    
    // Initialize with current tasks
    updateTasks();
    
    // Listen for task events
    const handleTaskEvent = (event: CustomEvent) => {
      const { type, payload } = event.detail;
      
      if (type === 'task_started') {
        setTasks(prev => {
          // Check if task already exists
          if (prev.some(t => t.id === payload.id)) {
            return prev;
          }
          
          // Add new task
          return [
            {
              id: payload.id,
              text: payload.title || 'Processing request...',
              timestamp: Date.now(),
              processInBackground: true,
              importedData: null,
              status: 'pending'
            },
            ...prev
          ];
        });
      } 
      else if (type === 'task_completed') {
        setTasks(prev => 
          prev.map(task => 
            task.id === payload.id 
              ? { 
                  ...task, 
                  status: 'completed', 
                  response: { 
                    content: payload.message || 'Task completed successfully',
                    timestamp: Date.now()
                  }
                } 
              : task
          )
        );
      } 
      else if (type === 'task_failed') {
        setTasks(prev => 
          prev.map(task => 
            task.id === payload.id 
              ? { 
                  ...task, 
                  status: 'failed',
                  response: {
                    content: payload.error || 'Task failed',
                    timestamp: Date.now()
                  }
                } 
              : task
          )
        );
      }
      else if (type === 'task_added_to_chat') {
        setTasks(prev => 
          prev.map(task => 
            task.id === payload.id 
              ? { 
                  ...task, 
                  addedToChatHistory: true
                } 
              : task
          )
        );
      }
      else if (type === 'breadcrumb_collapse') {
        // Collapse the breadcrumb when requested (e.g., when viewing in chat)
        setExpanded(false);
        setSelectedTaskId(null);
      }
    };
    
    window.addEventListener('ai_task_event', handleTaskEvent as EventListener);
    
    // Listen for toast notifications to show visual feedback
    const handleToastNotification = (event: CustomEvent) => {
      // You could implement a toast notification system here
      console.log('Toast notification:', event.detail);
    };
    
    window.addEventListener('toast_notification', handleToastNotification as EventListener);
    
    return () => {
      window.removeEventListener('ai_task_event', handleTaskEvent as EventListener);
      window.removeEventListener('toast_notification', handleToastNotification as EventListener);
    };
  }, []);

  // Auto-expand when new tasks are added
  useEffect(() => {
    if (tasks.length > 0 && !expanded) {
      setExpanded(true);
    }
    
    // Auto-expand when a task is completed
    const justCompletedTask = tasks.find(
      task => task.status === 'completed' && !task.addedToChatHistory
    );
    
    if (justCompletedTask && !expanded) {
      setExpanded(true);
      setSelectedTaskId(justCompletedTask.id);
    }
  }, [tasks, expanded]);

  // Format the timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle task selection
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(selectedTaskId === taskId ? null : taskId);
    if (onTaskClick) {
      onTaskClick(taskId);
    }
  };

  // Handle viewing a task in chat history
  const handleViewInChat = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    if (onViewInChat) {
      onViewInChat(taskId);
    }
  };

  // If no tasks, don't render anything
  if (tasks.length === 0) {
    return null;
  }

  // Count active and completed tasks
  const activeTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-30 w-auto max-w-2xl">
      <div className="bg-[#0C1016] border border-viridian/30 rounded-lg shadow-lg overflow-hidden">
        <div 
          className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-viridian/10 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-viridian" />
            <span className="text-sm font-medium text-white">
              Background Tasks ({activeTasks} active{completedTasks > 0 ? `, ${completedTasks} completed` : ''})
            </span>
          </div>
          {expanded ? 
            <ChevronDown size={16} className="text-gray-400" /> : 
            <ChevronUp size={16} className="text-gray-400" />
          }
        </div>
        
        <div 
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: expanded ? '240px' : '0px' }}
        >
          <div className="max-h-60 overflow-y-auto">
            {tasks.map(task => (
              <div key={task.id} className="border-t border-viridian/20">
                <div 
                  className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-viridian/5 transition-colors ${
                    selectedTaskId === task.id ? 'bg-viridian/10' : ''
                  }`}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {task.status === 'pending' && (
                      <Loader2 size={16} className="text-viridian animate-spin" />
                    )}
                    {task.status === 'completed' && (
                      <CheckCircle size={16} className={task.addedToChatHistory ? "text-green-500" : "text-green-700"} />
                    )}
                    {task.status === 'failed' && (
                      <XCircle size={16} className="text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-white font-medium truncate max-w-[400px]">
                          {task.text}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatTime(task.timestamp)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {task.addedToChatHistory && (
                          <div className="text-xs text-viridian animate-pulse-once">Added to chat</div>
                        )}
                        
                        {task.status !== 'pending' && (
                          <MessageSquare size={14} className="text-viridian ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                    
                    {selectedTaskId === task.id && task.response && (
                      <div className="mt-2 p-2 bg-black/30 rounded text-sm text-gray-300 border-l-2 border-viridian">
                        {task.response.content}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTime(task.response.timestamp)}
                          
                          {task.addedToChatHistory && onViewInChat && (
                            <button
                              onClick={(e) => handleViewInChat(e, task.id)}
                              className="ml-2 inline-flex items-center gap-1 text-viridian hover:underline"
                            >
                              <MessageCircle size={12} />
                              View in chat
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {task.status === 'pending' && (
                      <div className="mt-1.5 w-full bg-gray-700 rounded-full h-1">
                        <div className="bg-viridian h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 