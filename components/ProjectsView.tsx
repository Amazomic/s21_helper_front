
import React, { useMemo, useState } from 'react';

interface Project {
  id: number;
  status: string;
  title: string;
  type?: string;
}

interface ProjectsViewProps {
  data: { projects: Project[] } | Project[] | null;
  isLoading: boolean;
  error?: string | null;
  onProjectClick?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ data, isLoading, error, onProjectClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const activeProjects = useMemo(() => {
    if (!data) return [];
    
    // Normalize data structure (handle both { projects: [...] } and [...])
    const list = Array.isArray(data) ? data : (data.projects || []);
    
    return list.filter(p => 
      p.status === 'IN_PROGRESS' || 
      p.status === 'IN_REVIEWS' || 
      p.status === 'WAITING_FOR_CORRECTION'
    );
  }, [data]);

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

  const handleProjectSelect = (p: Project) => {
    // Dispatch custom event for the search component
    window.dispatchEvent(new CustomEvent('s21:select_project', { 
        detail: { id: p.id, code: p.title } 
    }));
    
    // Trigger callback (usually to close the menu)
    if (onProjectClick) {
        onProjectClick();
    }
  };

  if (isLoading) {
    return (
      <div className="p-3 lg:p-4 animate-pulse w-full">
        <div className="flex justify-between items-center mb-2">
            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-2 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 lg:p-4 text-center text-red-500 dark:text-red-400 w-full">
        <p className="text-[9px] font-black uppercase">Projects Error</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-transparent">
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="relative z-10 flex items-center justify-between w-full text-left focus:outline-none group p-3 lg:p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors duration-300 cursor-pointer"
      >
         <div className="flex items-baseline gap-2.5">
            <h3 className="font-black text-gray-800 dark:text-white group-hover:text-primary dark:group-hover:text-primary text-[10px] lg:text-xs uppercase tracking-[0.2em] transition-colors duration-300">
                Active Projects
            </h3>
            <span className="text-[9px] lg:text-[10px] font-bold text-gray-400 dark:text-gray-500 transition-colors">
                ({activeProjects.length})
            </span>
         </div>
         
         <div className={`text-gray-300 dark:text-gray-600 group-hover:text-primary dark:group-hover:text-primary transition-all duration-500 transform ${isCollapsed ? 'rotate-0' : '-rotate-180'}`}>
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
         </div>
      </button>
      
      {/* Updated to use Grid Rows for smooth auto-height animation */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
        <div className="overflow-hidden">
          <div className="px-3 lg:px-4 pb-3 lg:pb-4 space-y-2">
              {activeProjects.length === 0 ? (
                  <div className="text-center py-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      No active projects
                  </div>
              ) : (
                  activeProjects.map((p) => (
                      <button 
                        key={p.id} 
                        onClick={() => handleProjectSelect(p)}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-700 hover:border-primary/30 dark:hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group/item text-left"
                      >
                          <span className="text-[10px] lg:text-xs font-bold text-gray-700 dark:text-gray-200 truncate pr-2 group-hover/item:text-primary transition-colors" title={p.title}>
                              {p.title}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded border ${getStatusColor(p.status)} whitespace-nowrap`}>
                              {formatStatus(p.status)}
                          </span>
                      </button>
                  ))
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
