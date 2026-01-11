
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/Card';
import { fetchData, fetchPeersList } from '../services/apiService';
import { ParticipantModal } from './ParticipantModal';

interface ProjectParticipantsSearchProps {
  token: string;
  campusId?: string;
  headless?: boolean;
  headerContent?: React.ReactNode;
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

export const ProjectParticipantsSearch: React.FC<ProjectParticipantsSearchProps> = ({ token, campusId: initialCampusId, headless = false, headerContent }) => {
  const [query, setQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_REVIEWS');
  const [selectedCampusId, setSelectedCampusId] = useState<string>(initialCampusId || '');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Global Peers Lookup Map (to avoid N+1 requests)
  const [peersMap, setPeersMap] = useState<Map<string, { visibility: string }> | null>(null);

  const [cacheVersion, setCacheVersion] = useState(0); 
  const [isCacheLoading, setIsCacheLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const statuses = ['ASSIGNED', 'REGISTERED', 'IN_PROGRESS', 'IN_REVIEWS', 'ACCEPTED', 'FAILED'];

  // Listen for project selection from other components (e.g. UserMenu)
  useEffect(() => {
    const handleSelection = (e: CustomEvent) => {
      const { id, code } = e.detail;
      setQuery(code);
      setSelectedProjectId(id);
      // Ensure dropdowns are closed and user sees result
      setShowSuggestions(false);
      setShowCampusDropdown(false);
      // Scroll to this component
      if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    window.addEventListener('s21:select_project', handleSelection as EventListener);
    return () => {
      window.removeEventListener('s21:select_project', handleSelection as EventListener);
    };
  }, []);

  // Initialize Peers Map (from Cache or API) - Initial Load
  useEffect(() => {
    const loadPeersMap = async () => {
      let mapData = null;
      
      // Try Cache First
      try {
        const cached = localStorage.getItem('s21_tg_connected_cache');
        if (cached) {
          const list = JSON.parse(cached);
          mapData = new Map(list.map((p: any) => [p.school_login, p]));
        }
      } catch(e) { console.warn("Cache parse error", e); }

      // If missing, Fetch
      if (!mapData) {
        try {
          const list = await fetchPeersList(token);
          localStorage.setItem('s21_tg_connected_cache', JSON.stringify(list));
          localStorage.setItem('s21_tg_connected_cache_timestamp', new Date().toISOString());
          mapData = new Map(list.map((p: any) => [p.school_login, p]));
        } catch (e) {
          console.error("Failed to load peers map", e);
          mapData = new Map(); // Empty map to allow rendering without connection info
        }
      }
      
      setPeersMap(mapData);
    };

    loadPeersMap();
  }, [token]);

  // Check cache presence for Graph/Campuses
  useEffect(() => {
    const checkAndLoadCache = async () => {
      const hasGraph = !!localStorage.getItem('s21_graph_cache');
      const hasCampuses = !!localStorage.getItem('s21_campuses_cache');

      if (!hasGraph || !hasCampuses) {
        await handleRefreshCache();
      } else {
        setCacheVersion(v => v + 1);
      }
    };
    checkAndLoadCache();
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

  const getUserProjectsFromCache = (): NormalizedProject[] => {
    try {
      const cached = localStorage.getItem('s21_projects_cache');
      if (!cached) return [];
      const parsed = JSON.parse(cached);
      const list = parsed.projects || [];
      return list.map((p: any) => ({
        id: p.id,
        name: p.title, 
        code: p.title
      }));
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

  // Derived state for selected project
  const selectedProject = useMemo(() => {
    const graphP = projects.find(p => p.id === selectedProjectId);
    if (graphP) return graphP;

    // Fallback: Try to find in user projects (e.g. if graph cache is empty or incomplete)
    const userProjects = getUserProjectsFromCache();
    return userProjects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

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
      const [graphData, campusesData] = await Promise.all([
        fetchData('/v1/graph', token),
        fetchData('/v1/campuses', token)
      ]);

      localStorage.setItem('s21_graph_cache', JSON.stringify(graphData));
      localStorage.setItem('s21_graph_cache_timestamp', new Date().toISOString());

      localStorage.setItem('s21_campuses_cache', JSON.stringify(campusesData));
      localStorage.setItem('s21_campuses_cache_timestamp', new Date().toISOString());

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
    if (selectedProject && query === selectedProject.code) return [];

    return projects
      .filter((p) => 
        p.code.toLowerCase().includes(term) || 
        p.name.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [query, projects, selectedProject]);

  const fetchParticipants = useCallback(async (projectId: number, status: string, cId: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]); // Clear previous results immediately
    
    try {
      let url = `/v1/projects/${projectId}/participants?limit=100&offset=0`;
      if (status) url += `&status=${status}`;
      if (cId) url += `&campusId=${cId}`;

      // Execute in parallel: Get participants AND Refresh peer map
      // This ensures we always have the latest visibility settings for peers
      const [data, freshPeers] = await Promise.all([
        fetchData(url, token),
        fetchPeersList(token)
      ]);
      
      // Update local state and cache with fresh peer data
      if (freshPeers) {
         setPeersMap(new Map(freshPeers.map((p: any) => [p.school_login, p])));
         localStorage.setItem('s21_tg_connected_cache', JSON.stringify(freshPeers));
         localStorage.setItem('s21_tg_connected_cache_timestamp', new Date().toISOString());
      }

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

  const handleManualIdSearch = () => {
    const numericId = parseInt(query.trim(), 10);
    if (!isNaN(numericId) && numericId > 0) {
      setSelectedProjectId(numericId);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
       handleManualIdSearch();
       (e.target as HTMLInputElement).blur();
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

  const renderPeerStatus = (login: string) => {
    if (!peersMap) return null;
    const peer = peersMap.get(login);
    if (!peer) return null;

    let colorClass = 'bg-gray-400';
    let title = 'Private';

    if (peer.visibility === 'public') {
      colorClass = 'bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.5)]';
      title = 'Public';
    } else if (peer.visibility === 'notify_only') {
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
    : { className: "shadow-2xl border-none rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl overflow-visible border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all h-full" };

  return (
    <>
      <div ref={containerRef} className="w-full">
        <ContentWrapper {...wrapperProps}>
          <div className="flex flex-col gap-2 lg:gap-6">
            {/* Header Area */}
            <div className={`flex items-center justify-between gap-2 px-1 ${headless ? 'mb-2' : ''}`}>
              {headerContent ? (
                <div className="flex-1 min-w-0">
                   {headerContent}
                </div>
              ) : (
                !headless && (
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-xs lg:text-base font-black text-gray-800 dark:text-white uppercase tracking-tighter truncate">Project Search</h3>
                    <p className="text-[7px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60 truncate">Find participants</p>
                  </div>
                )
              )}
              
              {/* Cache Controls - Status + Refresh Button */}
              <div className="flex-shrink-0 flex items-center gap-2 lg:gap-3">
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
                    onFocus={() => { setIsInputFocused(true); setShowSuggestions(true); setCacheVersion(v => v + 1); }}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Project code or ID..."
                    className={`w-full pl-8 lg:pl-10 pr-16 py-2 lg:py-3 rounded-xl lg:rounded-2xl border-none bg-gray-100 dark:bg-gray-800 text-[10px] lg:text-xs font-black outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:text-white shadow-inner ${selectedProject && !isInputFocused && query === selectedProject.code ? '!text-transparent !selection:bg-transparent !placeholder:text-transparent' : ''}`}
                  />

                  {/* Selected Project Name Overlay (Left) */}
                  {selectedProject && !isInputFocused && query === selectedProject.code && (
                    <div className="absolute inset-y-0 left-8 lg:left-10 right-16 flex items-center pointer-events-none z-10">
                        <span className="text-[10px] lg:text-xs font-black text-gray-800 dark:text-white truncate">
                            {selectedProject.name}
                        </span>
                    </div>
                  )}

                  {/* Selected Project ID Badge (Right) */}
                  {selectedProject && query === selectedProject.code && (
                     <div className="absolute inset-y-0 right-1.5 flex items-center z-20 pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[8px] font-black font-mono border border-gray-200 dark:border-gray-600 shadow-sm">
                           #{selectedProject.id}
                        </span>
                     </div>
                  )}
                  
                  {/* Manual ID Button (Only if query is numeric and no project selected to avoid overlap) */}
                  {/^\d+$/.test(query.trim()) && !selectedProject && (
                     <div className="absolute inset-y-0 right-1.5 flex items-center z-20">
                        <button
                          onClick={handleManualIdSearch}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-gray-700 text-primary dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-primary hover:text-white dark:hover:bg-primary hover:border-primary transition-all text-[9px] font-black uppercase shadow-sm"
                          title="Search by ID"
                        >
                          ID
                        </button>
                     </div>
                  )}
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl lg:rounded-2xl shadow-xl max-h-48 lg:max-h-72 overflow-hidden animate-in fade-in duration-200">
                      <div className="p-1 lg:p-2 overflow-y-auto max-h-48 lg:max-h-72 custom-scrollbar">
                        {suggestions.map((p) => (
                          <button
                            key={`${p.id}-${p.code}`}
                            onClick={() => handleSelectProject(p)}
                            className="w-full text-left px-2 lg:px-4 py-1.5 lg:py-2.5 hover:bg-primary/10 rounded-lg lg:rounded-xl transition-all flex justify-between items-center mb-0.5 group"
                          >
                            <div className="flex flex-col min-w-0 mr-2">
                              <span className="text-[10px] lg:text-xs font-black text-gray-800 dark:text-gray-200 truncate group-hover:text-primary transition-colors">{p.code}</span>
                              <span className="text-[6px] lg:text-[8px] text-gray-400 font-bold uppercase truncate">{p.name}</span>
                            </div>
                            <div className="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                               <span className="text-[8px] font-mono font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary/70">#{p.id}</span>
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
                        <span className="text-[10px] lg:text-sm font-black text-gray-800 dark:text-gray-100 tracking-tight pl-1 truncate max-w-[40%]">{login}</span>
                        
                        <div className="flex items-center gap-2">
                           {/* Telegram Status Dot */}
                           {renderPeerStatus(login)}

                           <div className="text-gray-300 group-hover:text-primary transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 lg:h-4 lg:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                           </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ContentWrapper>
      </div>

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
