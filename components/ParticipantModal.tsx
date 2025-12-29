
import React, { useState } from 'react';
import { Button } from './ui/Button';

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
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({ isOpen, onClose, data, isLoading, error }) => {
  const [isProjectsCollapsed, setIsProjectsCollapsed] = useState(true);

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

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20 dark:border-gray-800 ring-1 ring-black/5 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
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
              
              {/* Row 1: Login, Class, Level */}
              <div className="flex flex-wrap items-center justify-center gap-2 w-full pr-6">
                  {/* Login Title */}
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                    {data.login}
                  </h2>

                  {/* Class */}
                  <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 flex items-center">
                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-200 leading-none">{data.className || 'N/A'}</span>
                  </div>

                  {/* Level */}
                  <div className="px-2 py-1 bg-primary/5 border border-primary/20 rounded-md flex items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Lvl</span>
                    <span className="text-[10px] font-black text-primary dark:text-green-400 leading-none">{Math.floor(data.level)}</span>
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
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate pr-2">
                                {p.title}
                            </span>
                            <span className={`text-[7px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded border ${getStatusColor(p.status)} whitespace-nowrap`}>
                                {formatStatus(p.status)}
                            </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
