import React from 'react';
import { Clock, ShieldCheck, Lock, RefreshCw, Calendar } from 'lucide-react';
import { CategoryMode, DayKey, MealType } from '../types';
import { MEAL_META, MENU } from '../data/menuData';

interface HeaderProps {
  currentMeal: MealType;
  todayKey: DayKey;
  onQuickJumpToNow: () => void;
  mode: CategoryMode;
  selectedDay: DayKey;
  selectedMeal: MealType;
  isAdmin: boolean;
  onOpenAdminPortal: () => void;
  dayNumber?: number;
  timeUntilRefresh?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentMeal,
  todayKey,
  onQuickJumpToNow,
  mode,
  selectedDay,
  selectedMeal,
  isAdmin,
  onOpenAdminPortal,
  dayNumber = 1,
  timeUntilRefresh = ''
}) => {
  const isNowSelected = mode === 'mess' && selectedDay === todayKey && selectedMeal === currentMeal;
  const currentSelectionTitle =
    mode === 'mess'
      ? `${MENU[selectedDay].label} ${MEAL_META[selectedMeal].label}`
      : 'Canteen Food';

  return (
    <div className="w-full">
      {/* Top Navbar */}
      <header className="bg-[#1E2B22] border-b-4 border-[#E8A93A] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-[#E8A93A] text-[#1E2B22] px-3 py-1 font-oswald font-black tracking-tighter text-2xl rounded-sm shadow-[2px_2px_0px_0px_rgba(30,43,34,0.4)]">
            DaFoFe
          </div>
          <div className="flex flex-col">
            <div className="text-[#D9DBD1] font-mono-plex text-xs tracking-widest uppercase font-semibold">
              Daily Food Feedback
            </div>
            <div className="text-[10px] font-mono-plex text-[#E8A93A] font-bold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E8A93A] animate-pulse"></span>
              <span>Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* 24h Auto-Refresh Status Pill */}
          <div
            className="hidden md:flex items-center gap-2 bg-[#2B3A2E] border border-[#E8A93A]/40 px-3 py-1.5 rounded-lg text-xs font-mono-plex text-[#EDEEE8]"
            title="Student ratings refresh automatically every 24 hours at 00:00 midnight"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-[#E8A93A] shrink-0" />
            <span className="text-[11px] text-[#C9CDC5]">
              Next 24h Reset: <span className="text-white font-bold">{timeUntilRefresh || 'At Midnight'}</span>
            </span>
          </div>

          {!isNowSelected && (
            <button
              onClick={onQuickJumpToNow}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono-plex font-bold bg-[#2B3A2E] hover:bg-[#41573F] text-[#EDEEE8] border border-[#E8A93A]/40 rounded cursor-pointer transition-all active:scale-95"
              title="Jump to today's active meal"
            >
              <Clock className="w-3.5 h-3.5 text-[#E8A93A]" />
              <span className="hidden sm:inline">Now:</span> {MEAL_META[currentMeal].label}
            </button>
          )}

          <div className="hidden xs:flex items-center gap-1.5 bg-[#E8A93A]/10 border border-[#E8A93A]/30 px-2.5 py-1.5 rounded">
            <div className="w-2 h-2 rounded-full bg-[#E8A93A] animate-pulse"></div>
            <span className="font-mono-plex text-[10px] text-[#E8A93A] uppercase font-bold tracking-widest whitespace-nowrap">
              Anonymous
            </span>
          </div>

          <button
            onClick={onOpenAdminPortal}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-oswald font-bold uppercase tracking-wider cursor-pointer transition-all active:scale-95 ${
              isAdmin
                ? 'bg-[#5C8A56] hover:bg-[#4E7748] text-white shadow-xs'
                : 'bg-[#E8A93A] hover:bg-[#D99A2D] text-[#1E2B22] shadow-[2px_2px_0px_0px_rgba(30,43,34,0.4)]'
            }`}
            title={isAdmin ? 'Open Admin Feedback Dashboard' : 'Admin Login for Mess Committee & Wardens'}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Admin Console</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Admin Login</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Hero Title Section */}
      <div className="bg-[#1E2B22] text-[#EDEEE8] px-4 sm:px-8 py-6 sm:py-8 border-b-2 border-[#1E2B22]/20">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono-plex text-[11px] font-bold text-[#E8A93A] uppercase tracking-widest">
                Student Food Review
              </span>
              <span className="bg-[#E8A93A]/20 text-[#E8A93A] border border-[#E8A93A]/40 text-[10px] font-mono-plex font-bold px-2 py-0.5 rounded">
                24h Daily Rating Cycle
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-oswald tracking-tight uppercase leading-none text-white">
              How is <br className="hidden sm:inline" />
              <span className="text-[#E8A93A]">{currentSelectionTitle}?</span>
            </h1>
          </div>
          <div className="max-w-md space-y-1.5">
            <p className="text-xs sm:text-sm text-[#C9CDC5] leading-relaxed font-sans">
              Student ratings refresh fresh every 24 hours at midnight so scores always reflect today&apos;s food. Cumulative data is archived in the Admin Console.
            </p>
            {timeUntilRefresh && (
              <p className="text-[11px] font-mono-plex text-[#E8A93A] font-bold flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 text-[#E8A93A]" />
                <span>Today&apos;s cycle refreshes in: {timeUntilRefresh}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

