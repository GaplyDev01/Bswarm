import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { TokenProvider } from './context/TokenContext';
import { UserProvider } from './context/UserContext';
import { AIProvider } from './context/AIContext';
import { SupabaseProvider } from './context/SupabaseContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SupabaseProvider>
        <TokenProvider>
          <UserProvider>
            <AIProvider>
              <App />
            </AIProvider>
          </UserProvider>
        </TokenProvider>
      </SupabaseProvider>
    </ThemeProvider>
  </StrictMode>
);