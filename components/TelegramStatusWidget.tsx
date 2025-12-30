
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { TelegramConfig } from '../types';
import { linkTelegramAccount } from '../services/apiService';

interface TelegramStatusWidgetProps {
  config: TelegramConfig | null;
  loading: boolean;
}

export const TelegramStatusWidget: React.FC<TelegramStatusWidgetProps> = ({ config, loading }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Telegram WebApp Data
  const tgWebApp = window.Telegram?.WebApp;
  const rawInitData = tgWebApp?.initData;
  // If rawInitData is empty string or undefined, we are NOT in Telegram (or session is invalid)
  const isTelegramContext = !!rawInitData;

  const handleManualLink = async () => {
     if (!isTelegramContext) return;

     setIsLinking(true);
     setLinkError(null);
     try {
        const token = localStorage.getItem('s21_auth_token');
        if (token) {
           await linkTelegramAccount(token);
           // After successful link, reload to fetch fresh state/settings
           window.location.reload(); 
        } else {
           setLinkError("No School Token found. Relogin.");
        }
     } catch (e: any) {
        setLinkError(e.message || "Unknown Error");
     } finally {
        setIsLinking(false);
     }
  };

  if (loading) {
    return (
      <Card className="h-40 animate-pulse rounded-3xl">
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded"></div>
          <div className="h-2 w-2/3 bg-gray-100 dark:bg-gray-800 rounded"></div>
        </div>
      </Card>
    );
  }

  const isLinked = config?.isLinked;

  return (
    <Card className="shadow-2xl border-none rounded-[2rem] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all">
       <div className="flex items-center justify-between px-2 pt-2 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${isLinked ? 'bg-sky-500/10 text-sky-500' : 'bg-gray-100 text-gray-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                </svg>
            </div>
            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">Telegram</h3>
        </div>
        <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-tight ${isLinked ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
            {isLinked ? 'Linked' : 'Not Linked'}
        </div>
      </div>

      <div className="p-4 space-y-4">
         {!isLinked ? (
            <div className="flex flex-col gap-3">
               {isTelegramContext ? (
                  <>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                        Link your account to receive notifications and quick access.
                     </p>
                     
                     {linkError && (
                       <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-2 rounded-lg break-words">
                         <p className="text-[9px] font-mono text-red-600 dark:text-red-400 leading-tight">{linkError}</p>
                       </div>
                     )}

                     <Button 
                        onClick={handleManualLink} 
                        isLoading={isLinking}
                        className="py-2 text-xs"
                     >
                        Connect Telegram
                     </Button>
                  </>
               ) : (
                  <div className="flex flex-col items-center justify-center py-2 opacity-50">
                     <p className="text-[10px] text-gray-400 italic text-center">
                        Open this app in Telegram to link your account.
                     </p>
                  </div>
               )}
            </div>
         ) : (
            <div className="flex items-center justify-between bg-gray-50 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
               <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">Connected as</span>
                  <span className="text-[11px] font-black text-gray-800 dark:text-gray-200">
                      {config?.telegramUsername ? `@${config.telegramUsername}` : (config?.telegramId ? `ID: ${config.telegramId}` : 'Telegram User')}
                  </span>
               </div>
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            </div>
         )}
      </div>
    </Card>
  );
};
