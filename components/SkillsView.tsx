
import React, { useMemo, useState, useEffect } from 'react';
import { Card } from './ui/Card';

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
  // Collapse by default on mobile screens (< 1024px)
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    setIsCollapsed(isMobile);
  }, []);

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
      <Card className="h-40 animate-pulse rounded-3xl">
        <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="flex items-end space-x-1 h-24">
           {[...Array(8)].map((_, i) => (
             <div key={i} className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
           ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-40 flex items-center justify-center text-red-500 dark:text-red-400 rounded-3xl">
        <p className="text-[9px] font-black uppercase">Skills Error</p>
      </Card>
    );
  }

  if (!data?.skills || data.skills.length === 0) {
    return (
      <Card className="h-40 flex items-center justify-center text-gray-400 rounded-3xl">
        <p className="text-[9px] font-black uppercase">No Skills</p>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col shadow-2xl border-none overflow-hidden rounded-[2rem] transition-all duration-300 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-gray-800 ring-1 ring-black/5 ${isCollapsed ? 'max-h-[38px]' : 'max-h-[300px] lg:max-h-[340px]'}`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-left focus:outline-none group px-0.5"
      >
         <h3 className="font-black text-gray-800 dark:text-white text-[8px] lg:text-[10px] uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100 transition-opacity">
            Skills <span className="text-[6px] lg:text-[7px] ml-1 opacity-50">({sortedSkills.length})</span>
         </h3>
         <div className="lg:hidden text-primary">
            <svg className={`w-3 h-3 transform transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
         </div>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 invisible h-0 overflow-hidden' : 'opacity-100 visible'}`}>
        {/* Chart Bars */}
        <div className="relative w-full h-28 lg:h-36 mt-2">
          <div className="absolute inset-0 flex items-end justify-between gap-[0.5px] lg:gap-[2px] px-0.5 pb-0.5">
            {sortedSkills.map((skill) => {
               const rawPercent = (skill.points / maxPoints) * 100;
               const heightPercent = Math.max(rawPercent, 5);
               const isActive = activeSkill?.name === skill.name;
               
               return (
                 <div 
                   key={skill.name} 
                   className="relative h-full flex flex-col justify-end flex-1 min-w-[1px] cursor-pointer"
                   onMouseEnter={() => setActiveSkill(skill)}
                   onClick={() => setActiveSkill(skill)}
                 >
                    <div 
                      className={`w-full rounded-t-[1px] transition-all duration-300 ${
                        isActive 
                        ? 'bg-primary shadow-[0_0_8px_rgba(36,139,101,0.4)] h-full z-10' 
                        : 'bg-primary/30 hover:bg-primary/60'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    ></div>
                 </div>
               )
            })}
          </div>
        </div>

        {/* Active Skill Info Display */}
        <div className="h-6 flex flex-col items-center justify-center mt-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
          {activeSkill ? (
            <div className="flex items-center gap-1 whitespace-nowrap overflow-hidden max-w-full">
              <span className="text-[7px] lg:text-[9px] font-black text-gray-800 dark:text-white uppercase tracking-wider truncate">
                {activeSkill.name}
              </span>
              <span className="text-[7px] lg:text-[9px] font-black text-primary dark:text-emerald-400">
                • {activeSkill.points.toLocaleString()} PTS
              </span>
            </div>
          ) : (
            <div className="text-[6px] lg:text-[7px] font-bold text-gray-400 uppercase tracking-[0.2em] opacity-40">
              Select bar
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};