import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type FeedbackType = 'success' | 'error' | 'loading';

interface AuthFeedbackProps {
  message: string;
  type: FeedbackType;
  duration?: number;
  onDismiss?: () => void;
}

export const AuthFeedback: React.FC<AuthFeedbackProps> = ({ 
  message, 
  type, 
  duration = 3000,
  onDismiss 
}) => {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [type, duration, onDismiss]);
  
  if (!visible) return null;
  
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-viridian/20 border-viridian text-viridian';
      case 'error':
        return 'bg-red-500/20 border-red-500 text-red-500';
      case 'loading':
        return 'bg-blue-500/20 border-blue-500 text-blue-500';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'loading':
        return <Loader2 size={20} className="animate-spin" />;
    }
  };
  
  return (
    <div className={`fixed top-4 right-4 z-50 py-2 px-4 rounded-lg border ${getStyles()} flex items-center gap-2 shadow-lg`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};