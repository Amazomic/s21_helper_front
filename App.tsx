
import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';

// Fix: Add global type declaration for Telegram WebApp on Window interface
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        colorScheme?: 'light' | 'dark';
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

  const handleLoginSuccess = (user: string, accessToken: string) => {
    const normalizedUsername = user.toLowerCase().trim();
    setUsername(normalizedUsername);
    setToken(accessToken);
    
    // Persist session
    localStorage.setItem('s21_auth_token', accessToken);
    localStorage.setItem('s21_username', normalizedUsername);
    localStorage.setItem('s21_auth_token_timestamp', new Date().toISOString());
  };

  const handleLogout = () => {
    setToken(null);
    setUsername('');
    
    // Clear all s21 persistence to prevent cross-user data leaking from local storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('s21_')) {
        localStorage.removeItem(key);
      }
    });
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
