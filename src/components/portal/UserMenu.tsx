import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User as UserIcon, CreditCard, Edit, MessageSquare } from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';
import { useUser } from '../../context/UserContext';
import { UsernameForm } from './UsernameForm';
import { ChatHistoryPanel } from './ChatHistoryPanel';

export const UserMenu: React.FC = () => {
  const { signOut, user } = useSupabase();
  const { user: profileData } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUsernameFormClose = () => {
    setShowUsernameForm(false);
  };

  const handleChatHistoryToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowChatHistory(!showChatHistory);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 hover:bg-viridian/10 rounded-full"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-viridian/20 flex items-center justify-center text-viridian">
          {profileData.username ? (
            <span className="font-semibold text-sm">{profileData.username.charAt(0).toUpperCase()}</span>
          ) : (
            <UserIcon size={16} />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-light-card dark:bg-dark-card border border-light-border/10 dark:border-viridian/30 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-light-border/10 dark:border-viridian/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-viridian/20 flex items-center justify-center text-viridian">
                  {profileData.username ? (
                    <span className="font-semibold">{profileData.username.charAt(0).toUpperCase()}</span>
                  ) : (
                    <UserIcon size={20} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-light-text dark:text-dark-text">
                      {profileData.username || 'Set username'}
                    </p>
                    <button 
                      onClick={() => setShowUsernameForm(true)}
                      className="p-1 text-viridian hover:bg-viridian/10 rounded"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-light-subtext dark:text-dark-subtext">{user?.email}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-light-subtext dark:text-dark-subtext mt-2">
              Balance: ${profileData.balance.toLocaleString()}
            </p>
          </div>
          
          <div className="py-2">
            <button 
              className="dropdown-item"
              onClick={() => navigate('/portal?tab=profile')}
            >
              <UserIcon size={16} className="mr-2" />
              <span>Your Profile</span>
            </button>
            
            <button 
              className="dropdown-item"
              onClick={() => navigate('/portal?tab=portfolio')}
            >
              <CreditCard size={16} className="mr-2" />
              <span>Portfolio</span>
            </button>
            
            <button 
              className="dropdown-item"
              onClick={handleChatHistoryToggle}
            >
              <MessageSquare size={16} className="mr-2" />
              <span>Chat History</span>
            </button>
            
            <button className="dropdown-item">
              <Settings size={16} className="mr-2" />
              <span>Settings</span>
            </button>
            
            <div className="border-t border-light-border/10 dark:border-viridian/20 my-1"></div>
            
            <button 
              className="dropdown-item text-red-500 dark:text-red-400"
              onClick={handleSignOut}
            >
              <LogOut size={16} className="mr-2" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {showUsernameForm && (
        <UsernameForm onClose={handleUsernameFormClose} />
      )}

      {showChatHistory && (
        <ChatHistoryPanel onClose={() => setShowChatHistory(false)} />
      )}
    </div>
  );
};