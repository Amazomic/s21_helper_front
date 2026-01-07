
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { TelegramConfig, TelegramVisibility } from '../types';
import { updateTelegramVisibility, unlinkTelegramAccount, linkTelegramAccount, fetchTelegramSettings } from '../services/apiService';

interface TelegramStatusWidgetProps {
  config: TelegramConfig | null;
  loading: boolean;
  onUpdateConfig: (newConfig: TelegramConfig | null) => void;
  token: string;
}

export const TelegramStatusWidget: React.FC<TelegramStatusWidgetProps> = ({ config, loading, onUpdateConfig, token }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const tgWebApp = window.Telegram?.WebApp;
  const isTelegramContext = !!tgWebApp?.initData;

  const handleLink = async () => {
    if (!isTelegramContext) {
      // In web version, open the bot to allow user to connect there
      window.open('https://t.me/s21_helper_bot', '_blank');
      return;
    }
    
    setIsUpdating(true);
    try {
      await linkTelegramAccount(token);
      const newConfig = await fetchTelegramSettings(token);
      onUpdateConfig(newConfig);
    } catch (e: any) {
      console.error("Link failed", e);
      alert("Failed to link Telegram account. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const changeVisibility = async (vis: TelegramVisibility) => {
    setIsUpdating(true);
    try {
      onUpdateConfig({ ...config!, visibility: vis });
      await updateTelegramVisibility(token, vis);
    } catch (e) {
       console.error("Failed to update visibility", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnlink = async () => {
    if(!confirm("Unlink Telegram account?")) return;
    setIsUpdating(true);
    try {
      await unlinkTelegramAccount(token);
      onUpdateConfig({ isLinked: false, visibility: 'private' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-24 animate-pulse rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
        <div className="flex justify-between items-center mb-3">
           <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
           <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-8 w-full bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
      </div>
    );
  }

  const isLinked = config?.isLinked === true;
  const visibility = config?.visibility || 'public'; 
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  return (
    <div className="w-full shadow-sm rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 transition-all">
       {!isLinked ? (
          <div className="flex items-center justify-between gap-3">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide">Telegram</span>
                    <span className="text-[9px] text-gray-400 font-medium">Not connected</span>
                </div>
             </div>
             <Button 
                onClick={handleLink} 
                isLoading={isUpdating} 
                className="w-auto px-4 py-1.5 h-8 text-[9px] font-black uppercase tracking-wider"
             >
                Connect
             </Button>
          </div>
       ) : (
          <div className="flex flex-col gap-3">
             {/* Header: Icon, Info, Action */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                    {/* Icon */}
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.47-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                        </svg>
                    </div>

                    {/* Text Info */}
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-gray-800 dark:text-white truncate">
                                {config?.telegramUsername ? `@${config.telegramUsername}` : 'Linked'}
                            </span>
                        </div>
                        {config?.linkedAt && (
                            <span className="text-[8px] text-emerald-500 font-bold tracking-tight">
                                Linked: {formatDate(config.linkedAt)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Unlink Action - Button */}
                <button 
                    onClick={handleUnlink}
                    disabled={isUpdating}
                    className="flex-shrink-0 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-wide rounded-lg transition-all"
                >
                    Unlink
                </button>
             </div>

             {/* Privacy Segmented Control */}
             <div className="grid grid-cols-3 gap-1 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800/50">
                  <button
                    onClick={() => changeVisibility('public')}
                    disabled={isUpdating}
                    className={`py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                      visibility === 'public' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    Public
                  </button>

                  <button
                    onClick={() => changeVisibility('notify_only')}
                    disabled={isUpdating}
                    className={`py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                      visibility === 'notify_only' 
                        ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    Notify
                  </button>

                  <button
                    onClick={() => changeVisibility('private')}
                    disabled={isUpdating}
                    className={`py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                      visibility === 'private' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    Private
                  </button>
             </div>
          </div>
       )}
    </div>
  );
};
