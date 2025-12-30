
import React, { useState } from 'react';
import { loginUser, linkTelegramAccount } from '../services/apiService';
import { Button } from './ui/Button';
import { AuthResponse } from '../types';

interface LoginFormProps {
  onLoginSuccess: (username: string, authData: AuthResponse) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);

    // Ensure lowercase on submit
    const normalizedUsername = username.toLowerCase().trim();

    try {
      // 1. Authenticate with School 21
      const data = await loginUser(normalizedUsername, password);

      // 2. Auto-Link Telegram if we are in the Telegram WebApp environment
      if (window.Telegram?.WebApp?.initData) {
         try {
           await linkTelegramAccount(data.access_token);
         } catch (linkError) {
           console.error("Auto-link failed (non-fatal):", linkError);
           // We do not block login if linking fails, but we log it.
         }
      }
      
      onLoginSuccess(normalizedUsername, data);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#248b65] to-gray-900">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gray-50 pt-6 pb-4 border-b border-gray-100 text-center">
          <div className="mx-auto bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#248b65]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">School 21 Helper</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                placeholder="Enter login"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </div>

          <div className="text-center text-[10px] text-gray-400 mt-2 font-mono">
             powered by <a href="https://t.me/Amazomic" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 hover:underline">@amazomic</a>
          </div>
        </form>
      </div>
    </div>
  );
};
