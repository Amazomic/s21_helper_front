
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
  errors,
  onLogout
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`relative w-full max-w-md bg-gray-100 dark:bg-gray-950 h-full shadow-2xl overflow-y-auto custom-scrollbar transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 pt-16 lg:p-6 lg:pt-20 space-y-6 pb-24">
            
          {/* Close Button (Mobile friendly position) */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white shadow-sm border border-gray-200 dark:border-gray-700 z-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="space-y-6">
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

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <button 
                    onClick={onLogout}
                    className="w-full py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
