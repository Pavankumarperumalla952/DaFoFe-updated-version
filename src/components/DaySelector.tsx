import React from 'react';
import { DayKey, FeedbackEntry } from '../types';
import { DAY_ORDER, MENU } from '../data/menuData';

interface DaySelectorProps {
  selectedDay: DayKey;
  todayKey: DayKey;
  onSelectDay: (day: DayKey) => void;
  allEntries: FeedbackEntry[];
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDay,
  todayKey,
  onSelectDay,
  allEntries
}) => {
  const getDayAverage = (dayKey: DayKey) => {
    const dayEntries = allEntries.filter(
      (e) => e.category === 'mess' && e.day === dayKey
    );
    if (!dayEntries.length) return null;
    const avg = dayEntries.reduce((sum, e) => sum + e.rating, 0) / dayEntries.length;
    return avg.toFixed(1);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono-plex text-[10px] sm:text-xs uppercase font-bold text-[#585B52] tracking-wider">
          Select Schedule
        </span>
      </div>

      <div className="flex sm:grid sm:grid-cols-7 lg:flex lg:flex-col gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
        {DAY_ORDER.map((dayKey) => {
          const day = MENU[dayKey];
          const isToday = dayKey === todayKey;
          const isSelected = dayKey === selectedDay;
          const avg = getDayAverage(dayKey);

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDay(dayKey)}
              className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex-shrink-0 min-w-[76px] sm:min-w-0 ${
                isSelected
                  ? 'border-[#1E2B22] bg-[#1E2B22] text-white shadow-[4px_4px_0px_0px_rgba(232,169,58,1)] sm:shadow-[3px_3px_0px_0px_rgba(232,169,58,1)]'
                  : 'border-transparent bg-white text-[#20241F] hover:border-[#1E2B22]'
              }`}
            >
              <div className="flex justify-between items-baseline gap-1">
                <span className="font-oswald font-bold text-sm uppercase tracking-wide">
                  {isToday ? 'Today' : day.label.slice(0, 3)}
                </span>
                <span
                  className={`font-mono-plex text-[11px] font-bold ${
                    isSelected ? 'text-[#E8A93A]' : 'text-[#585B52]'
                  }`}
                >
                  {avg ? `${avg} ★` : '—'}
                </span>
              </div>
              <div className="text-[10px] mt-0.5 opacity-70 font-mono-plex truncate">
                {isToday ? `${day.label}` : day.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

