
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import { getPeerTelegramInfo, notifyPeer } from '../services/apiService';
import { PeerTelegramInfo } from '../types';

interface Project {
  id: number;
  title: string;
  status: string;
}

interface ParticipantData {
  login: string;
  level: number;
  className: string;
  projects: Project[];
  points?: {
    peerReviewPoints: number;
    coins: number;
  };
  coalition?: {
    name: string;
    rank: string | null;
  };
}

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ParticipantData | null;
  isLoading: boolean;
  error: string | null;
  token?: string;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({ isOpen, onClose, data, isLoading, error, token = null }) => {
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(true);
  
  // Peer Interaction State
  const [peerInfo, setPeerInfo] = useState<PeerTelegramInfo | null>(null);
  const [loadingPeer, setLoadingPeer] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen && data?.login) {
       // Reset state
       setPeerInfo(null);
       setNotifyStatus('idle');

       // Check local cache to see if this peer has Telegram linked
       // This prevents 404 requests for users who are not linked
       let shouldFetch = false;
       try {
         const cached = localStorage.getItem('s21_tg_connected_cache');
         if (cached) {
           const peers = JSON.parse(cached);
           if (Array.isArray(peers) && peers.some((p: any) => p.school_login === data.login)) {
             shouldFetch = true;
           }
         }
       } catch (e) {
         // If cache fails, default to not fetching to be safe, or could default to true. 
         // Given the 404 issue, defaulting to false (safe) is better if list is supposed to be comprehensive.
         console.warn("Error reading peers cache in modal", e);
       }

       if (!shouldFetch) {
         setLoadingPeer(false);
         return;
       }

       setLoadingPeer(true);

       // Check peer availability
       getPeerTelegramInfo(data.login, token)
         .then(info => setPeerInfo(info))
         .catch(() => setPeerInfo({ found: false }))
         .finally(() => setLoadingPeer(false));
    }
  }, [isOpen, data?.login, token]);

  const handleNotify = async () => {
    if (!data?.login) return;
    setNotifyLoading(true);
    setNotifyStatus('idle');
    try {
       await notifyPeer(data.login, token);
       setNotifyStatus('success');
    } catch (e) {
       console.error(e);
       setNotifyStatus('error');
    } finally {
       setNotifyLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    // Dispatch event to switch search context to this project
    window.dispatchEvent(new CustomEvent('s21:select_project', { 
        detail: { id: project.id, code: project.title, name: project.title } 
    }));
    onClose();
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'IN_REVIEWS': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'WAITING_FOR_CORRECTION': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20 dark:border-gray-800 ring-1 ring-black/5 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Class Name - Top Left */}
        {data && (
           <div className="absolute top-3 left-4 z-50">
             <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
               {data.className || 'N/A'}
             </span>
           </div>
        )}

        {/* Small Top-Right Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300 transition-colors z-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 pt-8 space-y-4">
          {isLoading ? (
            <div className="space-y-4 animate-pulse flex flex-col items-center">
               <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-1"></div>
               <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
               <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded-xl mt-2"></div>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-center">
               <p className="text-xs text-red-500 font-bold">{error}</p>
            </div>
          ) : data ? (
            <div className="flex flex-col items-center gap-3">
              
              {/* Row 1: Login + Level superscript */}
              <div className="flex items-start justify-center w-full mt-1">
                  <div className="flex items-start">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                      {data.login}
                    </h2>
                    <div className="flex items-baseline ml-0.5 -mt-1">
                        <span className="text-[10px] lg:text-[12px] font-black text-primary dark:text-green-400 leading-none">
                            {Math.floor(data.level)}
                        </span>
                        <span className="text-[4px] lg:text-[7px] font-bold text-gray-400 dark:text-gray-500 uppercase leading-none ml-0.5">
                            lvl
                        </span>
                    </div>
                  </div>
              </div>

              {/* Row 2: Stats (Coalition, PRP, Coins) */}
              <div className="flex flex-wrap justify-center gap-1.5 w-full">
                 {/* Coalition */}
                 <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-gray-800 dark:text-white leading-none">{data.coalition ? data.coalition.name : '-'}</span>
                    {data.coalition && (
                      <>
                        <span className="w-0.5 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">R:{data.coalition.rank ?? '-'}</span>
                      </>
                    )}
                 </div>

                 {/* PRP */}
                 <div className="px-2 py-1 bg-blue-500/5 border border-blue-500/20 rounded-md flex items-center gap-1">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 leading-none">{data.points?.peerReviewPoints || 0}</span>
                    <span className="text-[10px] font-bold text-blue-400/70 uppercase leading-none">PRP</span>
                 </div>

                 {/* Coins */}
                 <div className="px-2 py-1 bg-amber-500/5 border border-amber-500/20 rounded-md flex items-center gap-1">
                    <span className="text-[10px] font-black text-amber-500 leading-none">{data.points?.coins || 0}</span>
                    <span className="text-[10px] font-bold text-amber-500/70 uppercase leading-none">Coin</span>
                 </div>
              </div>

              {/* Telegram Contact Actions */}
              {!loadingPeer && peerInfo?.found && (
                <div className="w-full mt-1">
                    {peerInfo.can_message && peerInfo.telegram_username ? (
                         <a 
                           href={`https://t.me/${peerInfo.telegram_username}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-xs uppercase tracking-wide hover:bg-sky-600 active:scale-95 transition-all shadow-md shadow-sky-500/20"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                            </svg>
                            Message in Telegram
                         </a>
                    ) : peerInfo.can_notify ? (
                         <Button 
                           onClick={handleNotify} 
                           isLoading={notifyLoading}
                           disabled={notifyStatus === 'success'}
                           className={`w-full py-2.5 text-xs uppercase tracking-wide ${notifyStatus === 'success' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-800 text-white dark:bg-white dark:text-gray-900'}`}
                         >
                            {notifyStatus === 'success' ? 'Notification Sent!' : notifyStatus === 'error' ? 'Failed to Notify' : 'Notify via Bot'}
                         </Button>
                    ) : null}
                    
                    {notifyStatus === 'success' && (
                        <p className="text-[9px] text-emerald-500 text-center font-bold mt-1 animate-in fade-in">
                           The bot has sent a message to {data.login}.
                        </p>
                    )}
                </div>
              )}

              {/* Projects Block */}
              <div className="w-full flex flex-col bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden transition-all duration-300 mt-1">
                <button 
                  onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
                  className="flex items-center justify-between w-full p-3 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-baseline gap-2">
                      <h3 className="font-black text-gray-800 dark:text-white text-[10px] uppercase tracking-widest">
                          Projects
                      </h3>
                      <span className={`text-[9px] font-bold ${data.projects.length > 0 ? 'text-primary dark:text-green-400' : 'text-gray-400'}`}>
                          ({data.projects.length})
                      </span>
                  </div>
                  <div className={`text-gray-400 transition-transform duration-300 ${isProjectsCollapsed ? 'rotate-0' : '-rotate-180'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                  </div>
                </button>

                <div className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${isProjectsCollapsed ? 'max-h-0' : 'max-h-[300px] overflow-y-auto custom-scrollbar'}`}>
                  <div className="p-2 pt-0 space-y-1.5">
                    {data.projects.length === 0 ? (
                      <div className="text-center py-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          No active projects
                      </div>
                    ) : (
                      data.projects.map((p) => (
                        <button 
                          key={p.id} 
                          onClick={() => handleProjectClick(p)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-primary/50 dark:hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer group"
                        >
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate pr-2 group-hover:text-primary transition-colors">
                                {p.title}
                            </span>
                            <span className={`text-[7px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded border ${getStatusColor(p.status)} whitespace-nowrap`}>
                                {formatStatus(p.status)}
                            </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};
