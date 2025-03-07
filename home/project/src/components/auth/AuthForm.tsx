import React, { useState } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { AuthFeedback } from '../portal/AuthFeedback';

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'loading';
    message: string;
  } | null>(null);
  
  const { signIn, signUp, createUserProfile } = useSupabase();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      let response;
      
      if (isSignUp) {
        setFeedback({
          type: 'loading',
          message: 'Creating your account...'
        });
        
        response = await signUp(email, password);
        
        if (response.error) {
          setError(response.error.message);
          setFeedback({
            type: 'error',
            message: response.error.message
          });
        } else if (response.data.user) {
          // Try to create user profile manually as a fallback
          if (response.data.user.id) {
            try {
              await createUserProfile(response.data.user.id, email);
            } catch (profileError) {
              console.error('Error creating user profile:', profileError);
            }
          }
          
          setFeedback({
            type: 'success',
            message: 'Account created successfully!'
          });
          
          // Success - wait a moment then trigger callback
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1500);
        }
      } else {
        setFeedback({
          type: 'loading',
          message: 'Signing in...'
        });
        
        response = await signIn(email, password);
        
        if (response.error) {
          // Special handling for email confirmation error
          if (response.error.message.includes('email not confirmed')) {
            setError('Email confirmation is required. Please check your inbox.');
            setFeedback({
              type: 'error',
              message: 'Email confirmation required'
            });
          } else {
            setError(response.error.message);
            setFeedback({
              type: 'error',
              message: response.error.message
            });
          }
        } else if (response.data.user) {
          // Try to ensure user profile exists
          if (response.data.user.id) {
            try {
              await createUserProfile(response.data.user.id, email);
            } catch (profileError) {
              console.error('Error ensuring user profile exists:', profileError);
            }
          }
          
          setFeedback({
            type: 'success',
            message: 'Signed in successfully!'
          });
          
          // Success
          if (onSuccess) onSuccess();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setFeedback({
        type: 'error',
        message: 'An unexpected error occurred'
      });
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 bg-light-card dark:bg-dark-card rounded-lg border border-light-border/20 dark:border-viridian/30 shadow-xl w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-light-text dark:text-dark-text">
        {isSignUp ? 'Create your account' : 'Sign in to TradesXBT'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-light-subtext dark:text-dark-subtext mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-light-bg/90 dark:bg-dark-bg/90 border border-light-border/20 dark:border-viridian/40 rounded-lg py-2 px-3 text-light-text dark:text-dark-text focus:outline-none focus:border-viridian/40 dark:focus:border-viridian/70"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-light-subtext dark:text-dark-subtext mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-light-bg/90 dark:bg-dark-bg/90 border border-light-border/20 dark:border-viridian/40 rounded-lg py-2 px-3 text-light-text dark:text-dark-text focus:outline-none focus:border-viridian/40 dark:focus:border-viridian/70"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full primary-btn py-2.5 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-viridian dark:text-viridian hover:underline text-sm"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
      
      {feedback && (
        <AuthFeedback 
          type={feedback.type} 
          message={feedback.message} 
          onDismiss={() => setFeedback(null)}
        />
      )}
    </div>
  );
};