
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { ProjectParticipantsSearch } from './ProjectParticipantsSearch';
import { PeerSearch } from './PeerSearch';

interface UnifiedSearchProps {
  token: string;
  campusId?: string;
}

export const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ token, campusId }) => {
  const [mode, setMode] = useState<'projects' | 'peers'>('projects');

  return (
    <Card className="shadow-2xl border-none rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl overflow-visible border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all h-full">
       {/* Header with Toggle */}
       <div className="flex items-center justify-between px-1 mb-2 lg:mb-4">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto">
             <button 
                onClick={() => setMode('projects')} 
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] lg:text-xs font-black uppercase tracking-wide transition-all ${mode === 'projects' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
             >
                Projects
             </button>
             <button 
                onClick={() => setMode('peers')} 
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] lg:text-xs font-black uppercase tracking-wide transition-all ${mode === 'peers' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
             >
                Peers
             </button>
          </div>
       </div>

       {mode === 'projects' ? (
          <ProjectParticipantsSearch token={token} campusId={campusId} headless />
       ) : (
          <PeerSearch token={token} headless />
       )}
    </Card>
  );
};
