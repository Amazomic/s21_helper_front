
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface DebugViewProps {
  token: string;
  initialUsername: string;
  campusId?: string;
  loadingEndpoint: string | null;
  isAnyLoading: boolean;
  onApiCall: (endpoint: string, title: string) => void;
  onCacheApiCall: (endpoint: string, cacheKey: string, title: string) => void;
  onOpenCached: (cacheKey: string, title: string) => void;
}

interface CachedCampus {
  id: string;
  shortName: string;
  fullName: string;
}

interface CachedProject {
  id: string;
  name: string;
  code: string;
}

const DebugRow = ({ method, path, desc, onClick, isLoading, isAnyLoading }: any) => (
  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border dark:border-gray-700 hover:border-amber-500/20 transition-all ${isAnyLoading && !isLoading ? 'opacity-50' : ''}`}>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">{method}</span>
        <span className="text-[9px] sm:text-[10px] font-mono text-gray-600 dark:text-gray-300 truncate block bg-gray-100 dark:bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700/50">{path}</span>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-gray-400 italic leading-tight">{desc}</p>
    </div>
    <div className="flex-shrink-0">
      <Button 
        variant={isLoading ? 'primary' : 'secondary'} 
        className={`w-full sm:w-28 h-8 px-4 text-[10px] uppercase font-black transition-all ${isLoading ? 'bg-amber-500 text-white' : 'hover:bg-amber-500 hover:text-white'}`} 
        onClick={onClick}
        isLoading={isLoading}
        disabled={isAnyLoading && !isLoading}
      >
        {isLoading ? 'Loading' : 'Try'}
      </Button>
    </div>
  </div>
);

const DebugSection = ({ title, desc, children }: any) => (
  <Card className="shadow-sm border-none bg-white dark:bg-gray-800">
    <div className="mb-4 px-1">
      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
    <div className="space-y-2">{children}</div>
  </Card>
);

const CacheStatusRow = ({ label, cacheKey }: { label: string, cacheKey: string }) => {
  const data = localStorage.getItem(cacheKey);
  const timestamp = localStorage.getItem(`${cacheKey}_timestamp`);
  const exists = !!data;
  
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900/40 border dark:border-gray-700 rounded-lg shadow-sm">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{label}</span>
        <span className="text-[10px] text-gray-400 font-mono">
          {timestamp ? new Date(timestamp).toLocaleString() : 'Never updated'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${exists ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
        <span className={`text-[10px] font-black uppercase tracking-wider ${exists ? 'text-emerald-500' : 'text-red-500'}`}>
          {exists ? 'READY' : 'EMPTY'}
        </span>
      </div>
    </div>
  );
};

export const DebugView: React.FC<DebugViewProps> = ({ 
  initialUsername, 
  campusId,
  loadingEndpoint,
  isAnyLoading,
  onApiCall,
  onCacheApiCall,
  onOpenCached
}) => {
  const [partLogin, setPartLogin] = useState(initialUsername);
  const [partLimit, setPartLimit] = useState<string>('50');
  const [partOffset, setPartOffset] = useState<string>('0');
  const [partStatus, setPartStatus] = useState<string>('');
  const [partDate, setPartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [partProjectId, setPartProjectId] = useState<string>(''); 

  const [eventFrom, setEventFrom] = useState<string>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [eventTo, setEventTo] = useState<string>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString().slice(0, 16);
  });
  const [eventType, setEventType] = useState<string>('');
  const [eventLimit, setEventLimit] = useState<string>('50');
  const [eventOffset, setEventOffset] = useState<string>('0');

  const [projId, setProjId] = useState<string>('');
  const [projLimit, setProjLimit] = useState<string>('50');
  const [projOffset, setProjOffset] = useState<string>('0');
  const [projStatus, setProjStatus] = useState<string>('');
  const [projCampusId, setProjCampusId] = useState<string>(campusId || '');

  const [campusSearchId, setCampusSearchId] = useState(campusId || '');
  const [campusLimit, setCampusLimit] = useState<string>('50');
  const [campusOffset, setCampusOffset] = useState<string>('0');

  const [genericId, setGenericId] = useState('');
  const [cachedCampuses, setCachedCampuses] = useState<CachedCampus[]>([]);
  const [cachedProjects, setCachedProjects] = useState<CachedProject[]>([]);
  const [showProjSuggestions, setShowProjSuggestions] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('s21_campuses_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const data = parsed.response || parsed;
        if (Array.isArray(data.campuses)) {
          setCachedCampuses(data.campuses);
        }
      }
    } catch (e) {
      console.error("Failed to load cached campuses for debug view", e);
    }

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
      console.error("Failed to load cached projects for debug view", e);
    }
  }, []);

  const getEncoded = (val: string, label: string) => {
    const trimmed = val.trim();
    if (!trimmed) { alert(`Please enter ${label}`); return null; }
    return encodeURIComponent(trimmed);
  };

  const projSuggestions = useMemo(() => {
    if (!projId) return [];
    const term = projId.toLowerCase().trim();
    if (!term) return [];
    
    return cachedProjects
      .filter(p => {
        if (p.id === projId) return false;
        return p.code.toLowerCase().includes(term) || 
               p.name.toLowerCase().includes(term) ||
               p.id.includes(term);
      })
      .sort((a, b) => {
        // Prioritize startsWith matches
        const aCodeStart = a.code.toLowerCase().startsWith(term);
        const bCodeStart = b.code.toLowerCase().startsWith(term);
        if (aCodeStart && !bCodeStart) return -1;
        if (!aCodeStart && bCodeStart) return 1;
        
        const aNameStart = a.name.toLowerCase().startsWith(term);
        const bNameStart = b.name.toLowerCase().startsWith(term);
        if (aNameStart && !bNameStart) return -1;
        if (!aNameStart && bNameStart) return 1;

        return 0;
      })
      .slice(0, 10);
  }, [projId, cachedProjects]);

  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto pb-24 transition-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <DebugSection title="Participant" desc="Operations related to participants">
            <div className="grid grid-cols-1 gap-4 mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">login <span className="text-red-500 font-bold">*</span></label>
                  <span className="text-[9px] text-gray-400 font-mono italic">(string, path)</span>
                </div>
                <input 
                  type="text" 
                  value={partLogin} 
                  onChange={(e) => setPartLogin(e.target.value)} 
                  placeholder="e.g. login" 
                  className="w-full px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none font-mono text-xs" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">limit</label>
                  <input type="number" inputMode="numeric" value={partLimit} onChange={(e) => setPartLimit(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">offset</label>
                  <input type="number" inputMode="numeric" value={partOffset} onChange={(e) => setPartOffset(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none font-mono text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">status</label>
                  <select value={partStatus} onChange={(e) => setPartStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none text-xs">
                    <option value="">Any Status</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="REGISTERED">REGISTERED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="IN_REVIEWS">IN_REVIEWS</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">date</label>
                  <input type="date" value={partDate} onChange={(e) => setPartDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">projectId / courseId</label>
                <input type="text" value={partProjectId} onChange={(e) => setPartProjectId(e.target.value)} placeholder="e.g. 12311" className="w-full px-4 py-2.5 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 outline-none font-mono text-xs" />
              </div>
            </div>

            <DebugRow method="GET" path="/v1/participants/{login}" desc="Returns basic information" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}`, 'User Info'); }} isLoading={loadingEndpoint === `/v1/participants/${partLogin}`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/workstation" desc="Returns workstation" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}/workstation`, 'Workstation'); }} isLoading={loadingEndpoint === `/v1/participants/${partLogin}/workstation`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/skills" desc="Returns skill points" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}/skills`, 'Skills'); }} isLoading={loadingEndpoint === `/v1/participants/${partLogin}/skills`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/projects" desc="Returns projects list" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) { let query = `/v1/participants/${id}/projects?limit=${partLimit || 50}&offset=${partOffset || 0}`; if (partStatus) query += `&status=${partStatus}`; onApiCall(query, 'Projects List'); } }} isLoading={loadingEndpoint?.includes(`/v1/participants/${partLogin}/projects?`)} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/projects/{projectId}" desc="Project by specific ID" onClick={() => { const id = getEncoded(partLogin, 'Login'); const pid = getEncoded(partProjectId, 'Project ID'); if(id && pid) onApiCall(`/v1/participants/${id}/projects/${pid}`, 'User Project Detail'); }} isLoading={loadingEndpoint === `/v1/participants/${partLogin}/projects/${partProjectId}`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/points" desc="Returns points" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}/points`, 'Points'); }} isLoading={loadingEndpoint === `/v1/participants/${partLogin}/points`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/logtime" desc="Average logtime" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}/logtime?date=${partDate}`, 'Logtime'); }} isLoading={loadingEndpoint?.includes?.(`/v1/participants/${partLogin}/logtime?date=${partDate}`)} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/feedback" desc="Feedback points" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}/feedback`, 'Feedback'); }} isLoading={loadingEndpoint === `/v1/participants/${partLogin}/feedback`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/experience-history" desc="XP accruals list" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}/experience-history?limit=${partLimit || 50}&offset=${partOffset || 0}`, 'XP History'); }} isLoading={loadingEndpoint?.includes?.(`/v1/participants/${partLogin}/experience-history?`)} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/courses" desc="Courses list" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) { let query = `/v1/participants/${id}/courses?limit=${partLimit || 10}&offset=${partOffset || 0}`; if (partStatus) query += `&status=${partStatus}`; onApiCall(query, 'Courses List'); } }} isLoading={loadingEndpoint?.includes?.(`/v1/participants/${partLogin}/courses?`)} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/coalition" desc="Coalition info" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}/coalition`, 'Coalition'); }} isLoading={loadingEndpoint === `/v1/participants/${partLogin}/coalition`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/participants/{login}/badges" desc="Badges list" onClick={() => { const id = getEncoded(partLogin, 'Login'); if(id) onApiCall(`/v1/participants/${id}/badges`, 'Badges'); }} isLoading={loadingEndpoint === `/v1/participants/${partLogin}/badges`} isAnyLoading={isAnyLoading} />
          </DebugSection>
          
          <DebugSection title="Check Save Data" desc="Browser local cache persistence status">
             <div className="grid grid-cols-1 gap-2">
                <CacheStatusRow label="Auth Session" cacheKey="s21_auth_token" />
                <CacheStatusRow label="Profile Data" cacheKey="s21_profile_cache" />
                <CacheStatusRow label="Points Data" cacheKey="s21_points_cache" />
                <CacheStatusRow label="Skills Data" cacheKey="s21_skills_cache" />
                <CacheStatusRow label="XP History Data" cacheKey="s21_history_cache" />
                <CacheStatusRow label="Graph Data" cacheKey="s21_graph_cache" />
                <CacheStatusRow label="Campuses Data" cacheKey="s21_campuses_cache" />
             </div>
          </DebugSection>
        </div>

        <div className="space-y-6">
          <DebugSection title="Projects" desc="Core school projects & participants">
            <div className="grid grid-cols-1 gap-4 mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="space-y-1 relative group">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">projectId <span className="text-red-500 font-bold">*</span></label>
                  <span className="text-[9px] text-gray-400 font-mono italic">(int64) or Search</span>
                </div>
                <input 
                  type="text" 
                  value={projId} 
                  onChange={(e) => { setProjId(e.target.value); setShowProjSuggestions(true); }}
                  onFocus={() => setShowProjSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowProjSuggestions(false), 200)}
                  placeholder="e.g. 134411 or 'CPP'" 
                  className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none font-mono text-xs" 
                  autoComplete="off"
                />
                {showProjSuggestions && projId && projSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {projSuggestions.map(p => (
                            <div 
                                key={p.id} 
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center group border-b border-gray-100 dark:border-gray-700/50 last:border-none"
                                onMouseDown={(e) => {
                                    e.preventDefault(); 
                                    setProjId(p.id);
                                    setShowProjSuggestions(false);
                                }}
                            >
                                <div className="flex flex-col max-w-[70%]">
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{p.code}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{p.name}</span>
                                </div>
                                <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">{p.id}</span>
                            </div>
                        ))}
                    </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">limit</label>
                  <input type="number" value={projLimit} onChange={(e) => setProjLimit(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none font-mono text-xs appearance-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">offset</label>
                  <input type="number" value={projOffset} onChange={(e) => setProjOffset(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none font-mono text-xs appearance-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">status</label>
                <select value={projStatus} onChange={(e) => setProjStatus(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none text-xs">
                  <option value="">Any Status</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="REGISTERED">REGISTERED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="IN_REVIEWS">IN_REVIEWS</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">campusId <span className="text-[9px] text-gray-400 normal-case">(uuid, query)</span></label>
                <div className="flex flex-col gap-2">
                   {cachedCampuses.length > 0 && (
                      <select 
                        className="w-full px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none text-xs"
                        onChange={(e) => { if(e.target.value) setProjCampusId(e.target.value); }}
                        value={cachedCampuses.find(c => c.id === projCampusId) ? projCampusId : ""}
                      >
                         <option value="" disabled>Select cached campus...</option>
                         {cachedCampuses.map(c => (
                           <option key={c.id} value={c.id}>{c.shortName}</option>
                         ))}
                         <option value="" disabled>──────────</option>
                         <option value="custom">Manual UUID below</option>
                      </select>
                   )}
                   <input type="text" value={projCampusId} onChange={(e) => setProjCampusId(e.target.value)} placeholder="e.g. ff19a3a7-..." className="w-full px-4 py-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 outline-none font-mono text-xs" />
                </div>
              </div>
            </div>
            <DebugRow method="GET" path="/v1/projects/{projectId}" desc="Returns project information by ID" onClick={() => { const id = getEncoded(projId, 'Project ID'); if(id) onApiCall(`/v1/projects/${id}`, 'Project Info'); }} isLoading={loadingEndpoint === `/v1/projects/${projId}`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/projects/{projectId}/participants" desc="List of participants by project" onClick={() => { const id = getEncoded(projId, 'Project ID'); if(id) { let query = `/v1/projects/${id}/participants?limit=${projLimit || 50}&offset=${projOffset || 0}`; if (projStatus) query += `&status=${projStatus}`; if (projCampusId) query += `&campusId=${projCampusId}`; onApiCall(query, 'Project Participants'); } }} isLoading={loadingEndpoint?.includes?.(`/projects/${projId}/participants?`)} isAnyLoading={isAnyLoading} />
          </DebugSection>

          <DebugSection title="Events" desc="Schedule and details of school events">
             <div className="grid grid-cols-1 gap-4 mb-6 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-green-700 dark:text-green-400 tracking-wider">from <span className="text-red-500 font-bold">*</span></label>
                    <input type="datetime-local" value={eventFrom} onChange={(e) => setEventFrom(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-green-200 dark:border-green-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-green-500 outline-none text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-green-700 dark:text-green-400 tracking-wider">to <span className="text-red-500 font-bold">*</span></label>
                    <input type="datetime-local" value={eventTo} onChange={(e) => setEventTo(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-green-200 dark:border-green-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-green-500 outline-none text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-green-700 dark:text-green-400 tracking-wider">type</label>
                  <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-green-200 dark:border-green-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-green-500 outline-none text-xs">
                    <option value="">Any Type</option>
                    <option value="ACTIVITY">ACTIVITY</option>
                    <option value="EXAM">EXAM</option>
                    <option value="TEST">TEST</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-green-700 dark:text-green-400 tracking-wider">limit</label>
                    <input type="number" value={eventLimit} onChange={(e) => setEventLimit(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-green-200 dark:border-green-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-green-500 outline-none font-mono text-xs appearance-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-green-700 dark:text-green-400 tracking-wider">offset</label>
                    <input type="number" value={eventOffset} onChange={(e) => setEventOffset(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-green-200 dark:border-green-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-green-500 outline-none font-mono text-xs appearance-none" />
                  </div>
                </div>
             </div>
             <DebugRow method="GET" path="/v1/events" desc="Returns list of events in date range" onClick={() => { const from = new Date(eventFrom).toISOString(); const to = new Date(eventTo).toISOString(); const query = `/v1/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=${eventLimit || 50}&offset=${eventOffset || 0}${eventType ? `&type=${eventType}` : ''}`; onApiCall(query, 'Events List'); }} isLoading={loadingEndpoint?.includes?.('/v1/events?')} isAnyLoading={isAnyLoading} />
          </DebugSection>

          <DebugSection title="Campus" desc="Global campus data">
            <div className="grid grid-cols-1 gap-4 mb-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">campusId <span className="text-red-500 font-bold">*</span></label>
                  <span className="text-[9px] text-gray-400 font-mono italic">(uuid)</span>
                </div>
                <div className="flex flex-col gap-2">
                   {cachedCampuses.length > 0 && (
                      <select 
                        className="w-full px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-amber-500 outline-none text-xs"
                        onChange={(e) => { if(e.target.value) setCampusSearchId(e.target.value); }}
                        value={cachedCampuses.find(c => c.id === campusSearchId) ? campusSearchId : ""}
                      >
                         <option value="" disabled>Select cached campus...</option>
                         {cachedCampuses.map(c => (
                           <option key={c.id} value={c.id}>{c.shortName}</option>
                         ))}
                         <option value="" disabled>──────────</option>
                         <option value="custom">Manual UUID below</option>
                      </select>
                   )}
                   <input type="text" value={campusSearchId} onChange={(e) => setCampusSearchId(e.target.value)} placeholder="Campus UUID" className="w-full px-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-amber-500 outline-none font-mono text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">limit <span className="text-[9px] text-gray-400 font-normal normal-case">(max 1000)</span></label>
                  <input 
                    type="number" 
                    min="0" 
                    max="1000" 
                    value={campusLimit} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (e.target.value === '') setCampusLimit('');
                      else if (!isNaN(val)) setCampusLimit(String(Math.min(1000, Math.max(0, val))));
                    }} 
                    className="w-full px-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-amber-500 outline-none font-mono text-xs appearance-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">offset</label>
                  <input 
                    type="number" 
                    min="0"
                    value={campusOffset} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (e.target.value === '') setCampusOffset('');
                      else if (!isNaN(val)) setCampusOffset(String(Math.max(0, val)));
                    }} 
                    className="w-full px-4 py-2.5 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-amber-500 outline-none font-mono text-xs appearance-none" 
                  />
                </div>
              </div>
            </div>
            <div className={`flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border dark:border-gray-700 hover:border-amber-500/20 transition-all ${isAnyLoading && loadingEndpoint !== '/v1/campuses' ? 'opacity-50' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">GET</span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-gray-600 dark:text-gray-300 truncate block bg-gray-100 dark:bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700/50">/v1/campuses</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic leading-tight">All campuses</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant={loadingEndpoint === '/v1/campuses' ? 'primary' : 'secondary'} className={`w-full sm:w-28 h-8 px-4 text-[10px] uppercase font-black transition-all ${loadingEndpoint === '/v1/campuses' ? 'bg-amber-500 text-white' : 'hover:bg-amber-500 hover:text-white'}`} 
                    onClick={() => onCacheApiCall(`/v1/campuses?limit=${campusLimit || 50}&offset=${campusOffset || 0}`, 's21_campuses_cache', 'Campuses')} 
                    isLoading={loadingEndpoint?.includes('/v1/campuses')} 
                    disabled={isAnyLoading && loadingEndpoint !== '/v1/campuses'} > Try </Button>
                  <Button variant="secondary" className="w-full sm:w-28 h-8 px-4 text-[10px] uppercase font-black border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => onOpenCached('s21_campuses_cache', 'Campuses')} disabled={isAnyLoading} > Cache </Button>
                </div>
              </div>
            </div>
            <DebugRow method="GET" path="/v1/campuses/{campusId}/participants" desc="Participants in campus" onClick={() => { const id = getEncoded(campusSearchId, 'Campus ID'); if(id) onApiCall(`/v1/campuses/${id}/participants?limit=${campusLimit || 50}&offset=${campusOffset || 0}`, 'Campus Participants'); }} isLoading={loadingEndpoint?.includes?.('/campuses') && loadingEndpoint?.includes?.('/participants?')} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/campuses/{campusId}/coalitions" desc="Coalitions in campus" onClick={() => { const id = getEncoded(campusSearchId, 'Campus ID'); if(id) onApiCall(`/v1/campuses/${id}/coalitions?limit=${campusLimit || 50}&offset=${campusOffset || 0}`, 'Campus Coalitions'); }} isLoading={loadingEndpoint?.includes?.('/campuses') && loadingEndpoint?.includes?.('/coalitions?')} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/campuses/{campusId}/clusters" desc="Clusters in campus" onClick={() => { const id = getEncoded(campusSearchId, 'Campus ID'); if(id) onApiCall(`/v1/campuses/${id}/clusters`, 'Campus Clusters'); }} isLoading={loadingEndpoint?.includes?.('/campuses') && loadingEndpoint?.includes?.('/clusters')} isAnyLoading={isAnyLoading} />
          </DebugSection>

          <DebugSection title="Others" desc="Utility lookups">
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border dark:border-gray-800">
              <label className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-1 block">Generic ID / UUID</label>
              <input type="text" value={genericId} onChange={(e) => setGenericId(e.target.value)} placeholder="Coalition/Cluster/Event ID" className="w-full px-4 py-2.5 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-primary outline-none font-mono text-xs" />
            </div>
            <DebugRow method="GET" path="/v1/coalitions/{coalitionId}/participants" desc="Coalition members" onClick={() => { const id = getEncoded(genericId, 'Resource ID'); if(id) onApiCall(`/v1/coalitions/${id}/participants?limit=50`, 'Coalition Participants'); }} isLoading={loadingEndpoint?.includes?.(`/coalitions/${genericId}/participants?`)} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/clusters/{clusterId}/map" desc="Specific cluster map" onClick={() => { const id = getEncoded(genericId, 'Resource ID'); if(id) onApiCall(`/v1/clusters/${id}/map`, 'Cluster Map'); }} isLoading={loadingEndpoint === `/v1/clusters/${genericId}/map`} isAnyLoading={isAnyLoading} />
            <DebugRow method="GET" path="/v1/sales" desc="School sales status" onClick={() => onApiCall('/v1/sales', 'Sales')} isLoading={loadingEndpoint === '/v1/sales'} isAnyLoading={isAnyLoading} />
            <div className={`flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg border dark:border-gray-700 hover:border-amber-500/20 transition-all ${isAnyLoading && loadingEndpoint !== '/v1/graph' ? 'opacity-50' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase">GET</span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-gray-600 dark:text-gray-300 truncate block bg-gray-100 dark:bg-gray-800/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700/50">/v1/graph</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 italic leading-tight">Project dependency graph</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant={loadingEndpoint === '/v1/graph' ? 'primary' : 'secondary'} className={`w-full sm:w-28 h-8 px-4 text-[10px] uppercase font-black transition-all ${loadingEndpoint === '/v1/graph' ? 'bg-amber-500 text-white' : 'hover:bg-amber-500 hover:text-white'}`} onClick={() => onCacheApiCall('/v1/graph', 's21_graph_cache', 'Graph')} isLoading={loadingEndpoint === '/v1/graph'} disabled={isAnyLoading && loadingEndpoint !== '/v1/graph'} > Try </Button>
                  <Button variant="secondary" className="w-full sm:w-28 h-8 px-4 text-[10px] uppercase font-black border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => onOpenCached('s21_graph_cache', 'Graph')} disabled={isAnyLoading} > Cache </Button>
                </div>
              </div>
            </div>
          </DebugSection>
        </div>
      </div>
    </div>
  );
};
