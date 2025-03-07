import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, loading } = useSupabase();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-black text-light-text dark:text-dark-text">
        <div className="animate-spin w-8 h-8 border-4 border-viridian border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};