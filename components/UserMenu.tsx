
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
      className="fixed inset-0 z-[100] flex justify-end transition-opacity duration-200"
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer/Modal Panel */}
      <div 
        className={`relative w-full max-w-md h-full bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-2xl overflow-y-auto custom-scrollbar border-l border-white/20 dark:border-gray-800 transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Sticky Close Button Header */}
        <div className="sticky top-0 right-0 z-50 flex justify-end p-4 bg-gradient-to-b from-gray-100/90 to-transparent dark:from-gray-900/90 pointer-events-none">
          <button 
            onClick={onClose}
            className="pointer-events-auto p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 pb-24 -mt-12 space-y-6">
            
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
