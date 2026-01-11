
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from './ui/Card';
import { fetchData, fetchPeersList } from '../services/apiService';
import { ParticipantModal } from './ParticipantModal';

interface PeerSearchProps {
  token: string;
  headless?: boolean;
}

interface PeerItem {
  school_login: string;
  visibility: string;
}

const CACHE_KEY = 's21_tg_connected_cache';
const CACHE_TIMESTAMP_KEY = 's21_tg_connected_cache_timestamp';

export const PeerSearch: React.FC<PeerSearchProps> = ({ token, headless = false }) => {
  const [query, setQuery] = useState('');
  
  // Initialize from cache if available to show data immediately
  const [allPeers, setAllPeers] = useState<PeerItem[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached).sort((a: PeerItem, b: PeerItem) => a.school_login.localeCompare(b.school_login));
      }
    } catch (e) {
      console.warn("Failed to parse peer cache", e);
    }
    return [];
  });

  // If we have cached data, we aren't "loading" in the blocking sense, 
  // but we might be "updating" in the background.
  const [isLoading, setIsLoading] = useState(allPeers.length === 0);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  const loadPeers = async () => {
    if (allPeers.length === 0) setIsLoading(true);
    
    try {
      const data = await fetchPeersList(token);
      
      // Save to Cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());

      // Sort alphabetically for better UX
      setAllPeers(data.sort((a, b) => a.school_login.localeCompare(b.school_login)));
    } catch (e) {
      console.error("Failed to update peers list", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPeers();
  }, [token]);

  const filteredPeers = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return allPeers;
    return allPeers.filter(p => p.school_login.toLowerCase().includes(term));
  }, [allPeers, query]);

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

  const renderStatusDot = (visibility: string) => {
    let colorClass = 'bg-gray-400';
    let title = 'Private';

    if (visibility === 'public') {
      colorClass = 'bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.5)]';
      title = 'Public';
    } else if (visibility === 'notify_only') {
      colorClass = 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]';
      title = 'Notify Only';
    }

    return (
      <div 
        className={`w-2 h-2 rounded-full ${colorClass}`} 
        title={title}
      />
    );
  };

  const ContentWrapper = headless ? 'div' : Card;
  const wrapperProps = headless 
    ? { className: "h-full w-full" } 
    : { className: "shadow-2xl border-none rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl overflow-visible border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all h-full mt-4" };

  return (
    <>
      <ContentWrapper {...wrapperProps}>
        <div className="flex flex-col gap-2 lg:gap-6">
          {/* Header */}
          <div className={`flex items-center justify-between gap-2 px-1 ${headless ? 'mb-2' : ''}`}>
            {!headless && (
              <div className="flex flex-col min-w-0">
                <h3 className="text-xs lg:text-base font-black text-gray-800 dark:text-white uppercase tracking-tighter truncate">Peer Search</h3>
                <p className="text-[7px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60 truncate">Connected Peers</p>
              </div>
            )}
            
            <div className={`flex items-center gap-2 lg:gap-3 ${headless ? 'w-full justify-end' : ''}`}>
               {isLoading ? (
                  <div className="px-1.5 lg:px-3 py-0.5 lg:py-1 bg-blue-500/10 rounded-lg lg:rounded-xl border border-blue-500/20 flex items-center gap-1 lg:gap-2 shadow-sm">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                    <span className="text-[7px] lg:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">LOADING</span>
                  </div>
               ) : (
                  <div className="px-1.5 lg:px-3 py-0.5 lg:py-1 bg-emerald-500/10 rounded-lg lg:rounded-xl border border-emerald-500/20 flex items-center gap-1 lg:gap-2 shadow-sm">
                    <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[7px] lg:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">READY</span>
                  </div>
               )}

               <button 
                  onClick={loadPeers}
                  disabled={isLoading}
                  className={`p-1 lg:p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                  title="Refresh Peers List"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 lg:h-3.5 lg:w-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
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
                    if(listRef.current) listRef.current.scrollTop = 0;
                }}
                placeholder="Search by login..."
                className="w-full pl-8 lg:pl-10 pr-4 py-2 lg:py-3 rounded-xl lg:rounded-2xl border-none bg-gray-100 dark:bg-gray-800 text-[10px] lg:text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:text-white shadow-inner"
              />
          </div>

          {/* List Area */}
          <div 
             ref={listRef}
             className="min-h-[50px] max-h-[250px] overflow-y-auto pr-0.5 custom-scrollbar px-0.5 scroll-smooth"
          >
            {isLoading && allPeers.length === 0 && (
              <div className="flex flex-col items-center py-4">
                <div className="w-4 h-4 border-2 border-primary/10 border-t-primary rounded-full animate-spin mb-1"></div>
                <span className="text-[6px] font-black text-gray-400 uppercase tracking-widest">Loading Peers...</span>
              </div>
            )}

            {!isLoading && filteredPeers.length === 0 && (
                <div className="text-center py-4">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">No peers found</span>
                </div>
            )}

            {filteredPeers.length > 0 && (
              <div className={`space-y-1 ${isLoading && allPeers.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                 {filteredPeers.map((peer) => (
                    <button
                        key={peer.school_login}
                        onClick={() => handleViewParticipant(peer.school_login)}
                        className="w-full flex items-center justify-between p-2 lg:p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl lg:rounded-2xl border border-white/40 dark:border-gray-800/40 hover:border-primary/30 hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-md transition-all group shadow-sm cursor-pointer text-left"
                    >
                        {/* Name Left */}
                        <span className="text-[10px] lg:text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight truncate pl-1">
                          {peer.school_login}
                        </span>
                        
                        {/* Dot & Arrow Right */}
                        <div className="flex items-center gap-2">
                           {renderStatusDot(peer.visibility)}
                           
                           <div className="text-gray-300 group-hover:text-primary transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                             </svg>
                           </div>
                        </div>
                    </button>
                 ))}
              </div>
            )}
          </div>
        </div>
      </ContentWrapper>

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
