import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface UsernameFormProps {
  onClose: () => void;
}

export const UsernameForm: React.FC<UsernameFormProps> = ({ onClose }) => {
  const { user, updateUsername } = useUser();
  const [username, setUsername] = useState(user.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  const validateUsername = (value: string) => {
    if (!value.trim()) return 'Username cannot be empty';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await updateUsername(username);
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('Failed to update username. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while updating username.');
      console.error('Error updating username:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        ref={formRef}
        className="bg-light-card dark:bg-dark-card border border-light-border/20 dark:border-viridian/30 rounded-lg p-6 w-full max-w-md shadow-lg"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text">
            {user.username ? 'Update Username' : 'Create Username'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-viridian/10 rounded-lg text-light-subtext dark:text-dark-subtext"
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 rounded-lg text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-lg text-green-600 dark:text-green-400 text-sm">
            Username updated successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-light-subtext dark:text-dark-subtext mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || success}
              className="w-full bg-light-bg/90 dark:bg-dark-bg/90 border border-light-border/20 dark:border-viridian/40 rounded-lg py-2 px-3 text-light-text dark:text-dark-text focus:outline-none focus:border-viridian/40 dark:focus:border-viridian/70"
              placeholder="Enter username"
            />
            <p className="mt-1 text-xs text-light-subtext dark:text-dark-subtext">
              Your username will be displayed in the application.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className="secondary-btn py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="primary-btn py-2 px-4"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : success ? 'Saved!' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};