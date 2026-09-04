import React, { useState } from 'react';
import { Sparkles, Clock, Utensils, Coffee } from 'lucide-react';
import { CategoryMode, DayKey, MealType } from '../types';
import { CANTEEN_CATEGORIES, CANTEEN_ITEMS, MEAL_META, MENU } from '../data/menuData';

interface ItemCardProps {
  mode: CategoryMode;
  selectedDay: DayKey;
  selectedMeal: MealType;
}

export const ItemCard: React.FC<ItemCardProps> = ({ mode, selectedDay, selectedMeal }) => {
  const isMess = mode === 'mess';
  const [canteenFilter, setCanteenFilter] = useState<'all' | 'tiffin' | 'meals'>('all');

  const label = isMess
    ? `${MENU[selectedDay].label} ${MEAL_META[selectedMeal].label}`
    : 'Canteen Menu';
  const items = isMess ? MENU[selectedDay][selectedMeal] : CANTEEN_ITEMS;
  const timing = isMess ? MEAL_META[selectedMeal].time : 'Open 12:00 PM - 01:10 PM';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono-plex text-xs uppercase tracking-widest text-[#585B52] font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E8A93A]" />
          <span>Menu Schedule: {label}</span>
        </span>
        <span className="font-mono-plex text-[11px] text-[#585B52] bg-white border border-[#C9CDC5] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3 text-[#41573F]" />
          {timing}
        </span>
      </div>

      {isMess ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span
              key={idx}
              className="px-3.5 py-1.5 bg-[#EDEEE8] border border-[#C9CDC5] hover:border-[#1E2B22] rounded-full text-xs font-semibold text-[#20241F] transition-colors"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Canteen category toggle chips */}
          <div className="flex items-center gap-1.5 border-b border-[#C9CDC5]/60 pb-2">
            <button
              type="button"
              onClick={() => setCanteenFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-mono-plex text-[11px] font-bold transition-all cursor-pointer ${
                canteenFilter === 'all'
                  ? 'bg-[#1E2B22] text-white shadow-xs'
                  : 'bg-[#EDEEE8] text-[#585B52] hover:text-[#1E2B22]'
              }`}
            >
              All Items ({CANTEEN_ITEMS.length})
            </button>
            <button
              type="button"
              onClick={() => setCanteenFilter('tiffin')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono-plex text-[11px] font-bold transition-all cursor-pointer ${
                canteenFilter === 'tiffin'
                  ? 'bg-[#1E2B22] text-white shadow-xs'
                  : 'bg-[#EDEEE8] text-[#585B52] hover:text-[#1E2B22]'
              }`}
            >
              <Coffee className="w-3 h-3 text-[#E8A93A]" />
              <span>Tiffin</span>
            </button>
            <button
              type="button"
              onClick={() => setCanteenFilter('meals')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono-plex text-[11px] font-bold transition-all cursor-pointer ${
                canteenFilter === 'meals'
                  ? 'bg-[#1E2B22] text-white shadow-xs'
                  : 'bg-[#EDEEE8] text-[#585B52] hover:text-[#1E2B22]'
              }`}
            >
              <Utensils className="w-3 h-3 text-[#E8A93A]" />
              <span>Meals & Specials</span>
            </button>
          </div>

          {/* Categorized List */}
          {CANTEEN_CATEGORIES.filter(
            (cat) => canteenFilter === 'all' || cat.id === canteenFilter
          ).map((category) => (
            <div key={category.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-oswald font-bold text-xs uppercase tracking-wider text-[#1E2B22] bg-[#E8A93A]/20 border border-[#E8A93A]/60 px-2 py-0.5 rounded">
                  {category.name}
                </span>
                <div className="flex-1 h-px bg-[#1E2B22]/10" />
              </div>
              <div className="flex flex-wrap gap-2">
                {category.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#EDEEE8] border border-[#C9CDC5] hover:border-[#1E2B22] rounded-full text-xs font-semibold text-[#20241F] transition-colors"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


