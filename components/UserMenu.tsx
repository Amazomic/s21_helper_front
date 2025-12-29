
import React, { useEffect, useState } from 'react';
import { UserProfileCard } from './UserProfileCard';
import { ProjectsView } from './ProjectsView';
import { SkillsView } from './SkillsView';
import { ExperienceHistoryView } from './ExperienceHistoryView';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  pointsData: any;
  projectsData: any;
  skillsData: any;
  xpHistoryData: any;
  loading: {
    user: boolean;
    projects: boolean;
    skills: boolean;
    xp: boolean;
  };
  errors: {
    user: string | null;
    projects: string | null;
    skills: string | null;
    xp: string | null;
  };
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isOpen,
  onClose,
  userData,
  pointsData,
  projectsData,
  skillsData,
  xpHistoryData,
  loading,
  errors
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={`relative w-full max-w-sm bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col border border-white/20 dark:border-gray-800 ring-1 ring-black/5 animate-in zoom-in-95 duration-200 overflow-hidden max-h-[85vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Close Button */}
        <div className="absolute top-0 right-0 z-50 p-3">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shadow-sm border border-gray-200/50 dark:border-gray-700/50 transition-colors backdrop-blur-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar p-4 space-y-4 pt-10">
          <UserProfileCard 
            data={userData} 
            points={pointsData} 
            loading={loading.user} 
            error={errors.user} 
          />

          <ProjectsView 
            data={projectsData} 
            isLoading={loading.projects} 
            error={errors.projects} 
          />

          <SkillsView 
            data={skillsData} 
            isLoading={loading.skills} 
            error={errors.skills} 
          />

          <ExperienceHistoryView 
            data={xpHistoryData} 
            isLoading={loading.xp} 
            error={errors.xp} 
          />
        </div>
      </div>
    </div>
  );
};
