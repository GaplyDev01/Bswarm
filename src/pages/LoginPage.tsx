import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { AuthForm } from '../components/auth/AuthForm';

export const LoginPage: React.FC = () => {
  const { user, loading } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/portal';
  
  // If already authenticated, redirect to the from path
  if (user && !loading) {
    return <Navigate to={from} replace />;
  }
  
  const handleAuthSuccess = () => {
    navigate(from, { replace: true });
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-viridian mb-2">TradesXBT</h1>
            <p className="text-gray-400">Sign in to access your AI trading dashboard</p>
          </div>
          
          <AuthForm onSuccess={handleAuthSuccess} />
          
          <div className="text-center text-sm text-gray-400 mt-6">
            <p>For demo purposes, you can create a new account with any email and password.</p>
            <p className="mt-2">Your data will be stored securely in Supabase.</p>
          </div>
        </div>
      </div>
    </div>
  );
};