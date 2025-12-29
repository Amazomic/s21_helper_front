import React, { useState, useEffect, useMemo } from 'react';
import { fetchData } from '../services/apiService';
import { Button } from './ui/Button';
import { ParticipantModal } from './ParticipantModal';

interface ProjectParticipantsSearchProps {
  token: string;
  campusId?: string;
}

interface CachedProject {
  id: string;
  name: string;
  code: string;
}

export const ProjectParticipantsSearch: React.FC<ProjectParticipantsSearchProps> = ({ token, campusId }) => {
  const [projectId, setProjectId] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Cache for autocomplete
  const [cachedProjects, setCachedProjects] = useState<CachedProject[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    try {
      const cachedGraph = localStorage.getItem('s21_graph_cache');
      if (cachedGraph) {
        const parsed = JSON.parse(cachedGraph);
        const graphData = parsed.response || parsed;
        const nodes = graphData.nodes || [];
        const projs: CachedProject[] = [];
        
        nodes.forEach((node: any) => {
          if (Array.isArray(node.items)) {
            node.items.forEach((item: any) => {
              if (item.entityId && item.code && item.entityType === 'PROJECT') {
                projs.push({
                  id: String(item.entityId),
                  name: node.label || item.code,
                  code: String(item.code)
                });
              }
            });
          }
        });
        setCachedProjects(projs);
      }
    } catch (e) {
      console.error("Failed to load cached projects", e);
    }
  }, []);

  const getSuggestions = (input: string) => {
    const term = input.toLowerCase().trim();
    if (term.length < 2) return [];
    
    // Check if input matches exactly a project ID or Code to avoid redundant suggestions if already typed
    const exactMatch = cachedProjects.find(p => p.id === input || p.code.toLowerCase() === term);
    
    return cachedProjects
      .filter((p) => 
        p.code.toLowerCase().includes(term) || 
        p.name.toLowerCase().includes(term)
      )
      .slice(0, 10);
  };

  const suggestions = useMemo(() => getSuggestions(projectId), [projectId, cachedProjects]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectId) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    // Resolve project ID if user typed a name/code and we have it in cache
    let targetId = projectId;
    const projectMatch = cachedProjects.find(p => p.code.toLowerCase() === projectId.toLowerCase() || p.id === projectId);
    if (projectMatch) {
        targetId = projectMatch.id;
    }

    try {
      const query = `/v1/projects/${targetId}/participants?limit=100&offset=0${campusId ? `&campusId=${campusId}` : ''}`;
      const data = await fetchData(query, token);
      
      let list: any[] = [];
      if (Array.isArray(data)) {
         list = data;
      } else if (data && typeof data === 'object') {
         list = data.participants || data.users || [];
      }

      const logins = list.map((item: any) => item.login || item.user?.login).filter(Boolean);
      const uniqueLogins = Array.from(new Set(logins)) as string[];
         
      if (uniqueLogins.length === 0) {
         setError("No participants found or invalid project ID.");
      } else {
         setResults(uniqueLogins);
      }

    } catch (err: any) {
      setError(err.message || "Failed to search participants. Check Project ID.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewParticipant = async (login: string) => {
    setIsModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setSelectedParticipant(null);

    try {
        const [userInfo, projectsInProgress, projectsInReviews, userPoints, userCoalition] = await Promise.allSettled([
            fetchData(`/v1/participants/${login}`, token),
            fetchData(`/v1/participants/${login}/projects?limit=50&status=IN_PROGRESS`, token),
            fetchData(`/v1/participants/${login}/projects?limit=50&status=IN_REVIEWS`, token),
            fetchData(`/v1/participants/${login}/points`, token),
            fetchData(`/v1/participants/${login}/coalition`, token)
        ]);

        const info = userInfo.status === 'fulfilled' ? userInfo.value : {};
        if (userInfo.status === 'rejected') throw new Error("Could not fetch user info");

        const p1 = projectsInProgress.status === 'fulfilled' ? (projectsInProgress.value.projects || projectsInProgress.value || []) : [];
        const p2 = projectsInReviews.status === 'fulfilled' ? (projectsInReviews.value.projects || projectsInReviews.value || []) : [];
        
        // Merge and unique by ID
        const allProjects = [...p1, ...p2];
        const uniqueProjects = Array.from(new Map(allProjects.map((p: any) => [p.id, p])).values());

        const points = userPoints.status === 'fulfilled' ? userPoints.value : {};
        
        let coalition = null;
        if (userCoalition.status === 'fulfilled') {
            const cData = userCoalition.value;
             if (Array.isArray(cData) && cData.length > 0) coalition = cData[0];
             else if (cData && !Array.isArray(cData)) coalition = cData;
        }

        setSelectedParticipant({
            login: info.login || login,
            level: info.level || 0,
            className: info.className || 'Unknown',
            projects: uniqueProjects,
            points: points,
            coalition: coalition
        });

    } catch (err: any) {
        setModalError(err.message);
    } finally {
        setModalLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Project Search</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Find students working on a specific project</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
                <input 
                    type="text" 
                    value={projectId}
                    onChange={(e) => { setProjectId(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Project Name or ID (e.g. 'CPP' or 1234)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-mono text-sm"
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                      {suggestions.map(p => (
                          <div 
                              key={`${p.id}-${p.code}`} 
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-b border-gray-50 dark:border-gray-800 last:border-none"
                              onMouseDown={(e) => {
                                  e.preventDefault(); 
                                  setProjectId(p.code); 
                                  setShowSuggestions(false);
                              }}
                          >
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.code}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{p.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-gray-400">{p.id}</span>
                          </div>
                      ))}
                  </div>
                )}
            </div>
            <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto sm:px-8 bg-primary hover:bg-primary/90">
                Search
            </Button>
        </form>

        {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
            </div>
        )}
      </div>

      {!isLoading && results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">
                Participants <span className="text-primary ml-1">({results.length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {results.map((login, idx) => (
              <button 
                key={`${idx}-${login}`} 
                onClick={() => handleViewParticipant(login)}
                className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:shadow-md hover:bg-white dark:hover:bg-gray-800 transition-all group"
              >
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors truncate">{login}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <ParticipantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedParticipant} 
        isLoading={modalLoading} 
        error={modalError} 
      />
    </div>
  );
};
