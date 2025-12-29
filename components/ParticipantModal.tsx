
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20 dark:border-gray-800 ring-1 ring-black/5 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="p-3 flex justify-end items-center bg-transparent absolute top-0 right-0 z-10">
           <button 
             onClick={onClose}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors backdrop-blur-sm"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>

        <div className="p-5 pt-8 space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse flex flex-col items-center">
               <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mb-2"></div>
               <div className="flex gap-2 w-full justify-center">
                  <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div className="h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
               </div>
               <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded-xl mt-4"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-xl text-center">
               <p className="text-sm text-red-500 font-bold">{error}</p>
            </div>
          ) : data ? (
            <div className="flex flex-col items-center gap-5">
              
              {/* Login Title */}
              <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight text-center">
                {data.login}
              </h2>

              {/* Compact Stats Grid */}
              <div className="flex flex-wrap justify-center gap-2 w-full">
                 
                 {/* Class */}
                 <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 min-w-[4rem]">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Class</span>
                    <span className="text-xs font-black text-gray-700 dark:text-gray-200 leading-none">{data.className || 'N/A'}</span>
                 </div>

                 {/* Level */}
                 <div className="flex flex-col items-center justify-center bg-primary/5 border border-primary/20 rounded-xl px-3 py-1.5 min-w-[3.5rem]">
                    <span className="text-[8px] font-bold text-primary/60 dark:text-green-400/60 uppercase tracking-wider mb-0.5">Level</span>
                    <span className="text-xs font-black text-primary dark:text-green-400 leading-none">{Math.floor(data.level)}</span>
                 </div>

                 {/* Coalition */}
                 <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 min-w-[5rem]">
                    <span className="text-[9px] font-black text-gray-800 dark:text-white leading-none mb-0.5">{data.coalition ? data.coalition.name : '-'}</span>
                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-wider leading-none">
                      Rank: {data.coalition ? (data.coalition.rank ?? '-') : '-'}
                    </span>
                 </div>

                 {/* PRP */}
                 <div className="flex flex-col items-center justify-center bg-blue-500/5 border border-blue-500/20 rounded-xl px-3 py-1.5 min-w-[3.5rem]">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 leading-none mb-0.5">{data.points?.peerReviewPoints || 0}</span>
                    <span className="text-[7px] font-bold text-blue-400/70 uppercase tracking-wider leading-none">PRP</span>
                 </div>

                 {/* Coins */}
                 <div className="flex flex-col items-center justify-center bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-1.5 min-w-[3.5rem]">
                    <span className="text-xs font-black text-amber-500 leading-none mb-0.5">{data.points?.coins || 0}</span>
                    <span className="text-[7px] font-bold text-amber-500/70 uppercase tracking-wider leading-none">Coin</span>
                 </div>

              </div>

              {/* Projects Block */}
              <div className="w-full flex flex-col bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setIsProjectsCollapsed(!isProjectsCollapsed)}
                  className="flex items-center justify-between w-full p-4 hover:bg-gray-100/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-baseline gap-2">
                      <h3 className="font-black text-gray-800 dark:text-white text-xs uppercase tracking-widest">
                          Active Projects
                      </h3>
                      <span className={`text-[10px] font-bold ${data.projects.length > 0 ? 'text-primary dark:text-green-400' : 'text-gray-400'}`}>
                          ({data.projects.length})
                      </span>
                  </div>
                  <div className={`text-gray-400 transition-transform duration-300 ${isProjectsCollapsed ? 'rotate-0' : '-rotate-180'}`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                  </div>
                </button>

                <div className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${isProjectsCollapsed ? 'max-h-0' : 'max-h-[300px] overflow-y-auto custom-scrollbar'}`}>
                  <div className="p-3 pt-0 space-y-2">
                    {data.projects.length === 0 ? (
                      <div className="text-center py-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          No active projects
                      </div>
                    ) : (
                      data.projects.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate pr-2">
                                {p.title}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded border ${getStatusColor(p.status)} whitespace-nowrap`}>
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
