import React from 'react';
import { MealType, UserMealReview } from '../types';
import { MEAL_META, MEAL_ORDER, getMealFullTitle } from '../data/menuData';
import { Check } from 'lucide-react';

interface MealTabsProps {
  selectedMeal: MealType;
  onSelectMeal: (meal: MealType) => void;
  reviewedMeals?: Partial<Record<MealType, UserMealReview>>;
}

export const MealTabs: React.FC<MealTabsProps> = ({
  selectedMeal,
  onSelectMeal,
  reviewedMeals = {}
}) => {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MEAL_ORDER.map((mealKey) => {
          const meta = MEAL_META[mealKey];
          const fullTitle = getMealFullTitle(mealKey);
          const isActive = mealKey === selectedMeal;
          const userReview = reviewedMeals[mealKey];
          const isReviewed = Boolean(userReview);

          return (
            <button
              key={mealKey}
              type="button"
              onClick={() => onSelectMeal(mealKey)}
              title={`${fullTitle} (${meta.time}) - ${isReviewed ? 'Already reviewed' : 'Pending review'}`}
              className={`p-2.5 sm:p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[72px] sm:min-h-[78px] ${
                isActive
                  ? 'bg-[#1E2B22] border-[#1E2B22] text-white shadow-[3px_3px_0px_0px_rgba(232,169,58,1)]'
                  : 'bg-white border-[#1E2B22]/30 text-[#1E2B22] hover:border-[#1E2B22] hover:bg-[#EDEEE8]'
              }`}
            >
              <div className="w-full flex items-center justify-between gap-1 mb-1">
                <span className="font-oswald font-bold text-xs sm:text-sm uppercase tracking-wide truncate">
                  {fullTitle}
                </span>
                {isReviewed && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono-plex font-bold bg-[#E3EEDE] text-[#3B5E38] border border-[#5C8A56]/40 shrink-0"
                    title={`Reviewed: ${userReview?.rating}/5 stars`}
                  >
                    <Check className="w-2.5 h-2.5" />
                    <span>Done</span>
                  </span>
                )}
              </div>

              <div className="w-full flex items-center justify-between text-[10px] font-mono-plex">
                <span
                  className={`truncate ${
                    isActive ? 'text-[#E8A93A] font-semibold' : 'text-[#585B52]'
                  }`}
                >
                  {meta.time.split('-')[0].trim()}
                </span>

                <span
                  className={`text-[9px] font-bold uppercase ${
                    isReviewed
                      ? isActive
                        ? 'text-[#A3E09B]'
                        : 'text-[#3B5E38]'
                      : isActive
                      ? 'text-[#C9CDC5]'
                      : 'text-[#878A81]'
                  }`}
                >
                  {isReviewed ? '1/1 Done' : '1 Review'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};



