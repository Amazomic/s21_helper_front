
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
  const [isHovered, setIsHovered] = useState(false);

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
    const confirmed = confirm("Unlink Telegram account?");
    // Force reset hover state immediately after dialog closes to prevent "stuck" state
    setIsHovered(false);
    
    if(!confirmed) return;
    
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

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const day = date.getDate();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="w-full h-14 animate-pulse rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2">
         <div className="flex items-center gap-3 h-full">
           <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
           <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
         </div>
      </div>
    );
  }

  const isLinked = config?.isLinked === true;
  const visibility = config?.visibility || 'public'; 
  
  return (
    <div className="w-full shadow-sm rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-2.5 transition-all">
       {!isLinked ? (
          <div className="flex items-center justify-between gap-3">
             <div className="flex items-center gap-2.5">
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
                className="w-auto px-3 py-1 h-7 text-[9px] font-black uppercase tracking-wider"
             >
                Connect
             </Button>
          </div>
       ) : (
          <div className="flex items-center justify-between gap-2">
             {/* Left: Icon (Unlink) + Name */}
             <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                {/* Clickable Icon for Unlink */}
                <button 
                    onClick={handleUnlink}
                    disabled={isUpdating}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                        isHovered 
                        ? 'bg-red-50 text-red-500' 
                        : 'bg-[#24A1DE]/10 text-[#24A1DE]'
                    }`}
                    title="Unlink Account"
                >
                    {isHovered ? (
                        /* Unlink Icon */
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    ) : (
                        /* Telegram Icon */
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.47-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                        </svg>
                    )}
                </button>

                {/* Username & Linked Date */}
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-gray-800 dark:text-white truncate leading-tight">
                        {config?.telegramUsername ? `@${config.telegramUsername}` : 'Linked'}
                    </span>
                    {config?.linkedAt && (
                        <span className="text-[8px] font-bold text-emerald-500 truncate leading-tight">
                            Linked: {formatDate(config.linkedAt)}
                        </span>
                    )}
                </div>
             </div>

             {/* Right: Compact Privacy Controls */}
             <div className="flex bg-gray-50 dark:bg-gray-800 p-0.5 rounded-lg flex-shrink-0">
                  <button
                    onClick={() => changeVisibility('public')}
                    disabled={isUpdating}
                    className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${
                      visibility === 'public' 
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    Public
                  </button>

                  <button
                    onClick={() => changeVisibility('notify_only')}
                    disabled={isUpdating}
                    className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${
                      visibility === 'notify_only' 
                        ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    Notify
                  </button>

                  <button
                    onClick={() => changeVisibility('private')}
                    disabled={isUpdating}
                    className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${
                      visibility === 'private' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
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
