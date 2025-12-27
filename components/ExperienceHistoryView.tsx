
import React, { useMemo, useState } from 'react';
import { Card } from './ui/Card';

interface ExperienceHistoryViewProps {
  data: any;
  isLoading: boolean;
  error?: string | null;
}

export const ExperienceHistoryView: React.FC<ExperienceHistoryViewProps> = ({ data, isLoading, error }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const history = useMemo(() => {
    if (!data) return [];
    let list: any[] = [];
    if (Array.isArray(data)) list = data;
    else if (data.history && Array.isArray(data.history)) list = data.history;
    else if (data.data && Array.isArray(data.data)) list = data.data;

    const validItems = list.filter(item => 
      (item.amount || item.xp || item.value) && 
      (item.occurredAt || item.date || item.created_at)
    );

    return validItems.map(item => ({
      amount: Number(item.amount || item.xp || item.value || 0),
      occurredAt: item.occurredAt || item.date || item.created_at
    })).sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  }, [data]);

  const cumulativeData = useMemo(() => {
    let total = 0;
    return history.map(h => {
      total += h.amount;
      return { ...h, total };
    });
  }, [history]);

  if (isLoading) {
    return (
      <Card className="h-28 animate-pulse rounded-3xl">
        <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded opacity-30"></div>
      </Card>
    );
  }

  if (error || cumulativeData.length < 2) {
    return null;
  }

  const maxY = cumulativeData[cumulativeData.length - 1].total;
  const getX = (index: number) => (index / (cumulativeData.length - 1)) * 100;
  const getY = (val: number) => 100 - ((val / maxY) * 100);

  const pointsString = cumulativeData.map((d, i) => `${getX(i)},${getY(d.total)}`).join(' ');
  const areaPointsString = `0,100 ${pointsString} 100,100`;

  return (
    <Card className="shadow-md border-none overflow-visible bg-white dark:bg-gray-900 rounded-3xl">
      <div className="mb-1 px-1">
         <h3 className="font-black text-gray-800 dark:text-white text-[9px] uppercase tracking-widest opacity-60">XP Trajectory</h3>
      </div>
      
      <div className="relative w-full h-20 group select-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
            <defs>
                <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={areaPointsString} fill="url(#xpGradient)" />
            <polyline points={pointsString} fill="none" stroke="#22c55e" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {cumulativeData.map((d, i) => (
            <div
                key={i}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 outline-none"
                style={{
                    left: `${getX(i)}%`,
                    top: `${getY(d.total)}%`,
                    width: '12px',
                    height: '12px',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
            >
                <div className={`w-1 h-1 rounded-full bg-emerald-500 mx-auto transition-all duration-200 border border-white dark:border-gray-900 ${hoveredIndex === i ? 'scale-150 shadow-lg' : 'opacity-0 group-hover:opacity-40'}`}></div>
                
                {hoveredIndex === i && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-900/95 backdrop-blur-sm text-white text-[7px] rounded py-1 px-1.5 shadow-2xl whitespace-nowrap z-50 border border-white/10">
                        <div className="font-black text-gray-400 mb-0.5">
                            {new Date(d.occurredAt).toLocaleDateString()}
                        </div>
                        <div className="flex justify-between gap-3 font-mono font-bold">
                            <span>Total</span>
                            <span className="text-emerald-400">{d.total.toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>
        ))}
      </div>
    </Card>
  );
};