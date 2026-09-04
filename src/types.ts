export type MealType = 'tiffin' | 'lunch' | 'snacks' | 'dinner';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type CategoryMode = 'mess' | 'canteen';

export interface FeedbackEntry {
  id: string;
  category: CategoryMode;
  day: DayKey | null;
  meal: MealType | null;
  rating: number;
  reasons: string[];
  comment: string;
  date: string; // YYYY-MM-DD
  ts: number;
  upvotes?: number;
}

export interface MealInfo {
  label: string;
  iconName: 'Coffee' | 'Sun' | 'Cookie' | 'Moon';
  time: string;
}

export interface DayMenuSchedule {
  label: string;
  tiffin: string[];
  lunch: string[];
  snacks: string[];
  dinner: string[];
}

export interface CanteenCategory {
  id: string;
  name: string;
  items: string[];
}
