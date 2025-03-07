import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useSupabase } from '../context/SupabaseContext';

export const EmailConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, createUserProfile } = useSupabase();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email...');
  const [countdown, setCountdown] = useState<number>(5);
  
  useEffect(() => {
    // Get the token from the URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const email = searchParams.get('email');
    
    const verifyEmail = async () => {
      try {
        if (!token || !type || !email) {
          setStatus('error');
          setMessage('Invalid confirmation link. Please request a new one.');
          return;
        }
        
        // Check if this is an email confirmation
        if (type === 'email_confirmation' || type === 'signup') {
          // Use Supabase to verify the token
          // Note: This is mostly handled by Supabase automatically, but we can check the session
          const { data, error } = await supabase.auth.getUser();
          
          if (error) {
            console.error('Error verifying email:', error);
            setStatus('error');
            setMessage('Failed to verify your email. Please try again.');
            return;
          }
          
          if (data.user) {
            // Create or ensure user profile exists
            if (email) {
              await createUserProfile(data.user.id, email);
            }
            
            setStatus('success');
            setMessage('Your email has been successfully verified!');
            
            // Start countdown to dashboard
            startCountdown();
          } else {
            setStatus('error');
            setMessage('Email verification failed. Please sign in manually.');
          }
        } else {
          setStatus('error');
          setMessage('Invalid confirmation type. Please try again.');
        }
      } catch (err) {
        console.error('Error in email verification:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };
    
    verifyEmail();
  }, [location.search, createUserProfile]);
  
  // Countdown function to redirect to dashboard
  const startCountdown = () => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/portal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  };
  
  // Get the status icon based on current state
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader size={48} className="animate-spin text-viridian" />;
      case 'success':
        return <CheckCircle size={48} className="text-green-500" />;
      case 'error':
        return <XCircle size={48} className="text-red-500" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="bg-dark-card border border-viridian/30 rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>
        
        <h1 className="text-2xl font-bold mb-4">
          {status === 'loading' ? 'Verifying Email' : 
           status === 'success' ? 'Email Verified!' : 'Verification Failed'}
        </h1>
        
        <p className="text-gray-400 mb-6">{message}</p>
        
        {status === 'success' && (
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-viridian/20 flex items-center justify-center text-white text-2xl mx-auto">
              {countdown}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Redirecting to dashboard in {countdown} seconds...
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          {status === 'success' && (
            <button 
              onClick={() => navigate('/portal')}
              className="primary-btn py-2.5"
            >
              Go to Dashboard Now
            </button>
          )}
          
          {status === 'error' && (
            <button 
              onClick={() => navigate('/login')}
              className="primary-btn py-2.5"
            >
              Go to Login
            </button>
          )}
          
          <button 
            onClick={() => navigate('/')}
            className="secondary-btn py-2.5"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};