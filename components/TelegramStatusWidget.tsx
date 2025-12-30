
import React, { useState } from 'react';
import { Card } from './ui/Card';
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
      alert("Please open this app inside Telegram to link your account.");
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
      <Card className="h-32 animate-pulse rounded-3xl">
        <div className="flex justify-between items-center mb-4">
           <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
           <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded mb-2"></div>
        <div className="h-8 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
      </Card>
    );
  }

  const isLinked = config?.isLinked === true;
  const visibility = config?.visibility || 'public'; 
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <Card className="shadow-xl border-none rounded-[1.5rem] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all">
       {/* Header */}
       <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
            <div className={`p-1 rounded-full ${isLinked ? 'bg-sky-500/10 text-sky-500' : 'bg-gray-100 text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                </svg>
            </div>
            <h3 className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-wider">Telegram</h3>
        </div>
        <div className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-tight ${isLinked ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
            {isLinked ? 'Linked' : 'No Link'}
        </div>
      </div>

      <div className="p-3">
         {!isLinked ? (
            <div className="flex flex-col gap-2">
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight">
                     Connect to allow peers to contact you.
                  </p>
                  <Button 
                    onClick={handleLink} 
                    isLoading={isUpdating} 
                    disabled={!isTelegramContext}
                    className="w-full text-[10px] py-1.5 font-bold uppercase tracking-wide shadow-md shadow-primary/20 h-8"
                  >
                    Connect
                  </Button>
                  {!isTelegramContext && <span className="text-[8px] text-red-400 text-center">(Open in Telegram)</span>}
            </div>
         ) : (
            <div className="space-y-3">
               {/* Identity Row */}
               <div className="flex items-start justify-between">
                  <div className="flex flex-col min-w-0 pr-2">
                     <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Connected as</span>
                     <span className="text-sm font-black text-gray-800 dark:text-white truncate -mt-0.5">
                         {config?.telegramUsername ? `@${config.telegramUsername}` : (config?.telegramId ? `ID: ${config.telegramId}` : 'User')}
                     </span>
                     {config?.linkedAt && (
                       <span className="text-[8px] text-gray-400 font-mono mt-0.5">
                         {formatDate(config.linkedAt)}
                       </span>
                     )}
                  </div>
                  <button 
                    onClick={handleUnlink} 
                    disabled={isUpdating} 
                    className="text-[9px] font-bold text-red-400 hover:text-red-500 px-2 py-1 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/10"
                  >
                      Unlink
                  </button>
               </div>

               {/* Compact Privacy Switcher */}
               <div className="space-y-1.5">
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Privacy</span>
                   <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                       
                       <button
                         onClick={() => changeVisibility('public')}
                         disabled={isUpdating}
                         className={`py-1.5 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                           visibility === 'public' 
                             ? 'bg-white dark:bg-gray-700 text-primary dark:text-white shadow-sm ring-1 ring-black/5' 
                             : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                         }`}
                       >
                         Public
                       </button>

                       <button
                         onClick={() => changeVisibility('notify_only')}
                         disabled={isUpdating}
                         className={`py-1.5 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                           visibility === 'notify_only' 
                             ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-white shadow-sm ring-1 ring-black/5' 
                             : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                         }`}
                       >
                         Notify
                       </button>

                       <button
                         onClick={() => changeVisibility('private')}
                         disabled={isUpdating}
                         className={`py-1.5 rounded-md text-[9px] font-black uppercase transition-all flex items-center justify-center gap-1 ${
                           visibility === 'private' 
                             ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm ring-1 ring-black/5' 
                             : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                         }`}
                       >
                         Private
                       </button>
                   </div>
               </div>
            </div>
         )}
      </div>
    </Card>
  );
};
