
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
    <div className="fixed inset-0 z-[100] flex justify-start items-start" role="dialog" aria-modal="true">
      {/* Invisible Backdrop to handle click-outside */}
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={onClose}
      />

      {/* Popover Window - Positioned under the header button with margin (mt-[74px]) */}
      <div 
        className={`relative mt-[74px] ml-2 sm:ml-4 w-[calc(100%-1rem)] max-w-sm max-h-[calc(100vh-90px)] flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 ring-1 ring-black/5 origin-top-left transition-all duration-200 ease-out transform-gpu ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header Section */}
        <div className="flex-none flex items-center justify-between px-4 pt-3 pb-2 z-50">
          <div className="h-4 flex items-center">
            {/* Class Name */}
            {userData?.className && (
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {userData.className}
              </span>
            )}
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 scrollbar-hide min-h-0">
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
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
