
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { TelegramConfig, TelegramVisibility } from '../types';
import { linkTelegramAccount, updateTelegramVisibility, unlinkTelegramAccount, fetchTelegramSettings } from '../services/apiService';

interface TelegramSettingsProps {
  token: string;
  initialUsername?: string;
  config: TelegramConfig | null;
  onUpdate: (newConfig: TelegramConfig | null) => void;
}

export const TelegramSettings: React.FC<TelegramSettingsProps> = ({ token, config, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Check if running inside Telegram
  const isTelegramWebApp = !!window.Telegram?.WebApp?.initData;

  const handleLink = async () => {
    if (!isTelegramWebApp) {
      alert("Please open this app inside Telegram to link your account.");
      return;
    }
    
    setIsLoading(true);
    try {
      // Try to link using just the current token/session
      await linkTelegramAccount(token);
      
      // Fetch fresh settings to confirm link
      const newConfig = await fetchTelegramSettings(token);
      onUpdate(newConfig);
    } catch (e: any) {
      console.error(e);
      alert("Auto-link failed. Please log out and log in again to verify your identity.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    if(!confirm("Are you sure you want to unlink your Telegram account?")) return;
    setIsLoading(true);
    try {
      await unlinkTelegramAccount(token);
      onUpdate({ isLinked: false, visibility: 'private' });
    } catch (e: any) {
      console.error(e);
      alert("Failed to unlink: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const changeVisibility = async (vis: TelegramVisibility) => {
    setIsLoading(true);
    try {
      const newConfig = await updateTelegramVisibility(token, vis);
      onUpdate(newConfig);
    } catch (e) {
       console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!config) return null;

  return (
    <Card className="shadow-2xl border-none rounded-[2rem] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all mb-4">
      <div className="flex items-center justify-between px-2 pt-2 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-sky-500/10 text-sky-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                </svg>
            </div>
            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">Telegram</h3>
        </div>
        <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tight ${config.isLinked ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
            {config.isLinked ? 'Linked' : 'Not Linked'}
        </div>
      </div>

      <div className="p-3 lg:p-4 space-y-4">
        {!config.isLinked ? (
            <div className="flex flex-col gap-3">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                   Account not linked. 
                   <br/>
                   <span className="opacity-70">Please log out and log in again to link automatically.</span>
                </p>
                
                {/* Fallback button that uses TOKEN ONLY, no form */}
                {isTelegramWebApp && (
                  <Button 
                    onClick={handleLink} 
                    isLoading={isLoading}
                    variant="outline"
                    className="py-2 text-xs"
                  >
                      Retry Linking (Current Session)
                  </Button>
                )}
            </div>
        ) : (
            <div className="space-y-4">
                {/* Account Info */}
                <div className="flex items-center justify-between bg-gray-50 dark:bg-black/20 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-gray-400 uppercase">Connected Account</span>
                        <span className="text-[11px] font-black text-gray-800 dark:text-gray-200">
                            {config.telegramUsername ? `@${config.telegramUsername}` : (config.telegramId ? `ID: ${config.telegramId}` : 'Telegram User')}
                        </span>
                    </div>
                    <button onClick={handleUnlink} disabled={isLoading} className="text-[9px] font-bold text-red-500 hover:text-red-600 px-2 py-1 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors">
                        Unlink
                    </button>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-2">
                    <span className="text-[8px] font-bold text-gray-400 uppercase ml-1">Privacy & Contact</span>
                    
                    {/* Option 1: Public */}
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${config.visibility === 'public' ? 'bg-primary/5 border-primary/30' : 'bg-transparent border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${config.visibility === 'public' ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                                {config.visibility === 'public' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase">Public</span>
                                <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">Show my username to everyone</span>
                            </div>
                        </div>
                        <input type="radio" name="visibility" className="hidden" checked={config.visibility === 'public'} onChange={() => changeVisibility('public')} disabled={isLoading} />
                    </label>

                    {/* Option 2: Request Only */}
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${config.visibility === 'request_only' ? 'bg-amber-500/5 border-amber-500/30' : 'bg-transparent border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${config.visibility === 'request_only' ? 'border-amber-500 bg-amber-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {config.visibility === 'request_only' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase">Requests Only</span>
                                <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">Hide username, allow contact requests via bot</span>
                            </div>
                        </div>
                        <input type="radio" name="visibility" className="hidden" checked={config.visibility === 'request_only'} onChange={() => changeVisibility('request_only')} disabled={isLoading} />
                    </label>

                    {/* Option 3: Private */}
                    <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${config.visibility === 'private' ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-transparent border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${config.visibility === 'private' ? 'border-gray-500 bg-gray-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {config.visibility === 'private' && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase">Private</span>
                                <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">Completely hidden</span>
                            </div>
                        </div>
                        <input type="radio" name="visibility" className="hidden" checked={config.visibility === 'private'} onChange={() => changeVisibility('private')} disabled={isLoading} />
                    </label>
                </div>
            </div>
        )}
      </div>
    </Card>
  );
};
