import React from 'react';
import { X, Clock, RefreshCw, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { MEAL_META, MENU, DAY_ORDER, MEAL_ORDER } from '../data/menuData';

interface HostelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const HostelInfoModal: React.FC<HostelInfoModalProps> = ({
  isOpen,
  onClose,
  onResetData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B22]/80 backdrop-blur-xs">
      <div className="bg-[#F4F1E6] border-2 border-[#1E2B22] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(30,43,34,1)] p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#1E2B22]/10">
          <div>
            <p className="font-mono-plex text-xs text-[#B87F1E] font-bold tracking-widest uppercase">
              Hostel Food Committee
            </p>
            <h2 className="font-oswald font-bold text-xl sm:text-2xl uppercase text-[#1E2B22]">
              Mess Rules & Meal Timings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#EDEEE8] hover:bg-[#D9DBD1] border-2 border-[#1E2B22] text-[#20241F] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timings Table */}
        <div className="space-y-2">
          <p className="font-mono-plex text-xs uppercase tracking-wider text-[#585B52] font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#41573F]" />
            <span>Official Dining Timings</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MEAL_ORDER.map((meal) => (
              <div key={meal} className="bg-white border-2 border-[#1E2B22]/20 p-2.5 rounded-xl text-center shadow-xs">
                <p className="font-oswald font-bold text-sm uppercase text-[#1E2B22]">
                  {MEAL_META[meal].label}
                </p>
                <p className="font-mono-plex text-[11px] text-[#585B52] mt-0.5 font-medium">
                  {MEAL_META[meal].time}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-[#EDEEE8] border-2 border-[#1E2B22]/20 p-2.5 rounded-xl flex items-center justify-between px-4">
            <span className="font-oswald font-bold text-xs uppercase text-[#1E2B22]">
              Canteen Operational Hours:
            </span>
            <span className="font-mono-plex text-xs font-bold text-[#E8A93A] bg-[#1E2B22] px-2.5 py-0.5 rounded">
              12:00 PM - 01:10 PM
            </span>
          </div>
        </div>

        {/* Anonymous Feedback Policy */}
        <div className="bg-[#1E2B22] text-[#EDEEE8] border-2 border-[#1E2B22] rounded-xl p-4 sm:p-5 space-y-1.5 shadow-[4px_4px_0px_0px_rgba(232,169,58,1)]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#E8A93A]" />
            <p className="font-oswald font-bold text-sm text-[#E8A93A] uppercase tracking-wider">
              Student Anonymity Guarantee
            </p>
          </div>
          <p className="text-xs text-[#C9CDC5] leading-relaxed">
            All reviews submitted through this applet are completely unlinked from student roll numbers or identity credentials. Aggregated statistics are directly reviewed by the Mess Committee and Chief Warden every Monday for catering audits.
          </p>
        </div>

        {/* Full Weekly Menu Overview */}
        <div className="space-y-2">
          <p className="font-mono-plex text-xs uppercase tracking-wider text-[#585B52] font-bold flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#41573F]" />
            <span>Weekly Mess & Canteen Breakdown</span>
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div className="bg-[#EDEEE8] border border-[#1E2B22]/30 p-2.5 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="font-oswald font-bold uppercase text-[#1E2B22] text-[13px]">
                  Canteen Menu:
                </span>
                <span className="font-mono-plex text-[10px] text-[#585B52]">
                  (12:00 PM – 01:10 PM)
                </span>
              </div>
              <p className="text-[#20241F]">
                <b className="text-[#1E2B22]">Tiffin:</b> Puri, Idly, Mysore Bonda, Onion Dosa, Masala Dosa, Normal Chutney, Bombay Chutney
              </p>
              <p className="text-[#20241F]">
                <b className="text-[#1E2B22]">Meals & Specials:</b> Half Meals / Full Meals, Veg Biryani, Chicken Biryani, Chapathi, Parota, Chicken Curry, Fish Fry, Fried Rice, Omlette, Tea, Coffee
              </p>
            </div>

            {DAY_ORDER.map((dayKey) => {
              const day = MENU[dayKey];
              return (
                <div key={dayKey} className="bg-white border border-[#C9CDC5] p-2.5 rounded-xl text-xs">
                  <span className="font-oswald font-bold uppercase text-[#1E2B22] mr-2">
                    {day.label}:
                  </span>
                  <span className="text-[#585B52]">
                    <b className="text-[#20241F]">Lunch:</b> {day.lunch.join(', ')} | <b className="text-[#20241F]">Dinner:</b> {day.dinner.join(', ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t-2 border-[#1E2B22]/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetData}
            className="inline-flex items-center gap-1.5 font-mono-plex text-xs font-bold text-[#7E2F32] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Feedback Data</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1E2B22] hover:bg-[#2B3A2E] text-[#F4F1E6] font-oswald font-bold text-xs uppercase tracking-widest rounded-lg border-2 border-[#1E2B22] shadow-[2px_2px_0px_0px_rgba(232,169,58,1)] cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

