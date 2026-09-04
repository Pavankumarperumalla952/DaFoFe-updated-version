import React, { useState } from 'react';
import { Star, Check, AlertCircle, Send, ShieldCheck } from 'lucide-react';
import { CategoryMode, DayKey, FeedbackEntry, MealType } from '../types';
import { MEAL_META, MENU, REASONS } from '../data/menuData';

interface FeedbackTicketProps {
  mode: CategoryMode;
  selectedDay: DayKey;
  selectedMeal: MealType;
  onSubmit: (entry: Omit<FeedbackEntry, 'id' | 'ts' | 'date'>) => Promise<boolean>;
}

export const FeedbackTicket: React.FC<FeedbackTicketProps> = ({
  mode,
  selectedDay,
  selectedMeal,
  onSubmit
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDone, setShowDone] = useState<boolean>(false);

  const ticketLabel =
    mode === 'mess'
      ? `${MENU[selectedDay].label} ${MEAL_META[selectedMeal].label}`
      : 'Canteen';

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
    setErrorMessage(null);
    if (starValue > 3) {
      setSelectedReasons(new Set());
    }
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) {
        next.delete(reason);
      } else {
        next.add(reason);
      }
      return next;
    });
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setErrorMessage('Please tap a rating star before submitting.');
      return;
    }

    if (rating <= 3 && selectedReasons.size === 0) {
      setErrorMessage('Please pick at least one issue reason for the low rating.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const success = await onSubmit({
        category: mode,
        day: mode === 'mess' ? selectedDay : null,
        meal: mode === 'mess' ? selectedMeal : null,
        rating,
        reasons: Array.from(selectedReasons),
        comment: comment.trim()
      });

      if (success) {
        setRating(0);
        setHoverRating(0);
        setSelectedReasons(new Set());
        setComment('');
        setShowDone(true);
        setTimeout(() => {
          setShowDone(false);
        }, 4000);
      } else {
        setErrorMessage('Could not submit — please try again.');
      }
    } catch {
      setErrorMessage('Could not submit — please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showReasonBlock = rating > 0 && rating <= 3;

  return (
    <div className="bg-white border-2 border-[#1E2B22] p-5 sm:p-7 rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,43,34,1)] sm:shadow-[8px_8px_0px_0px_rgba(30,43,34,1)] relative transition-all">
      <div className="flex items-center justify-between gap-2 pb-3 mb-5 border-b-2 border-[#1E2B22]/10">
        <div>
          <span className="font-mono-plex text-[10px] uppercase font-bold tracking-widest text-[#585B52] block">
            Drop Your Verdict
          </span>
          <span className="font-oswald font-bold text-base sm:text-lg uppercase text-[#1E2B22]">
            Reviewing: {ticketLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono-plex text-[10px] text-[#3B5E38] bg-[#E3EEDE] border border-[#5C8A56]/30 px-2.5 py-1 rounded-full font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5C8A56]" />
          <span>Anonymous Token</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono-plex text-xs uppercase font-bold tracking-wider text-[#20241F]">
              Overall Score (1-5)
            </label>
            {rating > 0 && (
              <span className="font-mono-plex text-xs font-bold text-[#1E2B22] bg-[#E8A93A]/30 border border-[#E8A93A] px-2.5 py-0.5 rounded">
                {rating === 5
                  ? '5/5 — Excellent'
                  : rating === 4
                  ? '4/5 — Good'
                  : rating === 3
                  ? '3/5 — Average'
                  : rating === 2
                  ? '2/5 — Poor'
                  : '1/5 — Very Bad'}
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-2 sm:gap-2.5"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((starVal) => {
              const isLit = (hoverRating || rating) >= starVal;
              return (
                <button
                  key={starVal}
                  type="button"
                  onClick={() => handleStarClick(starVal)}
                  onMouseEnter={() => setHoverRating(starVal)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                    isLit
                      ? 'bg-[#E8A93A] border-[#1E2B22] text-[#1E2B22] shadow-[2px_2px_0px_0px_rgba(30,43,34,1)] scale-105'
                      : 'bg-[#EDEEE8] border-[#C9CDC5] text-[#C9CDC5] hover:border-[#1E2B22]'
                  }`}
                  aria-label={`Rate ${starVal} stars`}
                >
                  <Star
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      isLit ? 'fill-current' : 'fill-transparent'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason Block for Low Ratings */}
        {showReasonBlock && (
          <div className="pt-2 pb-1">
            <label className="block font-mono-plex text-xs uppercase tracking-widest text-[#B5484D] mb-2 font-bold">
              What went wrong? (Select flags)
            </label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((reason) => {
                const isSelected = selectedReasons.has(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => toggleReason(reason)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#B5484D] border-[#7E2F32] text-white shadow-[2px_2px_0px_0px_rgba(126,47,50,1)]'
                        : 'bg-[#EDEEE8] border-[#C9CDC5] text-[#20241F] hover:border-[#1E2B22]'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comment field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="feedback-comment"
              className="font-mono-plex text-xs uppercase font-bold tracking-wider text-[#585B52]"
            >
              Remarks & Details (Optional)
            </label>
            <span className="font-mono-plex text-[11px] text-[#585B52]">
              {comment.length}/300
            </span>
          </div>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 300))}
            placeholder="Sambar was a bit cold but the rice quality is elite today..."
            rows={3}
            className="w-full bg-[#EDEEE8] border-2 border-[#C9CDC5] p-3.5 rounded-xl focus:border-[#1E2B22] focus:bg-white outline-none text-sm text-[#20241F] placeholder:text-[#585B52]/50 transition-all resize-none font-sans"
          />
        </div>

        {/* Error prompt */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-xs font-mono-plex font-bold text-[#7E2F32] bg-[#F6E1E1] p-3 rounded-xl border-2 border-[#B5484D]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1E2B22] hover:bg-[#2B3A2E] text-white py-4 px-4 rounded-xl border-2 border-[#1E2B22] shadow-[4px_4px_0px_0px_rgba(232,169,58,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(232,169,58,1)] font-oswald font-bold text-sm sm:text-base uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 text-[#E8A93A]" />
          <span>{isSubmitting ? 'Submitting…' : 'Submit Anonymously'}</span>
        </button>

        {/* Done confirmation message */}
        {showDone && (
          <div className="flex items-center gap-2.5 bg-[#EEF4EC] border-2 border-[#5C8A56] text-[#3B5E38] text-xs sm:text-sm p-3.5 rounded-xl font-mono-plex font-bold">
            <Check className="w-4 h-4 text-[#5C8A56] flex-shrink-0" />
            <span>Verdict logged! Anonymous feedback posted to Community Pulse.</span>
          </div>
        )}
      </form>
    </div>
  );
};

