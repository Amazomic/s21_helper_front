
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from './ui/Card';
import { fetchData, fetchPeersList } from '../services/apiService';
import { ParticipantModal } from './ParticipantModal';

interface PeerSearchProps {
  token: string;
}

interface PeerItem {
  school_login: string;
  visibility: string;
}

export const PeerSearch: React.FC<PeerSearchProps> = ({ token }) => {
  const [query, setQuery] = useState('');
  const [allPeers, setAllPeers] = useState<PeerItem[]>([]);
  const [visibleLimit, setVisibleLimit] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPeers = async () => {
      setIsLoading(true);
      const data = await fetchPeersList(token);
      // Sort alphabetically for better UX
      setAllPeers(data.sort((a, b) => a.school_login.localeCompare(b.school_login)));
      setIsLoading(false);
    };
    loadPeers();
  }, [token]);

  const filteredPeers = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return allPeers;
    return allPeers.filter(p => p.school_login.toLowerCase().includes(term));
  }, [allPeers, query]);

  const visiblePeers = useMemo(() => {
    return filteredPeers.slice(0, visibleLimit);
  }, [filteredPeers, visibleLimit]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 20; // +20px buffer
    if (bottom && visibleLimit < filteredPeers.length) {
       setVisibleLimit(prev => Math.min(prev + 10, filteredPeers.length));
    }
  };

  const handleViewParticipant = async (login: string) => {
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setModalData(null);

    try {
      const [userData, progressData, reviewsData, pointsData, coalitionRes] = await Promise.all([
        fetchData(`/v1/participants/${login}`, token),
        fetchData(`/v1/participants/${login}/projects?limit=50&offset=0&status=IN_PROGRESS`, token),
        fetchData(`/v1/participants/${login}/projects?limit=50&offset=0&status=IN_REVIEWS`, token),
        fetchData(`/v1/participants/${login}/points`, token).catch(() => null),
        fetchData(`/v1/participants/${login}/coalition`, token).catch(() => null),
      ]);

      const projects = [
        ...(progressData?.projects || []),
        ...(reviewsData?.projects || [])
      ];

      const uniqueProjects = Array.from(new Map(projects.map((p: any) => [p.id, p])).values());

      let coalition = null;
      if (Array.isArray(coalitionRes) && coalitionRes.length > 0) {
        coalition = coalitionRes[0];
      } else if (coalitionRes && !Array.isArray(coalitionRes)) {
        coalition = coalitionRes;
      }

      setModalData({
        login: userData.login,
        level: userData.level,
        className: userData.className,
        projects: uniqueProjects,
        points: pointsData,
        coalition: coalition
      });
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <Card className="shadow-2xl border-none rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl overflow-visible border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all h-full mt-4">
        <div className="flex flex-col gap-2 lg:gap-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex flex-col min-w-0">
              <h3 className="text-xs lg:text-base font-black text-gray-800 dark:text-white uppercase tracking-tighter truncate">Peer Search</h3>
              <p className="text-[7px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60 truncate">Connected Peers</p>
            </div>
            
            <div className="flex items-center gap-1">
               <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700">
                  {allPeers.length}
               </span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative group px-0.5">
              <div className="absolute inset-y-0 left-2.5 lg:left-4 flex items-center pointer-events-none z-10">
                <svg className="w-3 h-3 lg:w-4 lg:h-4 text-primary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => { 
                    setQuery(e.target.value); 
                    setVisibleLimit(5); // Reset scroll on search
                    if(listRef.current) listRef.current.scrollTop = 0;
                }}
                placeholder="Search by login..."
                className="w-full pl-8 lg:pl-10 pr-4 py-2 lg:py-3 rounded-xl lg:rounded-2xl border-none bg-gray-100 dark:bg-gray-800 text-[10px] lg:text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:text-white shadow-inner"
              />
          </div>

          {/* List Area */}
          <div 
             ref={listRef}
             onScroll={handleScroll}
             className="min-h-[50px] max-h-[250px] overflow-y-auto pr-0.5 custom-scrollbar px-0.5 scroll-smooth"
          >
            {isLoading && (
              <div className="flex flex-col items-center py-4">
                <div className="w-4 h-4 border-2 border-primary/10 border-t-primary rounded-full animate-spin mb-1"></div>
                <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Loading Peers...</span>
              </div>
            )}

            {!isLoading && visiblePeers.length === 0 && (
                <div className="text-center py-4">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">No peers found</span>
                </div>
            )}

            {!isLoading && visiblePeers.length > 0 && (
              <div className="space-y-1">
                 {visiblePeers.map((peer) => (
                    <button
                        key={peer.school_login}
                        onClick={() => handleViewParticipant(peer.school_login)}
                        className="w-full flex items-center justify-between p-2 lg:p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl lg:rounded-2xl border border-white/40 dark:border-gray-800/40 hover:border-primary/30 hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-md transition-all group shadow-sm cursor-pointer text-left"
                    >
                        <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${peer.visibility === 'public' ? 'bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.5)]' : 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]'}`} title={peer.visibility === 'public' ? 'Public' : 'Notify Only'}></div>
                             <span className="text-[10px] lg:text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight truncate">{peer.school_login}</span>
                        </div>
                        
                        <div className="text-gray-300 group-hover:text-primary transition-colors">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                           </svg>
                        </div>
                    </button>
                 ))}
                 
                 {visibleLimit < filteredPeers.length && (
                    <div className="py-2 text-center opacity-50">
                        <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin mx-auto"></div>
                    </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <ParticipantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData}
        isLoading={modalLoading}
        error={modalError}
        token={token}
      />
    </>
  );
};
