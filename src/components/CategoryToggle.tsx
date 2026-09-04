import React from 'react';
import { CategoryMode } from '../types';
import { UtensilsCrossed, Coffee } from 'lucide-react';

interface CategoryToggleProps {
  mode: CategoryMode;
  onModeChange: (mode: CategoryMode) => void;
}

export const CategoryToggle: React.FC<CategoryToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="grid grid-cols-2 gap-2 bg-white/70 p-1.5 rounded-xl border-2 border-[#1E2B22]/20">
      <button
        id="pillMess"
        type="button"
        onClick={() => onModeChange('mess')}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-oswald font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
          mode === 'mess'
            ? 'bg-[#1E2B22] text-white border-2 border-[#1E2B22] shadow-[2px_2px_0px_0px_rgba(232,169,58,1)]'
            : 'bg-transparent text-[#20241F] hover:bg-[#EDEEE8]'
        }`}
      >
        <UtensilsCrossed className={`w-3.5 h-3.5 ${mode === 'mess' ? 'text-[#E8A93A]' : 'text-[#41573F]'}`} />
        <span>Mess Menu</span>
      </button>

      <button
        id="pillCanteen"
        type="button"
        onClick={() => onModeChange('canteen')}
        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-oswald font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer ${
          mode === 'canteen'
            ? 'bg-[#1E2B22] text-white border-2 border-[#1E2B22] shadow-[2px_2px_0px_0px_rgba(232,169,58,1)]'
            : 'bg-transparent text-[#20241F] hover:bg-[#EDEEE8]'
        }`}
      >
        <Coffee className={`w-3.5 h-3.5 ${mode === 'canteen' ? 'text-[#E8A93A]' : 'text-[#41573F]'}`} />
        <span>Canteen</span>
      </button>
    </div>
  );
};

