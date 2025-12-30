
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/Card';
import { fetchData } from '../services/apiService';
import { ParticipantModal } from './ParticipantModal';
import { TelegramConfig } from '../types';

interface ProjectParticipantsSearchProps {
  token: string;
  campusId?: string;
  telegramConfig?: TelegramConfig | null;
}

interface NormalizedProject {
  id: number;
  name: string;
  code: string;
}

interface Campus {
  id: string;
  shortName: string;
  fullName: string;
}

export const ProjectParticipantsSearch: React.FC<ProjectParticipantsSearchProps> = ({ token, campusId: initialCampusId, telegramConfig }) => {
  const [query, setQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_REVIEWS');
  const [selectedCampusId, setSelectedCampusId] = useState<string>(initialCampusId || '');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0); 
  
  // New state for cache loading
  const [isCacheLoading, setIsCacheLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const statuses = ['ASSIGNED', 'REGISTERED', 'IN_PROGRESS', 'IN_REVIEWS', 'ACCEPTED', 'FAILED'];

  // Check cache presence and auto-load if missing
  useEffect(() => {
    const checkAndLoadCache = async () => {
      const hasGraph = !!localStorage.getItem('s21_graph_cache');
      const hasCampuses = !!localStorage.getItem('s21_campuses_cache');

      if (!hasGraph || !hasCampuses) {
        await handleRefreshCache();
      }
    };
    checkAndLoadCache();
  }, []); // Run once on mount

  useEffect(() => {
    const check = () => setCacheVersion(v => v + 1);
    window.addEventListener('focus', check);
    const interval = setInterval(check, 3000);
    return () => {
      window.removeEventListener('focus', check);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowCampusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProjectsFromCache = (): NormalizedProject[] => {
    try {
      const cached = localStorage.getItem('s21_graph_cache');
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      const allProjects: NormalizedProject[] = [];
      const graphData = parsed.response || parsed;
      const nodes = graphData.nodes || [];

      nodes.forEach((node: any) => {
        if (Array.isArray(node.items)) {
          node.items.forEach((item: any) => {
            if (item.entityId && item.code && item.entityType === 'PROJECT') {
              allProjects.push({
                id: Number(item.entityId),
                name: node.label || item.code,
                code: String(item.code)
              });
            }
          });
        }
      });
      return allProjects;
    } catch (e) { return []; }
  };

  const getCampusesFromCache = (): Campus[] => {
    try {
      const cached = localStorage.getItem('s21_campuses_cache');
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      const data = parsed.response || parsed;
      return Array.isArray(data.campuses) ? data.campuses : [];
    } catch (e) { return []; }
  };

  const projects = useMemo(() => getProjectsFromCache(), [cacheVersion]);
  const campuses = useMemo(() => getCampusesFromCache(), [cacheVersion]);

  const cacheStatus = useMemo(() => {
    const hasProjects = projects.length > 0;
    const hasCampuses = campuses.length > 0;
    if (hasProjects && hasCampuses) return 'READY';
    if (hasProjects || hasCampuses) return 'PARTIAL';
    return 'MISSING';
  }, [projects, campuses]);

  const handleRefreshCache = async () => {
    if (isCacheLoading) return;
    setIsCacheLoading(true);
    try {
      // Fetch graph and campuses in parallel
      const [graphData, campusesData] = await Promise.all([
        fetchData('/v1/graph', token),
        fetchData('/v1/campuses', token)
      ]);

      localStorage.setItem('s21_graph_cache', JSON.stringify(graphData));
      localStorage.setItem('s21_graph_cache_timestamp', new Date().toISOString());

      localStorage.setItem('s21_campuses_cache', JSON.stringify(campusesData));
      localStorage.setItem('s21_campuses_cache_timestamp', new Date().toISOString());

      // Force update local state
      setCacheVersion(v => v + 1);
    } catch (e) {
      console.error("Failed to refresh global cache", e);
    } finally {
      setIsCacheLoading(false);
    }
  };

  const suggestions = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (term.length < 2) return [];
    const selected = projects.find(p => p.id === selectedProjectId);
    if (selected && query === selected.code) return [];

    return projects
      .filter((p) => 
        p.code.toLowerCase().includes(term) || 
        p.name.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [query, projects, selectedProjectId]);

  const fetchParticipants = useCallback(async (projectId: number, status: string, cId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/v1/projects/${projectId}/participants?limit=100&offset=0`;
      if (status) url += `&status=${status}`;
      if (cId) url += `&campusId=${cId}`;

      const data = await fetchData(url, token);
      const list = data?.participants || [];
      setResults(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchParticipants(selectedProjectId, selectedStatus, selectedCampusId);
    }
  }, [selectedProjectId, selectedStatus, selectedCampusId, fetchParticipants]);

  const handleSelectProject = (p: NormalizedProject) => {
    setQuery(p.code);
    setSelectedProjectId(p.id);
    setShowSuggestions(false);
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

      // Remove duplicates if any
      const uniqueProjects = Array.from(new Map(projects.map((p: any) => [p.id, p])).values());

      // Normalize coalition data
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

  // Logic to detect alien device usage (Telegram ID mismatch)
  const idMismatch = useMemo(() => {
    if (!telegramConfig?.isLinked || !telegramConfig.telegramId) return false;
    const currentTgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (!currentTgId) return false;
    return telegramConfig.telegramId !== currentTgId;
  }, [telegramConfig]);

  return (
    <>
      <div ref={containerRef} className="w-full">
        <Card className="shadow-2xl border-none rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl overflow-visible border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all">
          <div className="flex flex-col gap-2 lg:gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-1">
              {/* Left Side: Title */}
              <div className="flex flex-col min-w-0">
                <h3 className="text-xs lg:text-base font-black text-gray-800 dark:text-white uppercase tracking-tighter truncate">Project Search</h3>
                <p className="text-[7px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60 truncate">Find participants</p>
              </div>
              
              {/* Right Side: Telegram Info & Cache Controls */}
              <div className="flex-shrink-0 flex items-center gap-2 lg:gap-3">
                
                {/* Telegram Status Badge */}
                {telegramConfig?.isLinked ? (
                   <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${idMismatch ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-sky-500/10 border-sky-500/20 text-sky-600'}`}>
                      {/* Icon */}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                         {idMismatch 
                            ? <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            : <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                         }
                      </svg>
                      
                      <div className="flex flex-col">
                         <span className="text-[9px] font-black uppercase leading-none">
                            {idMismatch ? 'Alien Device' : (telegramConfig.telegramUsername || `ID: ${telegramConfig.telegramId}`)}
                         </span>
                         {telegramConfig.linkedAt && !idMismatch && (
                            <span className="text-[7px] opacity-70 leading-none mt-0.5">
                               since {new Date(telegramConfig.linkedAt).toLocaleDateString()}
                            </span>
                         )}
                      </div>
                   </div>
                ) : (
                   <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400">
                      <span className="text-[9px] font-bold uppercase">No Telegram</span>
                   </div>
                )}

                {/* Cache Status & Refresh */}
                <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-2 lg:pl-3">
                    {isCacheLoading ? (
                      <div className="px-1.5 lg:px-3 py-0.5 lg:py-1 bg-blue-500/10 rounded-lg lg:rounded-xl border border-blue-500/20 flex items-center gap-1 lg:gap-2 shadow-sm">
                        <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                        <span className="text-[7px] lg:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">LOADING</span>
                      </div>
                    ) : (
                      <>
                        {cacheStatus === 'READY' ? (
                          <div className="px-1.5 lg:px-3 py-0.5 lg:py-1 bg-emerald-500/10 rounded-lg lg:rounded-xl border border-emerald-500/20 flex items-center gap-1 lg:gap-2 shadow-sm">
                            <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[7px] lg:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">READY</span>
                          </div>
                        ) : (
                          <div className="px-1.5 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20 flex items-center gap-1 shadow-sm">
                            <div className={`w-1 h-1 rounded-full ${cacheStatus === 'PARTIAL' ? 'bg-amber-50' : 'bg-red-500'}`}></div>
                            <span className="text-[7px] font-black uppercase tracking-tighter">{cacheStatus}</span>
                          </div>
                        )}
                      </>
                    )}
                    
                    <button 
                      onClick={handleRefreshCache}
                      disabled={isCacheLoading}
                      className={`p-1 lg:p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 transition-all ${isCacheLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                      title="Refresh Graph & Campuses"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 lg:h-3.5 lg:w-3.5 ${isCacheLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                </div>
              </div>
            </div>

            {/* Unified Filters Grid */}
            <div className="space-y-2 lg:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 lg:gap-3">
                {/* Campus Filter */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-2.5 lg:left-4 flex items-center pointer-events-none z-10">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-primary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  
                  <button
                    onClick={() => setShowCampusDropdown(!showCampusDropdown)}
                    disabled={campuses.length === 0}
                    className={`relative w-full text-left pl-8 lg:pl-10 pr-8 py-2 lg:py-3 rounded-xl lg:rounded-2xl border-none bg-gray-100 dark:bg-gray-800 text-[10px] lg:text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white cursor-pointer shadow-inner flex items-center ${campuses.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  >
                    <span className="truncate">
                      {selectedCampusId 
                        ? campuses.find(c => c.id === selectedCampusId)?.shortName 
                        : 'All Campuses'}
                    </span>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${showCampusDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {showCampusDropdown && (
                    <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl lg:rounded-2xl shadow-xl max-h-60 overflow-hidden animate-in fade-in duration-200">
                      <div className="p-1 lg:p-2 overflow-y-auto max-h-60 custom-scrollbar">
                        <button
                          onClick={() => { setSelectedCampusId(''); setShowCampusDropdown(false); }}
                          className={`w-full text-left px-2 lg:px-4 py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl transition-all flex items-center justify-between mb-0.5 group ${!selectedCampusId ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                        >
                           <span className={`text-[10px] lg:text-xs font-black truncate ${!selectedCampusId ? 'text-primary' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>All Campuses</span>
                           {!selectedCampusId && <span className="text-primary text-[10px]">●</span>}
                        </button>
                        
                        {campuses.map(c => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCampusId(c.id); setShowCampusDropdown(false); }}
                            className={`w-full text-left px-2 lg:px-4 py-1.5 lg:py-2.5 rounded-lg lg:rounded-xl transition-all flex items-center justify-between mb-0.5 group ${selectedCampusId === c.id ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                          >
                             <span className={`text-[10px] lg:text-xs font-black truncate ${selectedCampusId === c.id ? 'text-primary' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>{c.shortName}</span>
                             {selectedCampusId === c.id && <span className="text-primary text-[10px]">●</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Search */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-2.5 lg:left-4 flex items-center pointer-events-none z-10">
                    <svg className="w-3 h-3 lg:w-4 lg:h-4 text-primary opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={query}
                    onFocus={() => { setShowSuggestions(true); setCacheVersion(v => v + 1); }}
                    onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                    placeholder="Project code..."
                    disabled={projects.length === 0}
                    className={`w-full pl-8 lg:pl-10 pr-3 py-2 lg:py-3 rounded-xl lg:rounded-2xl border-none bg-gray-100 dark:bg-gray-800 text-[10px] lg:text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:text-white shadow-inner ${projects.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  />
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl lg:rounded-2xl shadow-xl max-h-48 lg:max-h-72 overflow-hidden animate-in fade-in duration-200">
                      <div className="p-1 lg:p-2 overflow-y-auto max-h-48 lg:max-h-72 custom-scrollbar">
                        {suggestions.map((p) => (
                          <button
                            key={`${p.id}-${p.code}`}
                            onClick={() => handleSelectProject(p)}
                            className="w-full text-left px-2 lg:px-4 py-1.5 lg:py-2.5 hover:bg-primary/10 rounded-lg lg:rounded-xl transition-all flex justify-between items-center mb-0.5"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] lg:text-xs font-black text-gray-800 dark:text-gray-200 truncate">{p.code}</span>
                              <span className="text-[6px] lg:text-[8px] text-gray-400 font-bold uppercase truncate">{p.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap gap-1 lg:gap-2 px-0.5">
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(selectedStatus === s ? '' : s)}
                    className={`px-1.5 lg:px-3 py-1 lg:py-2 rounded-lg lg:rounded-xl text-[7px] lg:text-[9px] font-black transition-all border uppercase tracking-tighter ${
                      selectedStatus === s 
                        ? 'bg-primary text-white border-primary shadow-sm' 
                        : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 lg:hover:border-primary/30 lg:hover:text-primary dark:lg:hover:text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Area */}
            <div className="min-h-[30px] lg:min-h-[100px] px-0.5">
              {isLoading && (
                <div className="flex flex-col items-center py-2 lg:py-8">
                  <div className="w-4 h-4 lg:w-8 lg:h-8 border-2 lg:border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-1 lg:mb-3"></div>
                  <span className="text-[6px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest">Searching...</span>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <div className="space-y-1 lg:space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 lg:gap-3 max-h-[200px] lg:max-h-[500px] overflow-y-auto pr-0.5 custom-scrollbar">
                    {results.map((login, idx) => (
                      <button 
                        key={`${idx}-${login}`} 
                        onClick={() => handleViewParticipant(login)}
                        className="w-full flex items-center justify-between p-1.5 lg:p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl lg:rounded-2xl border border-white/40 dark:border-gray-800/40 hover:border-primary/30 hover:bg-white dark:hover:bg-gray-800/60 hover:shadow-md transition-all group shadow-sm cursor-pointer text-left"
                      >
                        <span className="text-[10px] lg:text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight pl-1">{login}</span>
                        <div className="text-gray-300 group-hover:text-primary transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ParticipantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData}
        isLoading={modalLoading}
        error={modalError}
      />
    </>
  );
};
