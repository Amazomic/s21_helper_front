
import React, { useState, useEffect, useRef } from 'react';
import { fetchData, fetchTelegramSettings } from '../services/apiService';
import { ResultModal } from './ResultModal';
import { UnifiedSearch } from './UnifiedSearch';
import { DebugView } from './DebugView';
import { UserMenu } from './UserMenu';
import { TelegramConfig } from '../types';

interface DashboardProps {
  username: string;
  token: string;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  username, 
  token, 
  onLogout, 
  darkMode, 
  toggleDarkMode 
}) => {
  const [debugMode, setDebugMode] = useState(() => localStorage.getItem('s21_debug_enabled') === 'true');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const [skillsData, setSkillsData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('s21_skills_cache');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const [projectsData, setProjectsData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('s21_projects_cache');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [userData, setUserData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('s21_profile_cache');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [pointsData, setPointsData] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('s21_points_cache');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(() => {
     try {
       const saved = localStorage.getItem('s21_telegram_config');
       return saved ? JSON.parse(saved) : null;
     } catch { return null; }
  });
  const [telegramLoading, setTelegramLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [loadingEndpoint, setLoadingEndpoint] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (debugMode) return;
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadData = async () => {
      if (!skillsData) setSkillsLoading(true);
      if (!projectsData) setProjectsLoading(true);
      if (!userData) setUserLoading(true);
      if (!telegramConfig) setTelegramLoading(true);

      // Fetch Telegram Settings
      try {
        const tgSettings = await fetchTelegramSettings(token);
        setTelegramConfig(tgSettings);
        localStorage.setItem('s21_telegram_config', JSON.stringify(tgSettings));
      } catch (e) {
        // Ignored. 401s are now handled/suppressed in apiService for web users.
      } finally {
        setTelegramLoading(false);
      }

      try {
        const sData = await fetchData(`/v1/participants/${username}/skills`, token);
        setSkillsData(sData);
        localStorage.setItem('s21_skills_cache', JSON.stringify(sData));
        localStorage.setItem('s21_skills_cache_timestamp', new Date().toISOString());
      } catch (err: any) { setSkillsError(err.message); } finally { setSkillsLoading(false); }

      try {
        // Fetch specific active statuses IN_PROGRESS and IN_REVIEWS in parallel
        const [progressData, reviewsData] = await Promise.all([
          fetchData(`/v1/participants/${username}/projects?limit=50&offset=0&status=IN_PROGRESS`, token),
          fetchData(`/v1/participants/${username}/projects?limit=50&offset=0&status=IN_REVIEWS`, token)
        ]);

        // Merge the results
        const mergedProjects = [
          ...(progressData?.projects || []),
          ...(reviewsData?.projects || [])
        ];
        
        // Remove duplicates just in case (though unlikely with different status filters)
        const uniqueProjects = Array.from(new Map(mergedProjects.map((p: any) => [p.id, p])).values());
        
        const combinedData = { projects: uniqueProjects };
        
        setProjectsData(combinedData);
        localStorage.setItem('s21_projects_cache', JSON.stringify(combinedData));
        localStorage.setItem('s21_projects_cache_timestamp', new Date().toISOString());
      } catch (err: any) { setProjectsError(err.message); } finally { setProjectsLoading(false); }

      try {
         const uData = await fetchData(`/v1/participants/${username}`, token);
         try {
           const pData = await fetchData(`/v1/participants/${username}/points`, token);
           setPointsData(pData);
           localStorage.setItem('s21_points_cache', JSON.stringify(pData));
           localStorage.setItem('s21_points_cache_timestamp', new Date().toISOString());
         } catch (e) {}

         try {
           const cData = await fetchData(`/v1/participants/${username}/coalition`, token);
           if (Array.isArray(cData) && cData.length > 0) uData.coalition = cData[0];
           else if (cData && !Array.isArray(cData)) uData.coalition = cData;
         } catch (e) {}

         setUserData(uData);
         setUserError(null);
         localStorage.setItem('s21_profile_cache', JSON.stringify(uData));
         localStorage.setItem('s21_profile_cache_timestamp', new Date().toISOString());

      } catch (err: any) { setUserError(err.message); } finally { setUserLoading(false); }
    };

    loadData();
  }, [username, token, debugMode]);

  const toggleDebugMode = () => {
    const nextValue = !debugMode;
    setDebugMode(nextValue);
    localStorage.setItem('s21_debug_enabled', String(nextValue));
  };

  const handleApiCall = async (endpoint: string, title: string) => {
    if (loadingEndpoint) return; 
    
    setLoadingEndpoint(endpoint);
    const requestInfo = {
      method: 'GET',
      url: `/api-proxy${endpoint}`,
      headers: { 'Authorization': `Bearer ${token.substring(0, 10)}...[HIDDEN]`, 'Content-Type': 'application/json' }
    };

    try {
      const data = await fetchData(endpoint, token);
      setModalData({ request: requestInfo, response: data });
      setModalError(null);
    } catch (err: any) {
      setModalData({ request: requestInfo, response: null });
      setModalError(err.message);
    } finally {
      setModalTitle(title);
      setModalOpen(true);
      setLoadingEndpoint(null);
    }
  };

  const handleCacheApiCall = async (endpoint: string, cacheKey: string, title: string) => {
    if (loadingEndpoint) return;
    
    setLoadingEndpoint(endpoint);
    try {
      const data = await fetchData(endpoint, token);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(`${cacheKey}_timestamp`, new Date().toISOString());

      const requestInfo = {
        method: 'GET',
        url: `/api-proxy${endpoint}`,
        headers: { 'Authorization': `Bearer ${token.substring(0, 10)}...[HIDDEN]`, 'Content-Type': 'application/json' }
      };
      setModalData({ request: requestInfo, response: data });
      setModalError(null);
      setModalTitle(`${title} (Cached Successfully)`);
      setModalOpen(true);
    } catch (err: any) {
      setModalError(err.message);
      setModalOpen(true);
    } finally {
      setLoadingEndpoint(null);
    }
  };

  const handleOpenCached = (cacheKey: string, title: string) => {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) {
      alert('Cached data not found. Please click "Try" first to fetch and save it.');
      return;
    }
    
    setModalData({ 
      request: { source: "Simulated Server Disk Cache (localStorage)" }, 
      response: JSON.parse(cached) 
    });
    setModalTitle(`Cached ${title}`);
    setModalError(null);
    setModalOpen(true);
  };

  // Callback to update local state when widget changes visibility settings
  const handleConfigUpdate = (newConfig: TelegramConfig | null) => {
    setTelegramConfig(newConfig);
    if (newConfig) {
      localStorage.setItem('s21_telegram_config', JSON.stringify(newConfig));
    } else {
      localStorage.removeItem('s21_telegram_config');
    }
  };

  const isAnyLoading = loadingEndpoint !== null || (userLoading && !userData) || (skillsLoading && !skillsData) || (projectsLoading && !projectsData);

  const getTelegramStatusClass = (visibility: string | undefined) => {
    if (visibility === 'public') return 'bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.5)]';
    if (visibility === 'notify_only') return 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]';
    return 'bg-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-10 transition-colors duration-300 font-sans text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-40 border-b dark:border-gray-800 transition-colors">
        {isAnyLoading && (
          <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
            <div className="h-full bg-primary animate-[loading_1.5s_infinite] origin-left scale-x-0 w-[40%]"></div>
          </div>
        )}
        <div className="w-full px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setUserMenuOpen(true)}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer relative"
            >
              {username.charAt(0).toUpperCase()}
              {telegramConfig?.isLinked && (
                 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${getTelegramStatusClass(telegramConfig.visibility)}`}></div>
                 </div>
              )}
            </button>
            <div className="flex flex-col items-start">
              <h1 className="font-black text-gray-900 dark:text-white tracking-tight leading-none text-lg">
                {username}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={toggleDarkMode} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
               {darkMode ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
             </button>
             <button onClick={toggleDebugMode} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${debugMode ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
              {debugMode ? 'EXIT DEBUG' : 'DEBUG'}
            </button>
             <button onClick={onLogout} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Logout">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-6 pt-2 pb-6">
        {!debugMode ? (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
             {/* Unified Search */}
             <div className="w-full relative z-30">
                 <UnifiedSearch 
                    token={token} 
                    campusId={userData?.campusId || userData?.campus?.id} 
                  />
             </div>
          </div>
        ) : (
          <DebugView 
            token={token}
            initialUsername={username}
            campusId={userData?.campusId || userData?.campus?.id}
            loadingEndpoint={loadingEndpoint}
            isAnyLoading={isAnyLoading}
            onApiCall={handleApiCall}
            onCacheApiCall={handleCacheApiCall}
            onOpenCached={handleOpenCached}
          />
        )}
      </main>

      <UserMenu 
        isOpen={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
        userData={userData}
        pointsData={pointsData}
        projectsData={projectsData}
        skillsData={skillsData}
        token={token}
        loading={{
          user: userLoading && !userData,
          projects: projectsLoading && !projectsData,
          skills: skillsLoading && !skillsData
        }}
        errors={{
          user: userError,
          projects: projectsError,
          skills: skillsError
        }}
        onLogout={onLogout}
        telegramConfig={telegramConfig}
        telegramLoading={telegramLoading}
        onUpdateTelegramConfig={handleConfigUpdate}
      />

      <ResultModal isOpen={modalOpen} onClose={() => setModalOpen(false)} data={modalData} error={modalError} title={modalTitle} />
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%) scaleX(0); }
          50% { transform: translateX(0) scaleX(1); }
          100% { transform: translateX(100%) scaleX(0); }
        }
      `}</style>
    </div>
  );
}
