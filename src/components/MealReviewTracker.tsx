import React from 'react';
import { MealType, UserMealReview } from '../types';
import { MEAL_ORDER, MEAL_META, getMealFullTitle } from '../data/menuData';
import { Check, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

interface MealReviewTrackerProps {
  reviewedMeals: Partial<Record<MealType, UserMealReview>>;
  selectedMeal: MealType;
  onSelectMeal: (meal: MealType) => void;
}

export const MealReviewTracker: React.FC<MealReviewTrackerProps> = ({
  reviewedMeals,
  selectedMeal,
  onSelectMeal
}) => {
  const reviewedCount = MEAL_ORDER.filter((m) => Boolean(reviewedMeals[m])).length;
  const progressPercent = Math.round((reviewedCount / MEAL_ORDER.length) * 100);

  return (
    <div className="bg-white border-2 border-[#1E2B22] p-4 sm:p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(30,43,34,1)]">
      {/* Header with counter */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <span className="font-mono-plex text-[10px] uppercase font-bold tracking-widest text-[#585B52] block">
            Personal Daily Tracker
          </span>
          <h3 className="font-oswald font-bold text-sm sm:text-base uppercase text-[#1E2B22]">
            Daily Meal Reviews ({reviewedCount}/4 Completed)
          </h3>
        </div>
        <div className="flex items-center gap-1 font-mono-plex text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3EEDE] border border-[#5C8A56]/40 text-[#3B5E38]">
          <ShieldCheck className="w-3 h-3 text-[#5C8A56]" />
          <span>1 Review / Meal</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#EDEEE8] h-2 rounded-full overflow-hidden mb-3.5 border border-[#C9CDC5]">
        <div
          className="bg-[#E8A93A] h-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 4 Meals Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MEAL_ORDER.map((meal) => {
          const review = reviewedMeals[meal];
          const isDone = Boolean(review);
          const isCurrent = meal === selectedMeal;
          const title = getMealFullTitle(meal);
          const time = MEAL_META[meal].time.split('-')[0].trim();

          return (
            <button
              key={meal}
              type="button"
              onClick={() => onSelectMeal(meal)}
              className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'border-[#1E2B22] bg-[#1E2B22] text-white shadow-[2px_2px_0px_0px_rgba(232,169,58,1)]'
                  : isDone
                  ? 'border-[#5C8A56]/40 bg-[#EEF4EC] text-[#20241F] hover:border-[#1E2B22]'
                  : 'border-[#C9CDC5] bg-[#F8F9F5] text-[#20241F] hover:border-[#1E2B22]'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-oswald font-bold text-xs uppercase truncate">
                  {title}
                </span>
                {isDone ? (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#3B5E38] text-white">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-[#C9CDC5]" />
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono-plex">
                <span className={isCurrent ? 'text-[#E8A93A]' : 'text-[#585B52]'}>
                  {time}
                </span>
                <span className="font-bold">
                  {isDone ? `${review?.rating}★ Done` : 'Pending'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Policy reminder footer */}
      <div className="mt-3 pt-2.5 border-t border-[#1E2B22]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] font-mono-plex text-[#585B52]">
        <div className="flex items-center gap-1.5 text-[10px]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3B5E38] shrink-0" />
          <span>Each person reviews Morning Tiffin, Afternoon Lunch, Evening Snacks, and Night Dinner only once</span>
        </div>
        <span className={`text-[10px] font-bold ${4 - reviewedCount === 0 ? 'text-[#3B5E38]' : 'text-[#1E2B22]'}`}>
          {4 - reviewedCount === 0 ? '✓ All 4 Meals Reviewed Today!' : `${4 - reviewedCount} of 4 Meals Remaining`}
        </span>
      </div>
    </div>
  );
};
