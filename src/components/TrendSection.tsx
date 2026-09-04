import React from 'react';
import { FeedbackEntry } from '../types';
import { TrendingUp } from 'lucide-react';

interface TrendSectionProps {
  entries: FeedbackEntry[];
  dayNumber?: number;
}

export const TrendSection: React.FC<TrendSectionProps> = ({ entries, dayNumber = 1 }) => {
  // Generate the last 7 dates YYYY-MM-DD
  const days: { dateKey: string; label: string; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    days.push({ dateKey, label, isToday: i === 0 });
  }

  // Calculate 7-day metrics
  const last7DaysEntries = entries.filter((e) =>
    days.some((d) => d.dateKey === e.date)
  );

  const overallAvg =
    last7DaysEntries.length > 0
      ? (
          last7DaysEntries.reduce((sum, e) => sum + e.rating, 0) /
          last7DaysEntries.length
        ).toFixed(1)
      : '—';

  // Count reasons to find top issue
  const reasonCount: Record<string, number> = {};
  last7DaysEntries.forEach((e) => {
    e.reasons?.forEach((r) => {
      reasonCount[r] = (reasonCount[r] || 0) + 1;
    });
  });

  const topIssue = Object.entries(reasonCount).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="bg-white border-2 border-[#1E2B22] p-5 sm:p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,43,34,1)] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#1E2B22]/10">
        <div>
          <span className="font-mono-plex text-[10px] uppercase font-bold tracking-widest text-[#585B52] block">
            Quality Trend
          </span>
          <h2 className="font-oswald font-bold text-base sm:text-lg uppercase text-[#1E2B22] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#41573F]" />
            <span>7-Day Rating Trend</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono-plex text-[10px] font-bold text-[#E8A93A] bg-[#1E2B22] px-2 py-1 rounded">
            Daily Cycle
          </span>
          <span className="font-mono-plex text-[10px] font-bold text-[#585B52] bg-[#EDEEE8] px-2 py-1 rounded">
            Last 7 Days
          </span>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#EDEEE8] border border-[#C9CDC5] rounded-xl p-2.5 text-center">
          <p className="font-mono-plex text-[10px] uppercase tracking-wider text-[#585B52] font-bold mb-0.5">
            Avg Score
          </p>
          <p className="font-mono-plex font-black text-base sm:text-lg text-[#1E2B22] flex items-center justify-center gap-0.5">
            <span>{overallAvg}</span>
            {overallAvg !== '—' && <span className="text-[#E8A93A]">★</span>}
          </p>
        </div>

        <div className="bg-[#EDEEE8] border border-[#C9CDC5] rounded-xl p-2.5 text-center">
          <p className="font-mono-plex text-[10px] uppercase tracking-wider text-[#585B52] font-bold mb-0.5">
            Total Reviews
          </p>
          <p className="font-mono-plex font-black text-base sm:text-lg text-[#1E2B22]">
            {last7DaysEntries.length}
          </p>
        </div>

        <div className="bg-[#EDEEE8] border border-[#C9CDC5] rounded-xl p-2.5 text-center">
          <p className="font-mono-plex text-[10px] uppercase tracking-wider text-[#585B52] font-bold mb-0.5">
            Top Flag
          </p>
          <p className="font-mono-plex font-bold text-xs text-[#7E2F32] truncate">
            {topIssue ? topIssue[0] : 'None'}
          </p>
        </div>
      </div>

      {/* Trend Bars */}
      <div className="space-y-2 pt-1">
        {days.map(({ dateKey, label }) => {
          const dayEntries = entries.filter((e) => e.date === dateKey);

          if (!dayEntries.length) {
            return (
              <div key={dateKey} className="flex items-center gap-2.5 py-1">
                <span className="font-mono-plex text-xs text-[#585B52] w-14 flex-shrink-0 font-medium">
                  {label}
                </span>
                <div className="flex-1 h-2 bg-[#EDEEE8] rounded-full overflow-hidden border border-[#D9DBD1]" />
                <span className="font-mono-plex text-xs text-[#585B52] w-7 text-right">
                  —
                </span>
              </div>
            );
          }

          const avg =
            dayEntries.reduce((sum, e) => sum + e.rating, 0) / dayEntries.length;
          const pct = Math.min(100, Math.round((avg / 5) * 100));

          const barColorClass =
            avg <= 2.5
              ? 'bg-[#B5484D]'
              : avg >= 4.0
              ? 'bg-[#5C8A56]'
              : 'bg-[#E8A93A]';

          return (
            <div key={dateKey} className="flex items-center gap-2.5 py-1">
              <span className="font-mono-plex text-xs text-[#20241F] font-bold w-14 flex-shrink-0">
                {label}
              </span>
              <div className="flex-1 h-2 bg-[#EDEEE8] rounded-full overflow-hidden border border-[#D9DBD1]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="font-mono-plex text-xs font-black text-[#1E2B22] w-7 text-right">
                {avg.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

