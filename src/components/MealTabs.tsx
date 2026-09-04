import React from 'react';
import { MealType } from '../types';
import { MEAL_META, MEAL_ORDER } from '../data/menuData';

interface MealTabsProps {
  selectedMeal: MealType;
  onSelectMeal: (meal: MealType) => void;
}

export const MealTabs: React.FC<MealTabsProps> = ({ selectedMeal, onSelectMeal }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {MEAL_ORDER.map((mealKey) => {
        const meta = MEAL_META[mealKey];
        const isActive = mealKey === selectedMeal;

        return (
          <button
            key={mealKey}
            type="button"
            onClick={() => onSelectMeal(mealKey)}
            title={`${meta.label} (${meta.time})`}
            className={`py-2.5 px-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              isActive
                ? 'bg-[#1E2B22] border-[#1E2B22] text-white shadow-[3px_3px_0px_0px_rgba(232,169,58,1)]'
                : 'bg-white border-[#1E2B22]/30 text-[#1E2B22] hover:border-[#1E2B22] hover:bg-[#EDEEE8]'
            }`}
          >
            <span className="font-oswald font-bold text-xs sm:text-sm uppercase tracking-wide">
              {meta.label}
            </span>
            <span
              className={`font-mono-plex text-[10px] truncate max-w-full ${
                isActive ? 'text-[#E8A93A] font-semibold' : 'text-[#585B52]'
              }`}
            >
              {meta.time}
            </span>
          </button>
        );
      })}
    </div>
  );
};


