
import React from 'react';
import { Card } from './ui/Card';

interface UserProfileProps {
  data: any;
  points: any;
  loading: boolean;
  error: string | null;
}

export const UserProfileCard: React.FC<UserProfileProps> = ({ data, points, loading, error }) => {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 w-1/3 rounded"></div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 w-1/2 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="text-center text-red-500 dark:text-red-400 text-[10px]">
        <p>Profile Error</p>
      </Card>
    );
  }

  const currentXP = data.expValue || 0;
  const remainingXP = data.expToNextLevel || 0;
  const levelInteger = Math.floor(data.level || 0);
  const totalNeededForNext = currentXP + remainingXP;
  const progress = totalNeededForNext > 0 
    ? Math.min(100, Math.max(0, (currentXP / totalNeededForNext) * 100)) 
    : 0;

  const coalition = data.coalition;

  return (
    <Card className="relative overflow-hidden bg-white dark:bg-gray-900 shadow-md border-none rounded-3xl group">
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors"></div>

      <div className="flex flex-col gap-2 lg:gap-4">
        {/* Compact Single Line Info Bar */}
        <div className="flex items-stretch gap-1 lg:gap-2">
            {/* Level Box */}
            <div className="flex-none flex flex-col items-center justify-center bg-primary/10 rounded-xl px-1.5 py-1 lg:py-2 min-w-[2.4rem] lg:min-w-[3.2rem] border border-primary/20 shadow-inner">
                <span className="text-base lg:text-xl font-black text-primary dark:text-green-400 leading-none tracking-tighter">
                    {levelInteger}
                </span>
                <span className="text-[6px] lg:text-[8px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">LVL</span>
            </div>

            {/* Coalition Box */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/40 rounded-xl px-1.5 py-1 border border-gray-100 dark:border-gray-800 shadow-inner min-w-0">
                <span className="text-[9px] lg:text-xs font-black text-gray-800 dark:text-white truncate w-full text-center leading-tight">
                    {coalition ? coalition.name : 'Freelance'}
                </span>
                <span className="text-[6px] lg:text-[8px] font-bold text-gray-400 uppercase tracking-tight truncate w-full text-center">
                    R:{coalition ? (coalition.rank ?? 'null') : 'none'}
                </span>
            </div>

            {/* PRP Box */}
            <div className="flex-none flex flex-col items-center justify-center bg-blue-500/5 rounded-xl px-1.5 py-1 min-w-[2.4rem] lg:min-w-[3rem] border border-blue-500/10 shadow-inner">
                <span className="text-[10px] lg:text-xs font-black text-blue-600 dark:text-blue-400 leading-none">
                    {points?.peerReviewPoints || 0}
                </span>
                <span className="text-[6px] lg:text-[8px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">PRP</span>
            </div>

            {/* Coins Box */}
            <div className="flex-none flex flex-col items-center justify-center bg-amber-500/5 rounded-xl px-1.5 py-1 min-w-[2.4rem] lg:min-w-[3rem] border border-amber-500/10 shadow-inner">
                <span className="text-[10px] lg:text-xs font-black text-amber-500 leading-none">
                    {points?.coins || 0}
                </span>
                <span className="text-[6px] lg:text-[8px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">COIN</span>
            </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-1 lg:space-y-2">
            <div className="flex justify-between items-end text-[7px] lg:text-[9px] font-bold text-gray-400 uppercase font-mono px-0.5">
                <span>{currentXP.toLocaleString()} XP</span>
                <span className="text-primary dark:text-green-400">{totalNeededForNext.toLocaleString()} XP</span>
            </div>

            <div className="w-full h-1 lg:h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <div 
                    className="h-full bg-primary dark:bg-green-500 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            
            <p className="text-[6px] lg:text-[8px] text-center text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">
                {remainingXP.toLocaleString()} to Next
            </p>
        </div>
      </div>
    </Card>
  );
};