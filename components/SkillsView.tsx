
import React, { useMemo, useState } from 'react';

interface Skill {
  name: string;
  points: number;
}

interface SkillsData {
  skills: Skill[];
}

interface SkillsViewProps {
  data: SkillsData | null;
  isLoading: boolean;
  error?: string | null;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ data, isLoading, error }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);

  const sortedSkills = useMemo(() => {
    if (!data?.skills) return [];
    return [...data.skills].sort((a, b) => b.points - a.points);
  }, [data]);

  const maxPoints = useMemo(() => {
    if (sortedSkills.length === 0) return 100;
    return sortedSkills[0].points;
  }, [sortedSkills]);

  if (isLoading) {
    return (
      <div className="p-3 lg:p-4 animate-pulse w-full">
        <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="flex items-end space-x-1 h-24">
           {[...Array(8)].map((_, i) => (
             <div key={i} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
           ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 lg:p-4 flex items-center justify-center text-red-500 dark:text-red-400 w-full">
        <p className="text-[9px] font-black uppercase">Skills Error</p>
      </div>
    );
  }

  if (!data?.skills || data.skills.length === 0) {
    return (
      <div className="p-3 lg:p-4 flex items-center justify-center text-gray-400 w-full">
        <p className="text-[9px] font-black uppercase">No Skills</p>
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
                Skills
            </h3>
            <span className="text-[9px] lg:text-[10px] font-bold text-gray-400 dark:text-gray-500 transition-colors">
                ({sortedSkills.length})
            </span>
         </div>
         
         <div className={`text-gray-300 dark:text-gray-600 group-hover:text-primary dark:group-hover:text-primary transition-all duration-500 transform ${isCollapsed ? 'rotate-0' : '-rotate-180'}`}>
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
         </div>
      </button>
      
      <div className={`transition-all duration-500 ease-in-out origin-top overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[400px] opacity-100'}`}>
        <div className="px-3 lg:px-4 pb-3 lg:pb-4">
            {/* Chart Bars */}
            <div className="relative w-full h-28 lg:h-36 mt-1">
              <div className="absolute inset-0 flex items-end justify-between gap-[1.5px] lg:gap-[3px] px-0.5 pb-0.5">
                {sortedSkills.map((skill) => {
                   const rawPercent = (skill.points / maxPoints) * 100;
                   const heightPercent = Math.max(rawPercent, 5);
                   const isActive = activeSkill?.name === skill.name;
                   
                   return (
                     <div 
                       key={skill.name} 
                       className="relative h-full flex flex-col justify-end flex-1 min-w-[1px] cursor-pointer group/bar"
                       onMouseEnter={() => setActiveSkill(skill)}
                       onClick={() => setActiveSkill(skill)}
                     >
                        <div 
                          className={`w-full rounded-t-[1px] transition-all duration-300 ${
                            isActive 
                            ? 'bg-primary shadow-[0_0_8px_rgba(36,139,101,0.4)] h-full z-10' 
                            : 'bg-primary/30 group-hover/bar:bg-primary/60'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                     </div>
                   )
                })}
              </div>
            </div>

            {/* Active Skill Info Display */}
            <div className="h-6 flex flex-col items-center justify-center mt-3 animate-in fade-in slide-in-from-bottom-1 duration-300 border-t border-dashed border-gray-100 dark:border-gray-800 pt-3">
              {activeSkill ? (
                <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden max-w-full">
                  <span className="text-[9px] lg:text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-wider truncate">
                    {activeSkill.name}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-[9px] lg:text-[10px] font-black text-primary dark:text-emerald-400">
                    {activeSkill.points.toLocaleString()} PTS
                  </span>
                </div>
              ) : (
                <div className="text-[7px] lg:text-[8px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-[0.2em]">
                  Tap bar for details
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};
