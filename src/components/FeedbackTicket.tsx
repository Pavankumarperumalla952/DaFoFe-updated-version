import React, { useState } from 'react';
import { Star, Check, AlertCircle, Send, ShieldCheck, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { CategoryMode, DayKey, FeedbackEntry, MealType, UserMealReview } from '../types';
import { MEAL_META, MENU, REASONS, getMealFullTitle } from '../data/menuData';

interface FeedbackTicketProps {
  mode: CategoryMode;
  selectedDay: DayKey;
  todayKey?: DayKey;
  selectedMeal: MealType;
  onSubmit: (entry: Omit<FeedbackEntry, 'id' | 'ts' | 'date'>) => Promise<boolean>;
  existingReview?: UserMealReview | null;
  onSelectMeal?: (meal: MealType) => void;
  onSelectDay?: (day: DayKey) => void;
  nextPendingMeal?: MealType | null;
}

export const FeedbackTicket: React.FC<FeedbackTicketProps> = ({
  mode,
  selectedDay,
  todayKey,
  selectedMeal,
  onSubmit,
  existingReview = null,
  onSelectMeal,
  onSelectDay,
  nextPendingMeal = null
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDone, setShowDone] = useState<boolean>(false);

  const isViewingDifferentDay = mode === 'mess' && todayKey && selectedDay !== todayKey;
  const effectiveDay = todayKey || selectedDay;
  const mealFullTitle = getMealFullTitle(selectedMeal);
  const ticketLabel =
    mode === 'mess'
      ? `${MENU[effectiveDay].label} — ${mealFullTitle}`
      : 'Canteen';

  const handleStarClick = (starValue: number) => {
    if (existingReview) return;
    setRating(starValue);
    setErrorMessage(null);
  };

  const toggleReason = (reason: string) => {
    if (existingReview) return;
    setSelectedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) {
        next.delete(reason);
      } else {
        // When selecting sentiment options (Good, Average, Bad), cleanly toggle off contradictory sentiments
        if (reason === 'Good') {
          next.delete('Average');
          next.delete('Bad');
        } else if (reason === 'Average') {
          next.delete('Good');
          next.delete('Bad');
        } else if (reason === 'Bad') {
          next.delete('Good');
          next.delete('Average');
        }
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

    if (existingReview && mode === 'mess') {
      setErrorMessage(`You have already submitted a review for ${mealFullTitle} today. Each meal can only be reviewed once per person.`);
      return;
    }

    if (rating === 0) {
      setErrorMessage('Please tap a rating star before submitting.');
      return;
    }

    if (rating <= 3 && selectedReasons.size === 0) {
      setErrorMessage('Please select a flag (such as Bad, Average, or a specific issue).');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const success = await onSubmit({
        category: mode,
        day: mode === 'mess' ? effectiveDay : null,
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

  const showReasonBlock = rating > 0;

  // If this meal has already been reviewed by this person today, show the locked summary
  if (mode === 'mess' && existingReview) {
    return (
      <div className="bg-white border-2 border-[#1E2B22] p-5 sm:p-7 rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,43,34,1)] sm:shadow-[8px_8px_0px_0px_rgba(30,43,34,1)] relative transition-all">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-5 border-b-2 border-[#1E2B22]/10">
          <div>
            <span className="font-mono-plex text-[10px] uppercase font-bold tracking-widest text-[#3B5E38] block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5C8A56]" />
              <span>Review Recorded for Today</span>
            </span>
            <span className="font-oswald font-bold text-base sm:text-lg uppercase text-[#1E2B22]">
              {mealFullTitle}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono-plex text-[10px] text-[#3B5E38] bg-[#E3EEDE] border border-[#5C8A56]/40 px-2.5 py-1 rounded-full font-bold">
            <Lock className="w-3 h-3 text-[#5C8A56]" />
            <span>Reviewed (1/1)</span>
          </div>
        </div>

        {/* Submitted Card Content */}
        <div className="bg-[#FAF9F5] border-2 border-[#1E2B22]/15 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono-plex text-xs uppercase font-bold text-[#585B52]">
              Your Rating
            </span>
            <span className="font-mono-plex text-xs font-bold text-[#1E2B22] bg-[#E8A93A]/30 border border-[#E8A93A] px-2.5 py-0.5 rounded">
              {existingReview.rating === 5
                ? '5/5 — Excellent'
                : existingReview.rating === 4
                ? '4/5 — Good'
                : existingReview.rating === 3
                ? '3/5 — Average'
                : existingReview.rating === 2
                ? '2/5 — Poor'
                : '1/5 — Very Bad'}
            </span>
          </div>

          {/* Star Display */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center ${
                  s <= existingReview.rating
                    ? 'bg-[#E8A93A] border-[#1E2B22] text-[#1E2B22]'
                    : 'bg-[#EDEEE8] border-[#C9CDC5] text-[#C9CDC5]'
                }`}
              >
                <Star
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    s <= existingReview.rating ? 'fill-current' : 'fill-transparent'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Reasons if any */}
          {existingReview.reasons && existingReview.reasons.length > 0 && (
            <div>
              <span className="font-mono-plex text-[10px] uppercase font-bold text-[#585B52] block mb-1.5">
                Flags Selected:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {existingReview.reasons.map((reason) => {
                  let badgeStyle = 'bg-[#F6E1E1] border-[#B5484D] text-[#7E2F32]';
                  if (reason === 'Good') {
                    badgeStyle = 'bg-[#E3EEDE] border-[#5C8A56] text-[#3B5E38]';
                  } else if (reason === 'Average') {
                    badgeStyle = 'bg-[#FEF3D6] border-[#E8A93A] text-[#B87F1E]';
                  }
                  return (
                    <span
                      key={reason}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${badgeStyle}`}
                    >
                      {reason}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comment if any */}
          {existingReview.comment && (
            <div className="bg-white border border-[#C9CDC5] p-3 rounded-lg text-xs text-[#20241F] italic leading-relaxed">
              &ldquo;{existingReview.comment}&rdquo;
            </div>
          )}

          <div className="text-[11px] font-mono-plex text-[#585B52] border-t border-[#1E2B22]/10 pt-2 flex items-center justify-between">
            <span>
              Submitted at {new Date(existingReview.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[#3B5E38] font-bold">1/1 Review Completed</span>
          </div>
        </div>

        {/* 1-Review Policy Notice */}
        <div className="mt-4 p-3.5 bg-[#EDEEE8] border border-[#C9CDC5] rounded-xl text-xs text-[#585B52]">
          <div className="flex items-center gap-1.5 font-bold text-[#1E2B22] mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#5C8A56]" />
            <span>Single Review Policy</span>
          </div>
          <p className="leading-relaxed">
            Each person&apos;s <strong>Morning Tiffin</strong>, <strong>Afternoon Lunch</strong>, <strong>Evening Snacks</strong>, and <strong>Night Dinner</strong> should be reviewed only once. You have already reviewed this meal today.
          </p>
        </div>

        {/* Action to switch to next unreviewed meal */}
        {nextPendingMeal && onSelectMeal ? (
          <button
            type="button"
            onClick={() => onSelectMeal(nextPendingMeal)}
            className="mt-4 w-full bg-[#1E2B22] hover:bg-[#2B3A2E] text-white py-3 px-4 rounded-xl border-2 border-[#1E2B22] shadow-[3px_3px_0px_0px_rgba(232,169,58,1)] active:translate-x-[1px] active:translate-y-[1px] font-oswald font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Rate Next Meal: {getMealFullTitle(nextPendingMeal)}</span>
            <ArrowRight className="w-4 h-4 text-[#E8A93A]" />
          </button>
        ) : (
          <div className="mt-4 p-4 bg-[#EEF4EC] border-2 border-[#5C8A56] rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-bold font-oswald text-sm sm:text-base text-[#3B5E38] uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-[#5C8A56]" />
              <span>All 4 Meals Reviewed Today!</span>
            </div>
            <p className="text-xs text-[#41573F] font-mono-plex leading-relaxed">
              You have completed your daily reviews for Morning Tiffin, Afternoon Lunch, Evening Snacks, and Night Dinner.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#1E2B22] p-5 sm:p-7 rounded-2xl shadow-[6px_6px_0px_0px_rgba(30,43,34,1)] sm:shadow-[8px_8px_0px_0px_rgba(30,43,34,1)] relative transition-all">
      <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b-2 border-[#1E2B22]/10">
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

      {/* Schedule Preview Warning if browsing a different day's menu in schedule */}
      {isViewingDifferentDay && todayKey && onSelectDay && (
        <div className="mb-4 bg-[#FEF3D6] border-2 border-[#E8A93A] p-3 rounded-xl flex items-center justify-between gap-2 text-xs font-mono-plex text-[#B87F1E]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#1E2B22]">Schedule Preview:</span>
            <span>You are viewing {MENU[selectedDay].label}&apos;s menu. Reviews are recorded for Today ({MENU[todayKey].label}).</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectDay(todayKey)}
            className="shrink-0 bg-[#1E2B22] text-white hover:bg-[#2B3A2E] text-[10px] font-bold py-1 px-2.5 rounded cursor-pointer transition-colors"
          >
            Back to Today
          </button>
        </div>
      )}

      {/* Policy banner for mess meals */}
      {mode === 'mess' && (
        <div className="mb-4 bg-[#F8F9F5] border border-[#C9CDC5] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs font-mono-plex text-[#585B52]">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#E8A93A]"></span>
            <span className="font-bold text-[#1E2B22]">
              Strict 1-Review Policy:
            </span>
            <span className="text-[#3B5E38] font-bold">
              {mealFullTitle}
            </span>
          </div>
          <span className="text-[10px] text-[#585B52]">
            Reviewed only once per person
          </span>
        </div>
      )}

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

        {/* Reason Block with Good, Average, Bad, and issue flags */}
        {showReasonBlock && (
          <div className="pt-2 pb-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block font-mono-plex text-xs uppercase tracking-widest text-[#1E2B22] font-bold">
                What went wrong? (Select a flag)
              </label>
              {selectedReasons.size > 0 && (
                <span className="font-mono-plex text-[10px] text-[#585B52] font-semibold">
                  {selectedReasons.size} flag{selectedReasons.size > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((reason) => {
                const isSelected = selectedReasons.has(reason);
                const isGood = reason === 'Good';
                const isAverage = reason === 'Average';

                let activeClass =
                  'bg-[#B5484D] border-[#7E2F32] text-white shadow-[2px_2px_0px_0px_rgba(126,47,50,1)]';
                if (isGood) {
                  activeClass =
                    'bg-[#5C8A56] border-[#3B5E38] text-white shadow-[2px_2px_0px_0px_rgba(59,94,56,1)]';
                } else if (isAverage) {
                  activeClass =
                    'bg-[#E8A93A] border-[#B87F1E] text-[#1E2B22] shadow-[2px_2px_0px_0px_rgba(184,127,30,1)]';
                }

                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => toggleReason(reason)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all cursor-pointer ${
                      isSelected
                        ? activeClass
                        : isGood
                        ? 'bg-[#EDEEE8] border-[#C9CDC5] text-[#20241F] hover:border-[#5C8A56] hover:bg-[#EEF4EC]'
                        : isAverage
                        ? 'bg-[#EDEEE8] border-[#C9CDC5] text-[#20241F] hover:border-[#E8A93A] hover:bg-[#FEF8EB]'
                        : 'bg-[#EDEEE8] border-[#C9CDC5] text-[#20241F] hover:border-[#B5484D] hover:bg-[#F6E1E1]'
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
          <span>{isSubmitting ? 'Submitting…' : `Submit ${mealFullTitle} Review (1 Time Only)`}</span>
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


