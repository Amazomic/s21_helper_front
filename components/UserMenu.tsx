
import React, { useEffect, useState } from 'react';
import { UserProfileCard } from './UserProfileCard';
import { ProjectsView } from './ProjectsView';
import { SkillsView } from './SkillsView';
import { TelegramStatusWidget } from './TelegramStatusWidget';
import { TelegramConfig } from '../types';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  pointsData: any;
  projectsData: any;
  skillsData: any;
  token: string;
  loading: {
    user: boolean;
    projects: boolean;
    skills: boolean;
  };
  errors: {
    user: string | null;
    projects: string | null;
    skills: string | null;
  };
  onLogout: () => void;
  telegramConfig: TelegramConfig | null;
  telegramLoading: boolean;
  onUpdateTelegramConfig: (newConfig: TelegramConfig | null) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isOpen,
  onClose,
  userData,
  pointsData,
  projectsData,
  skillsData,
  token,
  loading,
  errors,
  telegramConfig,
  telegramLoading,
  onUpdateTelegramConfig
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

      {/* Popover Window */}
      <div 
        className={`relative mt-[74px] ml-2 sm:ml-4 w-[calc(100%-1rem)] max-w-sm max-h-[calc(100vh-90px)] flex flex-col origin-top-left transition-all duration-200 ease-out transform-gpu ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Unified Card Container */}
        <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            
            {/* Header */}
            <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/5">
               <div className="flex items-center">
                 {userData?.className && (
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {userData.className}
                    </span>
                 )}
               </div>
               <button 
                 onClick={onClose}
                 className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
                 
                 {/* Section 0: Telegram */}
                 <div className="p-3 lg:p-4">
                   <TelegramStatusWidget 
                      config={telegramConfig} 
                      loading={telegramLoading} 
                      onUpdateConfig={onUpdateTelegramConfig}
                      token={token}
                   />
                 </div>

                 {/* Divider */}
                 <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4"></div>

                 {/* Section 1: Profile */}
                 <div className="p-3 lg:p-4">
                   <UserProfileCard 
                      data={userData} 
                      points={pointsData} 
                      loading={loading.user} 
                      error={errors.user} 
                   />
                 </div>

                 {/* Divider */}
                 <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4"></div>

                 {/* Section 2: Projects */}
                 <ProjectsView 
                    data={projectsData} 
                    isLoading={loading.projects} 
                    error={errors.projects} 
                 />

                 {/* Divider */}
                 <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4"></div>

                 {/* Section 3: Skills */}
                 <SkillsView 
                    data={skillsData} 
                    isLoading={loading.skills} 
                    error={errors.skills} 
                 />
            </div>
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
