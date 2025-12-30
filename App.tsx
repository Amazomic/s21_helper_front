
import React, { useState, useEffect, useCallback } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { AuthResponse } from './types';
import { fetchTelegramSettings } from './services/apiService';

// Fix: Add global type declaration for Telegram WebApp on Window interface
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        colorScheme?: 'light' | 'dark';
        initData: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          auth_date?: string;
          hash?: string;
        };
      };
    };
  }
}

const App: React.FC = () => {
  // Initialize state from localStorage
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('s21_auth_token'));
  const [username, setUsername] = useState<string>(() => localStorage.getItem('s21_username') || '');
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize dark mode based on system preference or Telegram theme
  const [darkMode, setDarkMode] = useState(() => {
    if (window.Telegram?.WebApp?.colorScheme === 'dark') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const handleLogout = useCallback(() => {
    setToken(null);
    setUsername('');
    
    // Clear all s21 persistence to prevent cross-user data leaking from local storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('s21_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Check Telegram Link status on mount
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);

      // Telegram Web App initialization
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }

      // 1. Check if we have valid initData (are we in Telegram?)
      const isTelegram = !!window.Telegram?.WebApp?.initData;

      if (isTelegram) {
        try {
           // Try to fetch settings using just InitData (no school token yet)
           const settings = await fetchTelegramSettings(token); // pass current token if we have it, or null
           
           if (settings.isLinked && settings.schoolLogin) {
             // User is linked on backend!
             // Update username from backend
             setUsername(settings.schoolLogin);
             localStorage.setItem('s21_username', settings.schoolLogin);
             
             // If we don't have a school token in local storage, we assume the backend
             // will handle requests via InitData proxying. 
             // We set a placeholder token to allow the Dashboard to render.
             if (!token) {
               const sessionToken = 'telegram-session';
               setToken(sessionToken);
               // Do not save placeholder to localStorage to avoid confusion
             }
           } 
           // If not linked (404), we fall through to normal token check
        } catch (e) {
          console.warn("Initial Telegram check failed", e);
        }
      }

      setIsLoading(false);
    };

    initApp();
  }, []);

  // Listen for token updates from apiService
  useEffect(() => {
    const handleTokenUpdate = (event: CustomEvent<string>) => {
      setToken(event.detail);
    };

    const handleSessionExpired = () => {
      handleLogout();
    };

    window.addEventListener('s21:token_updated', handleTokenUpdate as EventListener);
    window.addEventListener('s21:session_expired', handleSessionExpired as EventListener);
    
    return () => {
      window.removeEventListener('s21:token_updated', handleTokenUpdate as EventListener);
      window.removeEventListener('s21:session_expired', handleSessionExpired as EventListener);
    };
  }, [handleLogout]);

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLoginSuccess = (user: string, authData: AuthResponse) => {
    const normalizedUsername = user.toLowerCase().trim();
    setUsername(normalizedUsername);
    setToken(authData.access_token);
    
    // Persist session
    localStorage.setItem('s21_auth_token', authData.access_token);
    localStorage.setItem('s21_refresh_token', authData.refresh_token);
    localStorage.setItem('s21_username', normalizedUsername);
    localStorage.setItem('s21_auth_token_timestamp', new Date().toISOString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      {!token ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard 
          username={username} 
          token={token} 
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      )}
    </>
  );
};

export default App;
