
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/Card';
import { fetchData, getPeerTelegramInfo, notifyPeer } from '../services/apiService';
import { ParticipantModal } from './ParticipantModal';
import { PeerTelegramInfo } from '../types';

interface ProjectParticipantsSearchProps {
  token: string;
  campusId?: string;
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

export const ProjectParticipantsSearch: React.FC<ProjectParticipantsSearchProps> = ({ token, campusId: initialCampusId }) => {
  const [query, setQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('IN_REVIEWS');
  const [selectedCampusId, setSelectedCampusId] = useState<string>(initialCampusId || '');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCampusDropdown, setShowCampusDropdown] = useState(false);
  
  // Telegram Peer Statuses State
  const [peerStatuses, setPeerStatuses] = useState<Record<string, PeerTelegramInfo>>({});
  const [loadingStatuses, setLoadingStatuses] = useState<Record<string, boolean>>({});
  const [notifyingPeer, setNotifyingPeer] = useState<string | null>(null);

  const [cacheVersion, setCacheVersion] = useState(0); 
  const [isCacheLoading, setIsCacheLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const statuses = ['ASSIGNED', 'REGISTERED', 'IN_PROGRESS', 'IN_REVIEWS', 'ACCEPTED', 'FAILED'];

  // Check cache presence
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

  // Fetch Telegram statuses for visible results
  useEffect(() => {
    if (results.length === 0) return;

    const fetchMissingStatuses = async () => {
      const missingLogins = results.filter(login => !peerStatuses[login] && !loadingStatuses[login]);
      
      if (missingLogins.length === 0) return;

      setLoadingStatuses(prev => {
        const next = { ...prev };
        missingLogins.forEach(l => next[l] = true);
        return next;
      });

      const newStatuses: Record<string, PeerTelegramInfo> = {};
      
      await Promise.all(missingLogins.map(async (login) => {
        try {
          const info = await getPeerTelegramInfo(login, token);
          newStatuses[login] = info;
        } catch (e) {
          newStatuses[login] = { found: false };
        }
      }));

      setPeerStatuses(prev => ({ ...prev, ...newStatuses }));
      setLoadingStatuses(prev => {
        const next = { ...prev };
        missingLogins.forEach(l => delete next[l]);
        return next;
      });
    };

    fetchMissingStatuses();
  }, [results, token]);

  const handleNotifyPeer = async (e: React.MouseEvent, login: string) => {
    e.stopPropagation();
    if (notifyingPeer) return;
    
    if (!confirm(`Send a notification bot message to ${login}?`)) return;

    setNotifyingPeer(login);
    try {
      await notifyPeer(login, token);
      alert(`Notification sent to ${login}`);
    } catch (err: any) {
      alert(`Failed to notify: ${err.message}`);
    } finally {
      setNotifyingPeer(null);
    }
  };

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
    
    // If we have a selected project that matches the current query, don't show suggestions
    if (selectedProjectId) {
         const selected = projects.find(p => p.id === selectedProjectId);
         if (selected && (selected.code === query || String(selected.id) === query)) {
             return [];
         }
    }

    return projects
      .filter((p) => 
        p.code.toLowerCase().includes(term) || 
        p.name.toLowerCase().includes(term) ||
        String(p.id).includes(term)
      )
      .slice(0, 10);
  }, [query, projects, selectedProjectId]);

  const activeProject = useMemo(() => {
      if (selectedProjectId) {
          return projects.find(p => p.id === selectedProjectId);
      }
      return null;
  }, [selectedProjectId, projects]);

  const fetchParticipants = useCallback(async (projectId: number, status: string, cId: string) => {
    setIsLoading(true);
    setError(null);
    setResults([]); 
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

  const executeSearch = () => {
    let pid = selectedProjectId;

    // Check if query is a manual ID input if no project is selected
    if (!pid) {
        const numericQuery = parseInt(query.trim(), 10);
        if (/^\d+$/.test(query.trim()) && numericQuery > 0) {
            // Check if this ID exists in our cache to show pretty name
            const found = projects.find(p => p.id === numericQuery);
            if (found) {
                pid = found.id;
                setSelectedProjectId(found.id);
            } else {
                // Allow searching even if not in cache (fallback)
                pid = numericQuery;
                // We set selected ID so the UI might try to show it
                setSelectedProjectId(numericQuery);
            }
        }
    }

    if (pid) {
        fetchParticipants(pid, selectedStatus, selectedCampusId);
    }
  };

  const handleSelectProject = (p: NormalizedProject) => {
    setQuery(p.code);
    setSelectedProjectId(p.id);
    setShowSuggestions(false);
  };

  const handleClearSelection = () => {
    setSelectedProjectId(null);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
       executeSearch();
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

  const renderTelegramAction = (login: string) => {
    const info = peerStatuses[login];
    
    if (!info) return null; 
    if (!info.found) return null; 

    if (info.can_message && info.telegram_username) {
      return (
        <a 
          href={`https://t.me/${info.telegram_username}`} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-all group/tg"
          title={`Open Telegram: @${info.telegram_username}`}
        >
          <span className="text-[9px] font-black uppercase tracking-tight hidden sm:inline">Open</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
          </svg>
        </a>
      );
    }

    if (info.can_notify) {
      const isSending = notifyingPeer === login;
      return (
        <button
          onClick={(e) => handleNotifyPeer(e, login)}
          disabled={isSending}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${isSending ? 'bg-gray-100 border-gray-200 cursor-wait' : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}
          title="Send notification via Bot"
        >
          {isSending ? (
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="text-[9px] font-black uppercase tracking-tight hidden sm:inline">Notify</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
            </>
          )}
        </button>
      );
    }

    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 opacity-60">
         <span className="text-[9px] font-black uppercase tracking-tight">Linked</span>
         <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
         </svg>
      </div>
    );
  };

  return (
    <>
      <div ref={containerRef} className="w-full">
        <Card className="shadow-2xl border-none rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl overflow-visible border border-white/20 dark:border-gray-800 ring-1 ring-black/5 transition-all h-full">
          <div className="flex flex-col gap-2 lg:gap-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex flex-col min-w-0">
                <h3 className="text-xs lg:text-base font-black text-gray-800 dark:text-white uppercase tracking-tighter truncate">Project Search</h3>
                <p className="text-[7px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60 truncate">Find participants</p>
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-2 lg:gap-3">
                <div className="flex items-center gap-2 pl-2 lg:pl-3">
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.00