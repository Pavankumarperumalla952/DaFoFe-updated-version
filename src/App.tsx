import React, { useState, useEffect, useMemo } from 'react';
import { CategoryMode, DayKey, FeedbackEntry, MealType } from './types';
import {
  getCurrentMealTime,
  getTodayKey,
  INITIAL_ENTRIES,
  getDateString
} from './data/menuData';
import { Header } from './components/Header';
import { CategoryToggle } from './components/CategoryToggle';
import { DaySelector } from './components/DaySelector';
import { MealTabs } from './components/MealTabs';
import { ItemCard } from './components/ItemCard';
import { FeedbackTicket } from './components/FeedbackTicket';
import { FeedbackFeed } from './components/FeedbackFeed';
import { TrendSection } from './components/TrendSection';
import { HostelInfoModal } from './components/HostelInfoModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Info, HelpCircle } from 'lucide-react';
import {
  subscribeToFeedbacks,
  addFeedbackToFirestore,
  incrementFeedbackUpvote,
  subscribeToAuthState,
  resetRatingSystemToDay1,
  AdminAuthState
} from './firebase';

export default function App() {
  const [mode, setMode] = useState<CategoryMode>('mess');
  const [selectedDay, setSelectedDay] = useState<DayKey>(getTodayKey());
  const [selectedMeal, setSelectedMeal] = useState<MealType>(getCurrentMealTime());
  const [allEntries, setAllEntries] = useState<FeedbackEntry[]>(INITIAL_ENTRIES);

  // 24-Hour Daily Cycle State
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => getDateString(0));
  const [timeUntilDailyRefresh, setTimeUntilDailyRefresh] = useState<string>('');

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'student' | 'admin'>('student');
  const [authState, setAuthState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    loading: true
  });

  // Track Firebase Auth state & Admin privileges
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthState((state) => {
      setAuthState(state);
      if (!state.isAdmin && viewMode === 'admin') {
        setViewMode('student');
      }
    });

    return () => unsubscribeAuth();
  }, [viewMode]);

  // 24-Hour Timer & Automatic Daily Refresh
  // When a new day starts (00:00:00 midnight), the date string shifts, automatically resetting the student panel
  useEffect(() => {
    const checkAndRefresh = () => {
      const today = getDateString(0);
      if (today !== currentDateStr) {
        setCurrentDateStr(today);
        setSelectedDay(getTodayKey());
      }

      // Calculate countdown to midnight (next 24h refresh)
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilDailyRefresh(`${h}h ${m}m ${s}s`);
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 1000);
    return () => clearInterval(interval);
  }, [currentDateStr]);

  // Subscribe to real-time updates from Firestore (Cumulative master collection)
  useEffect(() => {
    const unsubscribe = subscribeToFeedbacks(
      (entries) => {
        setAllEntries(entries || []);
      },
      (err) => {
        console.warn('Realtime student feed sync notice:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter for Student View: only ratings from the active 24-hour day
  const dailyStudentEntries = useMemo(() => {
    return allEntries.filter((e) => e.date === currentDateStr);
  }, [allEntries, currentDateStr]);

  const handleQuickJumpToNow = () => {
    setMode('mess');
    setSelectedDay(getTodayKey());
    setSelectedMeal(getCurrentMealTime());
  };

  const handleOpenAdminPortal = () => {
    if (authState.isAdmin) {
      setViewMode('admin');
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleNewEntry = async (
    entryData: Omit<FeedbackEntry, 'id' | 'ts' | 'date'>
  ): Promise<boolean> => {
    const newEntry: FeedbackEntry = {
      ...entryData,
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: getDateString(0),
      ts: Date.now(),
      upvotes: 0
    };

    // Optimistically update local UI immediately
    setAllEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);

    try {
      await addFeedbackToFirestore(newEntry);
      return true;
    } catch (err) {
      console.error('Failed to save feedback to Firestore:', err);
      return true;
    }
  };

  const handleUpvote = (id: string) => {
    // Optimistic UI update
    setAllEntries((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, upvotes: (item.upvotes || 0) + 1 } : item
      )
    );
    // Firestore persistence
    incrementFeedbackUpvote(id);
  };

  const handleResetData = async () => {
    setAllEntries([]);
    setIsInfoOpen(false);
    try {
      await resetRatingSystemToDay1();
    } catch (err) {
      console.error('Failed to reset rating system:', err);
    }
  };

  // If in Admin view mode and authenticated as Admin, show Admin Dashboard
  if (viewMode === 'admin' && authState.isAdmin) {
    return (
      <AdminDashboard
        authState={authState}
        onExitToStudentView={() => setViewMode('student')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1E6] text-[#20241F] flex flex-col font-sans">
      {/* Header Bar + Hero */}
      <Header
        currentMeal={getCurrentMealTime()}
        todayKey={getTodayKey()}
        onQuickJumpToNow={handleQuickJumpToNow}
        mode={mode}
        selectedDay={selectedDay}
        selectedMeal={selectedMeal}
        isAdmin={authState.isAdmin}
        onOpenAdminPortal={handleOpenAdminPortal}
        timeUntilRefresh={timeUntilDailyRefresh}
      />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column: Category Switcher & Weekly Schedule (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-5">
            <div className="space-y-1">
              <span className="font-mono-plex text-[10px] sm:text-xs uppercase font-bold text-[#585B52] tracking-wider">
                Category
              </span>
              <CategoryToggle mode={mode} onModeChange={setMode} />
            </div>

            {mode === 'mess' && (
              <div id="messScheduleSection">
                <DaySelector
                  selectedDay={selectedDay}
                  todayKey={getTodayKey()}
                  onSelectDay={setSelectedDay}
                  allEntries={dailyStudentEntries}
                />
              </div>
            )}

            {/* Quick helper card in sidebar */}
            <div className="hidden lg:block bg-white border-2 border-[#1E2B22] p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(30,43,34,1)]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E2B22] uppercase font-oswald mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#E8A93A]" />
                <span>Mess Committee Notice</span>
              </div>
              <p className="text-xs text-[#585B52] leading-relaxed mb-3">
                Anonymous student feedback is compiled every Monday morning for menu revisions.
              </p>
              <button
                type="button"
                onClick={() => setIsInfoOpen(true)}
                className="w-full bg-[#EDEEE8] hover:bg-[#D9DBD1] border border-[#C9CDC5] text-[#1E2B22] font-mono-plex text-[11px] font-bold py-1.5 px-2 rounded cursor-pointer transition-colors"
              >
                View Meal Timings & Rules
              </button>
            </div>
          </div>

          {/* Center Column: Meal Selector, Menu Items & Feedback Ticket (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-5">
            {mode === 'mess' && (
              <div className="space-y-2">
                <span className="font-mono-plex text-[10px] sm:text-xs uppercase font-bold text-[#585B52] tracking-wider">
                  Select Meal Time
                </span>
                <MealTabs
                  selectedMeal={selectedMeal}
                  onSelectMeal={setSelectedMeal}
                />
              </div>
            )}

            {/* Menu Items Card */}
            <div className="bg-white border-2 border-[#1E2B22] p-4 sm:p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(30,43,34,1)]">
              <ItemCard
                mode={mode}
                selectedDay={selectedDay}
                selectedMeal={selectedMeal}
              />
            </div>

            {/* Review Verdict Form Ticket */}
            <FeedbackTicket
              mode={mode}
              selectedDay={selectedDay}
              selectedMeal={selectedMeal}
              onSubmit={handleNewEntry}
            />
          </div>

          {/* Right Column: Live Community Pulse & 7-Day Trend (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <FeedbackFeed
              mode={mode}
              selectedDay={selectedDay}
              selectedMeal={selectedMeal}
              entries={dailyStudentEntries}
              onUpvote={handleUpvote}
            />

            <TrendSection
              entries={allEntries}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#1E2B22]/10 bg-[#EDEEE8]/60 py-6 px-4 text-center mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-plex text-[#585B52]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1E2B22]">DaFoFe</span>
            <span>•</span>
            <span>Daily Food Feedback</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              className="inline-flex items-center gap-1.5 text-[#1E2B22] hover:text-[#B87F1E] font-bold underline underline-offset-2 cursor-pointer transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Mess Timings & Guidelines</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Hostel Timings & Rules Modal */}
      <HostelInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        onResetData={handleResetData}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => {
          setViewMode('admin');
        }}
      />
    </div>
  );
}


