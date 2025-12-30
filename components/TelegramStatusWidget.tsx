
import React, { useMemo, useState } from 'react';
import { Card } from './ui/Card';
import { TelegramConfig, TelegramVisibility } from '../types';
import { linkTelegramAccount, fetchTelegramSettings } from '../services/apiService';

interface TelegramStatusWidgetProps {
  config: TelegramConfig | null;
  loading: boolean;
}

export const TelegramStatusWidget: React.FC<TelegramStatusWidgetProps> = ({ config, loading }) => {
  // Local state for UI toggles (placeholders for now)
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [visibility, setVisibility] = useState<TelegramVisibility>(config?.visibility || 'private');
  const [isLinking, setIsLinking] = useState(false);

  // Telegram WebApp Data
  const tgWebApp = window.Telegram?.WebApp;
  const tgUser = tgWebApp?.initDataUnsafe?.user;
  const rawInitData = tgWebApp?.initData;

  // Detect alien device (Telegram ID mismatch)
  const idMismatch = useMemo(() => {
    if (!config?.isLinked || !config.telegramId) return false;
    // Safely access Telegram WebApp
    const currentTgId = tgUser?.id;
    if (!currentTgId) return false; // If not in TG, can't verify mismatch
    return config.telegramId !== currentTgId;
  }, [config, tgUser]);

  const handleManualLink = async () => {
     setIsLinking(true);
     try {
        const token = localStorage.getItem('s21_auth_token');
        if (token) {
           await linkTelegramAccount(token);
           // We can't easily update parent state from here without a callback, 
           // but we can reload the page or just let the user know.
           // Ideally, we would have an onUpdate prop, but sticking to minimal changes:
           window.location.reload(); 
        }
     } catch (e) {
        alert("Failed to link: " + e);
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
    <Card className="shadow-xl border-none rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-800 ring-1 ring-black/5 h-full">
      <div className="flex flex-col gap-3 p-2">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
             <div className="p-1.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
               </svg>
             </div>
             <div className="flex flex-col">
                <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">Telegram</h3>
                <span className="text-[8px] text-gray-400 font-bold uppercase">Integration</span>
             </div>
          </div>
          <div className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-tight ${isLinked ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
            {isLinked ? 'Linked' : 'Not Linked'}
          </div>
        </div>

        {/* Content */}
        {!isLinked ? (
          <div className="py-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2">
             <div className="text-gray-300 dark:text-gray-600">
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
             </div>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
               No account connected
             </p>
             
             {rawInitData && (
                <button 
                  onClick={handleManualLink}
                  disabled={isLinking}
                  className="mt-1 px-4 py-2 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                   {isLinking ? 'Linking...' : 'Connect Telegram'}
                </button>
             )}
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* User Info / Alien Check */}
            <div className={`p-3 rounded-xl border ${idMismatch ? 'bg-red-500/5 border-red-500/20' : 'bg-sky-500/5 border-sky-100 dark:border-sky-900/20'}`}>
               <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Connected Account</span>
                     <span className={`text-sm font-black ${idMismatch ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                        {config?.telegramUsername ? `@${config.telegramUsername}` : `ID: ${config?.telegramId}`}
                     </span>
                     {config?.linkedAt && (
                       <span className="text-[9px] text-gray-400 mt-0.5">
                         Linked: {new Date(config.linkedAt).toLocaleDateString()}
                       </span>
                     )}
                  </div>
                  {idMismatch && (
                    <div className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase shadow-sm">
                      Alien Device
                    </div>
                  )}
               </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

            {/* Settings Area */}
            <div className="space-y-3">
               <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Settings</h4>
               
               <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">Profile Visibility</span>
                     <span className="text-[8px] text-gray-400">Who can see you</span>
                  </div>
                  
                  {/* Pseudo Dropdown/Toggle for Visibility */}
                  <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
                     {(['public', 'private'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setVisibility(v)}
                          className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${visibility === v ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                          {v}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">Notifications</span>
                     <span className="text-[8px] text-gray-400">Allow bot messages</span>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button 
                    onClick={() => setAllowNotifications(!allowNotifications)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${allowNotifications ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${allowNotifications ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </button>
               </div>
            </div>

          </div>
        )}

        {/* DEBUG DATA SECTION */}
        <div className="mt-4 p-2.5 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <h5 className="text-[8px] font-black text-gray-500 uppercase mb-1">DEBUG DATA</h5>
            <div className="text-[8px] font-mono text-emerald-400 flex flex-col gap-1">
                <div className="flex justify-between">
                    <span className="opacity-50">TG WebApp:</span>
                    <span>{rawInitData ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="opacity-50">WebApp User ID:</span>
                    <span>{tgUser?.id || 'null'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="opacity-50">Backend Linked:</span>
                    <span className={config?.isLinked ? 'text-emerald-400' : 'text-red-400'}>{config?.isLinked ? 'YES' : 'NO'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="opacity-50">Backend TG ID:</span>
                    <span>{config?.telegramId || 'null'}</span>
                </div>
                <div className="flex justify-between border-t border-gray-800 pt-1 mt-1">
                    <span className="opacity-50">ID Mismatch:</span>
                    <span className={idMismatch ? 'text-red-400' : 'text-gray-400'}>{idMismatch ? 'YES' : 'NO'}</span>
                </div>
            </div>
        </div>
      </div>
    </Card>
  );
};
