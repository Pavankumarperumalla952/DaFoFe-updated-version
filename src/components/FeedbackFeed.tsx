import React, { useState } from 'react';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { CategoryMode, DayKey, FeedbackEntry, MealType } from '../types';
import { MEAL_META, MENU } from '../data/menuData';

interface FeedbackFeedProps {
  mode: CategoryMode;
  selectedDay: DayKey;
  selectedMeal: MealType;
  entries: FeedbackEntry[];
  onUpvote: (id: string) => void;
}

export const FeedbackFeed: React.FC<FeedbackFeedProps> = ({
  mode,
  selectedDay,
  selectedMeal,
  entries,
  onUpvote
}) => {
  const [feedScope, setFeedScope] = useState<'current' | 'all'>('current');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'low' | 'high'>('all');

  const currentLabel =
    mode === 'mess'
      ? `${MENU[selectedDay].label} ${MEAL_META[selectedMeal].label}`
      : 'Canteen';

  // Filter entries based on scope and rating
  const scopedEntries = entries.filter((entry) => {
    if (feedScope === 'current') {
      if (mode === 'mess') {
        return entry.category === 'mess' && entry.day === selectedDay && entry.meal === selectedMeal;
      }
      return entry.category === 'canteen';
    }
    return true;
  });

  const filteredEntries = scopedEntries
    .filter((entry) => {
      if (ratingFilter === 'low') return entry.rating <= 2;
      if (ratingFilter === 'high') return entry.rating >= 4;
      return true;
    })
    .sort((a, b) => b.ts - a.ts);

  const getRatingBadge = (r: number) => {
    if (r <= 2) {
      return (
        <span className="bg-[#B5484D]/15 text-[#7E2F32] border border-[#B5484D]/30 text-[11px] font-bold px-2 py-0.5 rounded font-mono-plex">
          {r}/5 ★
        </span>
      );
    }
    if (r >= 4) {
      return (
        <span className="bg-[#5C8A56]/20 text-[#3B5E38] border border-[#5C8A56]/30 text-[11px] font-bold px-2 py-0.5 rounded font-mono-plex">
          {r}/5 ★
        </span>
      );
    }
    return (
      <span className="bg-[#E8A93A]/20 text-[#B87F1E] border border-[#E8A93A]/30 text-[11px] font-bold px-2 py-0.5 rounded font-mono-plex">
        {r}/5 ★
      </span>
    );
  };

  const formatTime = (ts: number, dateStr: string) => {
    const diffMin = Math.floor((Date.now() - ts) / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border-2 border-[#1E2B22] p-5 sm:p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,43,34,1)] space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b-2 border-[#1E2B22]/10">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono-plex text-[10px] uppercase font-bold tracking-widest text-[#585B52]">
              Live Stream
            </span>
            <span className="bg-[#E8A93A]/20 text-[#1E2B22] border border-[#E8A93A]/50 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono-plex">
              24h Daily Feed
            </span>
          </div>
          <h2 className="font-oswald font-bold text-base sm:text-lg uppercase text-[#1E2B22]">
            Community Pulse
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono-plex text-xs">
          <div className="inline-flex bg-[#EDEEE8] rounded-lg p-0.5 border border-[#C9CDC5]">
            <button
              type="button"
              onClick={() => setFeedScope('current')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                feedScope === 'current'
                  ? 'bg-[#1E2B22] text-white shadow-xs'
                  : 'text-[#585B52] hover:text-[#20241F]'
              }`}
            >
              This Meal
            </button>
            <button
              type="button"
              onClick={() => setFeedScope('all')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                feedScope === 'all'
                  ? 'bg-[#1E2B22] text-white shadow-xs'
                  : 'text-[#585B52] hover:text-[#20241F]'
              }`}
            >
              All Meals
            </button>
          </div>

          <div className="inline-flex bg-[#EDEEE8] rounded-lg p-0.5 border border-[#C9CDC5]">
            <button
              type="button"
              onClick={() => setRatingFilter('all')}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                ratingFilter === 'all' ? 'bg-[#1E2B22] text-white shadow-xs' : 'text-[#585B52]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setRatingFilter('low')}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                ratingFilter === 'low' ? 'bg-[#B5484D] text-white shadow-xs' : 'text-[#7E2F32]'
              }`}
            >
              Low
            </button>
            <button
              type="button"
              onClick={() => setRatingFilter('high')}
              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                ratingFilter === 'high' ? 'bg-[#5C8A56] text-white shadow-xs' : 'text-[#3B5E38]'
              }`}
            >
              High
            </button>
          </div>
        </div>
      </div>

      {/* Feed List Items */}
      <div className="divide-y-2 divide-dashed divide-[#1E2B22]/10 max-h-[480px] overflow-y-auto pr-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-[#C9CDC5] mx-auto mb-2" />
            <p className="font-mono-plex text-xs font-bold text-[#1E2B22] uppercase tracking-wider">
              No ratings for today yet
            </p>
            <p className="text-xs text-[#585B52] mt-1 max-w-xs mx-auto">
              Student ratings refresh every 24 hours. Be the first to drop today&apos;s feedback!
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const entryMealLabel =
              entry.category === 'mess' && entry.day && entry.meal
                ? `${MENU[entry.day].label} ${MEAL_META[entry.meal].label}`
                : 'Canteen';

            return (
              <div key={entry.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold text-xs uppercase tracking-wide text-[#1E2B22] font-mono-plex">
                    {feedScope === 'all' ? entryMealLabel : MEAL_META[entry.meal || 'lunch']?.label || 'Review'} • {formatTime(entry.ts, entry.date)}
                  </span>
                  {getRatingBadge(entry.rating)}
                </div>

                {/* Issue tags if any */}
                {entry.reasons && entry.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {entry.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="font-mono-plex text-[10px] font-bold bg-[#F6E1E1] text-[#7E2F32] border border-[#B5484D]/30 px-2 py-0.5 rounded"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                {/* Comment text */}
                {entry.comment ? (
                  <p className="text-xs sm:text-sm text-[#20241F] leading-relaxed mb-2 font-sans">
                    {entry.comment}
                  </p>
                ) : !entry.reasons || entry.reasons.length === 0 ? (
                  <p className="text-xs text-[#585B52] italic mb-2">
                    Score submitted without comment.
                  </p>
                ) : null}

                {/* Upvote row */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onUpvote(entry.id)}
                    className="inline-flex items-center gap-1.5 font-mono-plex text-[11px] font-bold text-[#1E2B22] bg-[#EDEEE8] hover:bg-[#D9DBD1] border border-[#C9CDC5] px-2.5 py-1 rounded transition-colors cursor-pointer"
                    title="Agree with this feedback"
                  >
                    <ThumbsUp className="w-3 h-3 text-[#41573F]" />
                    <span>{entry.upvotes || 0} Agree</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

