import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  LogOut,
  ArrowLeft,
  Filter,
  Search,
  Calendar,
  Clock,
  Star,
  Download,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  Utensils,
  Coffee,
  Sun,
  Cookie,
  Moon,
  Users,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { FeedbackEntry, DayKey, MealType, CategoryMode } from '../types';
import { MEAL_META, MENU, getSystemDayNumber } from '../data/menuData';
import {
  subscribeToFeedbacks,
  deleteFeedbackFromFirestore,
  signOutAdmin,
  resetRatingSystemToDay1,
  AdminAuthState
} from '../firebase';
import { AdminTeamModal } from './AdminTeamModal';

interface AdminDashboardProps {
  authState: AdminAuthState;
  onExitToStudentView: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  authState,
  onExitToStudentView
}) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdminTeamOpen, setIsAdminTeamOpen] = useState(false);
  const [isResetCycleModalOpen, setIsResetCycleModalOpen] = useState(false);
  const [isResettingCycle, setIsResettingCycle] = useState(false);
  const [resetFeedbackMsg, setResetFeedbackMsg] = useState<string | null>(null);

  // Day Number
  const systemDay = getSystemDayNumber();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryMode>('all');
  const [dayFilter, setDayFilter] = useState<'all' | DayKey>('all');
  const [mealFilter, setMealFilter] = useState<'all' | MealType>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | number | 'critical'>('all');
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'last7', 'last30', or 'YYYY-MM-DD'
  const [customDate, setCustomDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'upvotes'>('newest');

  // Realtime Firestore Subscription for Admin
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToFeedbacks(
      (entries) => {
        setFeedbacks(entries);
        setLoading(false);
      },
      (err) => {
        console.error('Admin feedback sync error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOutAdmin();
    onExitToStudentView();
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteFeedbackFromFirestore(id);
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      alert('Could not delete document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and Search Logic
  const filteredFeedbacks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTs = Date.now();
    const sevenDaysAgo = nowTs - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = nowTs - 30 * 24 * 60 * 60 * 1000;

    return feedbacks.filter((entry) => {
      // Category filter
      if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
        return false;
      }

      // Day filter
      if (dayFilter !== 'all' && entry.day !== dayFilter) {
        return false;
      }

      // Meal filter
      if (mealFilter !== 'all' && entry.meal !== mealFilter) {
        return false;
      }

      // Rating filter
      if (ratingFilter === 'critical') {
        if (entry.rating > 2) return false;
      } else if (ratingFilter !== 'all') {
        if (entry.rating !== ratingFilter) return false;
      }

      // Date filter
      if (dateFilter === 'today') {
        if (entry.date !== todayStr) return false;
      } else if (dateFilter === 'last7') {
        if (entry.ts < sevenDaysAgo) return false;
      } else if (dateFilter === 'last30') {
        if (entry.ts < thirtyDaysAgo) return false;
      } else if (dateFilter === 'custom' && customDate) {
        if (entry.date !== customDate) return false;
      }

      // Search Query filter (matches comment, reasons, meal label, category)
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const commentMatch = entry.comment.toLowerCase().includes(queryLower);
        const reasonsMatch = entry.reasons.some((r) => r.toLowerCase().includes(queryLower));
        const dayMatch = entry.day ? entry.day.toLowerCase().includes(queryLower) : false;
        const mealMatch = entry.meal ? entry.meal.toLowerCase().includes(queryLower) : false;
        const categoryMatch = entry.category.toLowerCase().includes(queryLower);

        if (!commentMatch && !reasonsMatch && !dayMatch && !mealMatch && !categoryMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    feedbacks,
    categoryFilter,
    dayFilter,
    mealFilter,
    ratingFilter,
    dateFilter,
    customDate,
    searchQuery
  ]);

  // Sort logic
  const sortedFeedbacks = useMemo(() => {
    return [...filteredFeedbacks].sort((a, b) => {
      if (sortBy === 'newest') return b.ts - a.ts;
      if (sortBy === 'oldest') return a.ts - b.ts;
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'upvotes') return (b.upvotes || 0) - (a.upvotes || 0);
      return 0;
    });
  }, [filteredFeedbacks, sortBy]);

  // High-Level Statistics and Analytics Calculations
  const stats = useMemo(() => {
    const total = filteredFeedbacks.length;
    if (total === 0) {
      return {
        total: 0,
        avgRating: '0.0',
        positiveCount: 0,
        criticalCount: 0,
        messCount: 0,
        canteenCount: 0,
        totalUpvotes: 0,
        topReasons: [] as { reason: string; count: number }[]
      };
    }

    const sumRating = filteredFeedbacks.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = (sumRating / total).toFixed(1);
    const positiveCount = filteredFeedbacks.filter((f) => f.rating >= 4).length;
    const criticalCount = filteredFeedbacks.filter((f) => f.rating <= 2).length;
    const messCount = filteredFeedbacks.filter((f) => f.category === 'mess').length;
    const canteenCount = filteredFeedbacks.filter((f) => f.category === 'canteen').length;
    const totalUpvotes = filteredFeedbacks.reduce((acc, curr) => acc + (curr.upvotes || 0), 0);

    // Count top reasons
    const reasonCounts: Record<string, number> = {};
    filteredFeedbacks.forEach((f) => {
      f.reasons.forEach((r) => {
        reasonCounts[r] = (reasonCounts[r] || 0) + 1;
      });
    });

    const topReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      avgRating: avg,
      positiveCount,
      criticalCount,
      messCount,
      canteenCount,
      totalUpvotes,
      topReasons
    };
  }, [filteredFeedbacks]);

  // Today's specific metrics for comparison with master archive
  const todayDateKey = new Date().toISOString().split('T')[0];
  const todayEntries = useMemo(() => feedbacks.filter((f) => f.date === todayDateKey), [feedbacks, todayDateKey]);
  const todayAvgScore = useMemo(() => {
    if (!todayEntries.length) return '—';
    return (todayEntries.reduce((acc, f) => acc + f.rating, 0) / todayEntries.length).toFixed(1);
  }, [todayEntries]);

  // Reset rating system to Day 1
  const handleResetSystemToDay1 = async () => {
    setIsResettingCycle(true);
    try {
      const res = await resetRatingSystemToDay1();
      if (res.success) {
        setFeedbacks([]);
        setResetFeedbackMsg('Rating system successfully reset to Day 1! All past feedback documents have been cleared.');
        setTimeout(() => setResetFeedbackMsg(null), 6000);
      } else {
        alert('Reset failed: ' + res.message);
      }
    } catch (err: any) {
      console.error('Reset error:', err);
      alert('Error during reset: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsResettingCycle(false);
      setIsResetCycleModalOpen(false);
    }
  };

  // CSV Export for Management
  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Timestamp', 'Category', 'Day', 'Meal', 'Rating', 'Upvotes', 'Reasons', 'Comment'];
    const rows = sortedFeedbacks.map((f) => [
      f.id,
      f.date,
      new Date(f.ts).toLocaleString(),
      f.category,
      f.day || 'N/A',
      f.meal || 'N/A',
      f.rating,
      f.upvotes || 0,
      `"${f.reasons.join(', ')}"`,
      `"${(f.comment || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DaFoFe_Hostel_Feedback_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDayFilter('all');
    setMealFilter('all');
    setRatingFilter('all');
    setDateFilter('all');
    setCustomDate('');
    setSortBy('newest');
  };

  const getMealIcon = (meal: MealType | null) => {
    switch (meal) {
      case 'tiffin':
        return <Coffee className="w-3.5 h-3.5 text-[#E8A93A]" />;
      case 'lunch':
        return <Sun className="w-3.5 h-3.5 text-[#E8A93A]" />;
      case 'snacks':
        return <Cookie className="w-3.5 h-3.5 text-[#E8A93A]" />;
      case 'dinner':
        return <Moon className="w-3.5 h-3.5 text-[#E8A93A]" />;
      default:
        return <Utensils className="w-3.5 h-3.5 text-[#E8A93A]" />;
    }
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4) {
      return (
        <span className="inline-flex items-center gap-1 bg-[#5C8A56]/20 text-[#1E2B22] border border-[#5C8A56] px-2.5 py-0.5 rounded-full font-mono-plex text-xs font-bold">
          <Star className="w-3 h-3 fill-[#5C8A56] text-[#5C8A56]" />
          <span>{rating}/5 (Good)</span>
        </span>
      );
    }
    if (rating === 3) {
      return (
        <span className="inline-flex items-center gap-1 bg-[#E8A93A]/20 text-[#1E2B22] border border-[#E8A93A] px-2.5 py-0.5 rounded-full font-mono-plex text-xs font-bold">
          <Star className="w-3 h-3 fill-[#E8A93A] text-[#E8A93A]" />
          <span>{rating}/5 (Average)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-[#B5484D]/20 text-[#B5484D] border border-[#B5484D] px-2.5 py-0.5 rounded-full font-mono-plex text-xs font-bold">
        <AlertTriangle className="w-3 h-3 text-[#B5484D]" />
        <span>{rating}/5 (Critical)</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F1E6] text-[#20241F] flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="bg-[#1E2B22] border-b-4 border-[#E8A93A] px-4 sm:px-8 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#E8A93A] text-[#1E2B22] px-2.5 py-1 font-oswald font-black text-xl rounded shadow-xs flex items-center gap-1.5">
              <Shield className="w-5 h-5 stroke-[2.5]" />
              <span>ADMIN CONSOLE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5C8A56] animate-pulse"></span>
              <span className="font-mono-plex text-xs text-[#D9DBD1] tracking-wider uppercase font-semibold">
                Firestore Secure Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="hidden md:inline-block font-mono-plex text-xs text-[#E8A93A] bg-[#2B3A2E] px-3 py-1 rounded border border-[#E8A93A]/30">
              Admin: {authState.user?.email || 'Authorized Lead'}
            </span>

            <button
              onClick={() => setIsResetCycleModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B5484D] hover:bg-[#8F353A] text-white border-2 border-[#1E2B22] rounded-lg font-oswald text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(30,43,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              title="Reset rating system to Day 1 and start a fresh rating cycle"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
              <span>Reset to Day 1</span>
            </button>

            <button
              onClick={() => setIsAdminTeamOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8A93A] hover:bg-[#D99A29] text-[#1E2B22] border-2 border-[#1E2B22] rounded-lg font-oswald text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(30,43,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              title="Manage authorized admin team and committee access"
            >
              <Users className="w-3.5 h-3.5 text-[#1E2B22]" />
              <span>Admin Team</span>
            </button>

            <button
              onClick={exportToCSV}
              disabled={sortedFeedbacks.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDEEE8] hover:bg-white text-[#1E2B22] border-2 border-[#1E2B22] rounded-lg font-oswald text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-[2px_2px_0px_0px_rgba(30,43,34,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5 text-[#1E2B22]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onExitToStudentView}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2B3A2E] hover:bg-[#41573F] text-white border border-[#E8A93A]/40 rounded-lg font-oswald text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
              title="Switch to student menu rating view"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#E8A93A]" />
              <span>Student View</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#20241F] hover:bg-[#151714] text-white rounded-lg font-oswald text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs"
              title="Sign out of admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* Reset Feedback Notice */}
        {resetFeedbackMsg && (
          <div className="bg-[#5C8A56]/20 border-2 border-[#5C8A56] p-4 rounded-xl flex items-center justify-between gap-3 text-[#1E2B22]">
            <div className="flex items-center gap-2 font-mono-plex text-xs font-bold">
              <CheckCircle className="w-5 h-5 text-[#5C8A56]" />
              <span>{resetFeedbackMsg}</span>
            </div>
            <button
              onClick={() => setResetFeedbackMsg(null)}
              className="text-[#1E2B22] hover:text-black font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Banner with Overview */}
        <div className="bg-[#1E2B22] text-[#EDEEE8] p-5 sm:p-6 rounded-2xl border-4 border-[#1E2B22] shadow-[6px_6px_0px_0px_rgba(232,169,58,1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono-plex text-xs font-bold text-[#E8A93A] uppercase tracking-widest">
                Hostel Food Committee Intelligence
              </span>
              <span className="bg-[#5C8A56]/30 text-[#8AE081] border border-[#5C8A56] px-2 py-0.5 rounded text-[10px] font-mono-plex font-bold">
                Continuous Historical View (Unrefreshed)
              </span>
              <span className="bg-[#E8A93A]/20 text-[#E8A93A] border border-[#E8A93A]/40 px-2 py-0.5 rounded text-[10px] font-mono-plex font-bold">
                Day {systemDay} Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-oswald uppercase tracking-tight text-white">
              Student Feedback Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#C9CDC5] mt-1 font-mono-plex max-w-2xl">
              Students see daily ratings that auto-refresh every 24 hours at midnight. This admin panel maintains an unrefreshed, continuous historical view preserving all cumulative feedback.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Today's 24h Cycle pill */}
            <div className="bg-[#2B3A2E] border-2 border-[#C9CDC5]/30 p-2.5 rounded-xl text-center min-w-[100px]">
              <span className="block font-mono-plex text-[9px] uppercase text-[#D9DBD1] font-bold">
                Today (24h)
              </span>
              <span className="font-oswald font-black text-xl text-white">
                {todayEntries.length}
              </span>
              <span className="block font-mono-plex text-[10px] text-[#E8A93A] font-bold">
                Avg: {todayAvgScore}★
              </span>
            </div>

            {/* All-time Cumulative */}
            <div className="bg-[#2B3A2E] border-2 border-[#E8A93A] p-2.5 rounded-xl text-center min-w-[110px]">
              <span className="block font-mono-plex text-[9px] uppercase text-[#C9CDC5] font-bold">
                All Cumulative
              </span>
              <span className="font-oswald font-black text-2xl text-white">
                {stats.total}
              </span>
              <span className="block font-mono-plex text-[10px] text-[#E8A93A] font-bold">
                Avg: {stats.avgRating}★
              </span>
            </div>
          </div>
        </div>

        {/* Analytics KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border-2 border-[#1E2B22] p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(30,43,34,1)]">
            <div className="flex items-center justify-between text-[#585B52] mb-1">
              <span className="font-mono-plex text-[11px] font-bold uppercase">Positive (4-5★)</span>
              <CheckCircle className="w-4 h-4 text-[#5C8A56]" />
            </div>
            <div className="font-oswald font-black text-2xl text-[#1E2B22]">
              {stats.positiveCount}{' '}
              <span className="text-xs font-mono-plex text-[#585B52] font-normal">
                ({stats.total ? Math.round((stats.positiveCount / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-[#1E2B22] p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(30,43,34,1)]">
            <div className="flex items-center justify-between text-[#585B52] mb-1">
              <span className="font-mono-plex text-[11px] font-bold uppercase">Critical (1-2★)</span>
              <AlertTriangle className="w-4 h-4 text-[#B5484D]" />
            </div>
            <div className="font-oswald font-black text-2xl text-[#B5484D]">
              {stats.criticalCount}{' '}
              <span className="text-xs font-mono-plex text-[#585B52] font-normal">
                ({stats.total ? Math.round((stats.criticalCount / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-[#1E2B22] p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(30,43,34,1)]">
            <div className="flex items-center justify-between text-[#585B52] mb-1">
              <span className="font-mono-plex text-[11px] font-bold uppercase">Mess vs Canteen</span>
              <Utensils className="w-4 h-4 text-[#E8A93A]" />
            </div>
            <div className="font-oswald font-black text-2xl text-[#1E2B22]">
              {stats.messCount} <span className="text-sm font-mono-plex text-[#585B52]">/</span> {stats.canteenCount}
            </div>
          </div>

          <div className="bg-white border-2 border-[#1E2B22] p-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(30,43,34,1)]">
            <div className="flex items-center justify-between text-[#585B52] mb-1">
              <span className="font-mono-plex text-[11px] font-bold uppercase">Total Student Upvotes</span>
              <ThumbsUp className="w-4 h-4 text-[#E8A93A]" />
            </div>
            <div className="font-oswald font-black text-2xl text-[#1E2B22]">
              {stats.totalUpvotes}
            </div>
          </div>
        </div>

        {/* Filters and Search Control Panel */}
        <div className="bg-white border-3 border-[#1E2B22] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(30,43,34,1)] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1E2B22]/15 pb-3.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#E8A93A]" />
              <h2 className="font-oswald font-black text-lg uppercase tracking-wide text-[#1E2B22]">
                Filter & Inspect Submissions
              </h2>
              <span className="bg-[#EDEEE8] text-[#1E2B22] px-2 py-0.5 rounded-full font-mono-plex text-xs font-bold border border-[#1E2B22]/20">
                {sortedFeedbacks.length} found
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(categoryFilter !== 'all' ||
                dayFilter !== 'all' ||
                mealFilter !== 'all' ||
                ratingFilter !== 'all' ||
                dateFilter !== 'all' ||
                searchQuery !== '') && (
                <button
                  onClick={clearAllFilters}
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-mono-plex text-[#B5484D] hover:underline font-bold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#585B52]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search comments, issue tags (e.g. Salty, Cold, Puri, Veg Biryani)..."
              className="w-full bg-[#EDEEE8] border-2 border-[#1E2B22] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono-plex text-[#1E2B22] placeholder:text-[#7A7E74] focus:outline-hidden focus:bg-white focus:border-[#E8A93A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#585B52] hover:text-[#1E2B22] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Multi-Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Category Filter */}
            <div className="space-y-1">
              <label className="font-mono-plex text-[11px] font-bold text-[#585B52] uppercase">
                Facility
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full bg-white border-2 border-[#1E2B22] rounded-lg px-2.5 py-2 text-xs font-mono-plex font-semibold text-[#1E2B22] cursor-pointer"
              >
                <option value="all">All (Mess & Canteen)</option>
                <option value="mess">Mess Only</option>
                <option value="canteen">Canteen Only</option>
              </select>
            </div>

            {/* Day Filter */}
            <div className="space-y-1">
              <label className="font-mono-plex text-[11px] font-bold text-[#585B52] uppercase">
                Day of Week
              </label>
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value as any)}
                className="w-full bg-white border-2 border-[#1E2B22] rounded-lg px-2.5 py-2 text-xs font-mono-plex font-semibold text-[#1E2B22] cursor-pointer"
              >
                <option value="all">All Days</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>

            {/* Meal Filter */}
            <div className="space-y-1">
              <label className="font-mono-plex text-[11px] font-bold text-[#585B52] uppercase">
                Meal Slot
              </label>
              <select
                value={mealFilter}
                onChange={(e) => setMealFilter(e.target.value as any)}
                className="w-full bg-white border-2 border-[#1E2B22] rounded-lg px-2.5 py-2 text-xs font-mono-plex font-semibold text-[#1E2B22] cursor-pointer"
              >
                <option value="all">All Meal Slots</option>
                <option value="tiffin">Tiffin (Breakfast)</option>
                <option value="lunch">Lunch</option>
                <option value="snacks">Snacks</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-1">
              <label className="font-mono-plex text-[11px] font-bold text-[#585B52] uppercase">
                Rating
              </label>
              <select
                value={ratingFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'all' || val === 'critical') {
                    setRatingFilter(val);
                  } else {
                    setRatingFilter(Number(val));
                  }
                }}
                className="w-full bg-white border-2 border-[#1E2B22] rounded-lg px-2.5 py-2 text-xs font-mono-plex font-semibold text-[#1E2B22] cursor-pointer"
              >
                <option value="all">All Ratings (1-5★)</option>
                <option value="critical">Critical Issues (1-2★)</option>
                <option value="5">5 Stars (Excellent)</option>
                <option value="4">4 Stars (Good)</option>
                <option value="3">3 Stars (Average)</option>
                <option value="2">2 Stars (Poor)</option>
                <option value="1">1 Star (Terrible)</option>
              </select>
            </div>

            {/* Date Range & Sort */}
            <div className="space-y-1">
              <label className="font-mono-plex text-[11px] font-bold text-[#585B52] uppercase">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-white border-2 border-[#1E2B22] rounded-lg px-2.5 py-2 text-xs font-mono-plex font-semibold text-[#1E2B22] cursor-pointer"
              >
                <option value="all">All Recorded Dates</option>
                <option value="today">Today Only</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
                <option value="custom">Specific Date...</option>
              </select>
            </div>
          </div>

          {/* Custom Date Picker if selected */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-[#EDEEE8] p-2.5 rounded-xl border border-[#1E2B22]/20">
              <Calendar className="w-4 h-4 text-[#E8A93A]" />
              <span className="font-mono-plex text-xs font-bold text-[#1E2B22]">Select Specific Date:</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-white border border-[#1E2B22] rounded px-2.5 py-1 text-xs font-mono-plex text-[#1E2B22]"
              />
            </div>
          )}

          {/* Sort By Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1E2B22]/10 text-xs font-mono-plex">
            <span className="text-[#585B52] font-semibold">Order Results By:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'newest', label: 'Newest' },
                { id: 'oldest', label: 'Oldest' },
                { id: 'highest', label: 'Highest Rating' },
                { id: 'lowest', label: 'Lowest Rating' },
                { id: 'upvotes', label: 'Most Upvoted' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id as any)}
                  className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                    sortBy === s.id
                      ? 'bg-[#1E2B22] text-white shadow-xs'
                      : 'bg-[#EDEEE8] text-[#585B52] hover:text-[#1E2B22]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback List & Table */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white border-2 border-[#1E2B22] p-12 rounded-2xl text-center shadow-[4px_4px_0px_0px_rgba(30,43,34,1)]">
              <RefreshCw className="w-8 h-8 text-[#E8A93A] animate-spin mx-auto mb-3" />
              <p className="font-oswald font-bold text-lg uppercase text-[#1E2B22]">
                Synchronizing with Firestore...
              </p>
              <p className="font-mono-plex text-xs text-[#585B52] mt-1">
                Loading all student submissions securely
              </p>
            </div>
          ) : sortedFeedbacks.length === 0 ? (
            <div className="bg-white border-2 border-[#1E2B22] p-12 rounded-2xl text-center shadow-[4px_4px_0px_0px_rgba(30,43,34,1)] space-y-3">
              <MessageSquare className="w-10 h-10 text-[#C9CDC5] mx-auto" />
              <h3 className="font-oswald font-black text-xl uppercase text-[#1E2B22]">
                No Feedback Matches Your Criteria
              </h3>
              <p className="font-mono-plex text-xs text-[#585B52] max-w-md mx-auto">
                Try widening your date range, adjusting rating filters, or clearing search keywords.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-[#1E2B22] text-white rounded-lg font-oswald text-xs uppercase font-bold tracking-wider shadow-[2px_2px_0px_0px_rgba(232,169,58,1)] cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedFeedbacks.map((item) => {
                const dateObj = new Date(item.ts);
                const formattedTime = dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });
                const formattedDate = dateObj.toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={item.id}
                    className={`bg-white border-2 rounded-xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_rgba(30,43,34,1)] transition-all ${
                      item.rating <= 2
                        ? 'border-[#B5484D]'
                        : item.rating >= 4
                        ? 'border-[#1E2B22]'
                        : 'border-[#1E2B22]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left: Meal & Timing Badges */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Facility badge */}
                          <span
                            className={`px-2 py-0.5 rounded font-oswald font-bold text-xs uppercase tracking-wider ${
                              item.category === 'mess'
                                ? 'bg-[#1E2B22] text-white'
                                : 'bg-[#E8A93A] text-[#1E2B22]'
                            }`}
                          >
                            {item.category === 'mess' ? 'Hostel Mess' : 'Canteen'}
                          </span>

                          {/* Day & Meal Slot */}
                          {item.day && (
                            <span className="font-oswald font-bold text-sm uppercase text-[#1E2B22]">
                              {MENU[item.day]?.label || item.day}
                            </span>
                          )}

                          {item.meal && (
                            <span className="inline-flex items-center gap-1 font-mono-plex text-xs font-bold text-[#585B52] bg-[#EDEEE8] px-2 py-0.5 rounded border border-[#1E2B22]/15">
                              {getMealIcon(item.meal)}
                              <span className="capitalize">{item.meal}</span>
                            </span>
                          )}

                          {/* Rating Badge */}
                          {getRatingBadge(item.rating)}

                          {/* Upvotes Pill */}
                          <span className="inline-flex items-center gap-1 font-mono-plex text-xs font-semibold text-[#1E2B22] bg-[#EDEEE8] px-2 py-0.5 rounded border border-[#1E2B22]/15">
                            <ThumbsUp className="w-3 h-3 text-[#E8A93A]" />
                            <span>{item.upvotes || 0}</span>
                          </span>
                        </div>

                        {/* Timestamp detail */}
                        <div className="flex items-center gap-3 text-[11px] font-mono-plex text-[#7A7E74]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#E8A93A]" />
                            {formattedDate} ({item.date})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#E8A93A]" />
                            {formattedTime}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline font-mono text-[10px] text-[#A0A499]">
                            ID: {item.id}
                          </span>
                        </div>
                      </div>

                      {/* Right: Admin Action / Delete */}
                      <div className="shrink-0 flex items-center gap-2">
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1.5 bg-[#B5484D]/10 p-1.5 rounded-lg border border-[#B5484D]">
                            <span className="text-[11px] font-mono-plex font-bold text-[#B5484D]">
                              Confirm?
                            </span>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isDeleting}
                              className="bg-[#B5484D] text-white px-2 py-1 rounded text-xs font-bold font-oswald cursor-pointer hover:bg-[#8F353A]"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="bg-[#EDEEE8] text-[#1E2B22] px-2 py-1 rounded text-xs font-bold font-oswald cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-[#585B52] hover:text-[#B5484D] hover:bg-[#EDEEE8] rounded-lg transition-colors cursor-pointer"
                            title="Delete this feedback entry from Firestore"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reasons Tags */}
                    {item.reasons && item.reasons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.reasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-mono-plex font-semibold border ${
                              item.rating <= 2
                                ? 'bg-[#B5484D]/10 text-[#B5484D] border-[#B5484D]/30'
                                : 'bg-[#EDEEE8] text-[#20241F] border-[#1E2B22]/20'
                            }`}
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Student Remarks Comment */}
                    {item.comment ? (
                      <div className="mt-3 bg-[#F4F1E6] border-l-4 border-[#E8A93A] p-3 rounded-r-xl text-xs sm:text-sm font-sans text-[#1E2B22] italic">
                        "{item.comment}"
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] font-mono-plex text-[#888B80] italic">
                        No written remark attached
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Reset Rating System to Day 1 Confirmation Modal */}
      {isResetCycleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B22]/80 backdrop-blur-xs">
          <div className="bg-[#F4F1E6] border-4 border-[#B5484D] rounded-2xl max-w-md w-full shadow-[8px_8px_0px_0px_rgba(181,72,77,1)] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#B5484D]">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              <h3 className="font-oswald font-black text-xl uppercase tracking-wide">
                Reset System to Day 1?
              </h3>
            </div>

            <p className="text-sm font-sans text-[#20241F] leading-relaxed">
              This action will <b>permanently clear all feedback documents</b> from the database and set today as <b>Day 1</b>.
            </p>

            <div className="bg-white border border-[#C9CDC5] p-3 rounded-xl text-xs font-mono-plex text-[#585B52] space-y-1">
              <p>• Daily Student Feed will start fresh from 0 reviews.</p>
              <p>• Admin continuous archive will start from Day 1.</p>
              <p>• Automatic 24-hour cycle timer will continue active.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetCycleModalOpen(false)}
                disabled={isResettingCycle}
                className="px-4 py-2 bg-[#EDEEE8] hover:bg-[#D9DBD1] text-[#20241F] font-oswald text-xs uppercase font-bold rounded-lg border border-[#C9CDC5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetSystemToDay1}
                disabled={isResettingCycle}
                className="px-5 py-2 bg-[#B5484D] hover:bg-[#8F353A] text-white font-oswald text-xs uppercase font-bold tracking-wider rounded-lg border-2 border-[#1E2B22] shadow-[2px_2px_0px_0px_rgba(30,43,34,1)] cursor-pointer flex items-center gap-1.5"
              >
                {isResettingCycle ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting to Day 1...</span>
                  </>
                ) : (
                  <span>Yes, Purge & Reset to Day 1</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Team & RBAC Management Modal */}
      <AdminTeamModal
        isOpen={isAdminTeamOpen}
        onClose={() => setIsAdminTeamOpen(false)}
        authState={authState}
      />
    </div>
  );
};
