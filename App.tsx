import React, { useState, useEffect, useCallback } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { AuthResponse } from './types';

// Fix: Add global type declaration for Telegram WebApp on Window interface
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        colorScheme?: 'light' | 'dark';
        initData: string;
      };
    };
  }
}

const App: React.FC = () => {
  // Initialize state from localStorage to persist session
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('s21_auth_token'));
  const [username, setUsername] = useState<string>(() => localStorage.getItem('s21_username') || '');
  
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

  // Listen for token updates from apiService (when auto-refresh happens) OR session expiration
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

  // Telegram Web App initialization
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  // Apply dark mode class to html element
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