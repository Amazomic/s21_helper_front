
import React, { useState, useEffect, useCallback } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { AuthResponse } from './types';

// Global Telegram Type
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        colorScheme?: 'light' | 'dark';
        initData: string;
        initDataUnsafe?: any;
      };
    };
  }
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('s21_auth_token'));
  const [username, setUsername] = useState<string>(() => localStorage.getItem('s21_username') || '');
  const [isLoading, setIsLoading] = useState(true);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (window.Telegram?.WebApp?.colorScheme === 'dark') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const handleLogout = useCallback(() => {
    setToken(null);
    setUsername('');
    
    // Keys to keep: Global Data (Graph, Campuses, Peers) and UI Preferences
    const keysToPreserve = [
      's21_graph_cache',
      's21_graph_cache_timestamp',
      's21_campuses_cache', 
      's21_campuses_cache_timestamp',
      's21_tg_connected_cache',
      's21_tg_connected_cache_timestamp',
      's21_debug_enabled'
    ];

    Object.keys(localStorage).forEach(key => {
      // Remove s21_ keys unless they are in the preserved list (Tokens, User Profile, User Skills, etc.)
      if (key.startsWith('s21_') && !keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  // Initialize Telegram App UI
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const handleTokenUpdate = (event: CustomEvent<string>) => setToken(event.detail);
    const handleSessionExpired = () => handleLogout();

    window.addEventListener('s21:token_updated', handleTokenUpdate as EventListener);
    window.addEventListener('s21:session_expired', handleSessionExpired as EventListener);
    
    return () => {
      window.removeEventListener('s21:token_updated', handleTokenUpdate as EventListener);
      window.removeEventListener('s21:session_expired', handleSessionExpired as EventListener);
    };
  }, [handleLogout]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLoginSuccess = (user: string, authData: AuthResponse) => {
    const normalizedUsername = user.toLowerCase().trim();
    setUsername(normalizedUsername);
    setToken(authData.access_token);
    
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
