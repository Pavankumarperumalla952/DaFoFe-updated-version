import { DayKey, DayMenuSchedule, FeedbackEntry, MealInfo, MealType } from '../types';

export const MEAL_ORDER: MealType[] = ['tiffin', 'lunch', 'snacks', 'dinner'];

export const MEAL_META: Record<MealType, MealInfo> = {
  tiffin: { label: 'Tiffin', iconName: 'Coffee', time: '07:00 AM - 08:40 AM' },
  lunch: { label: 'Lunch', iconName: 'Sun', time: '12:00 PM - 01:00 PM' },
  snacks: { label: 'Snacks', iconName: 'Cookie', time: '04:40 PM - 05:00 PM' },
  dinner: { label: 'Dinner', iconName: 'Moon', time: '06:30 PM - 08:00 PM' }
};

export const MENU: Record<DayKey, DayMenuSchedule> = {
  monday: {
    label: 'Monday',
    tiffin: ['Idli', 'Bonda', 'Chutney', 'Bombay chutney'],
    lunch: ['Rice', 'Fry curry', 'Normal curry', 'Sambar / Dal', 'Pickle', 'Curd'],
    snacks: ['Pakoda'],
    dinner: ['Rice', 'Fry curry', 'Normal curry', 'Sambar / Dal', 'Pickle', 'Curd']
  },
  tuesday: {
    label: 'Tuesday',
    tiffin: ['Onion dosa', 'Idli', 'Normal chutney', 'Bombay chutney'],
    lunch: ['Rice', 'Fry curry', 'Normal curry', 'Sambar / Dal', 'Pickle', 'Curd'],
    snacks: ['Masala vada'],
    dinner: ['Rice', 'Egg bhurji', 'Kabuli chana curry', 'Sambar / Dal', 'Pickle', 'Curd']
  },
  wednesday: {
    label: 'Wednesday',
    tiffin: ['Vada', 'Idli', 'Normal chutney', 'Bombay chutney'],
    lunch: ['Rice', 'Fry curry', 'Normal curry', 'Sambar / Dal', 'Pickle', 'Curd'],
    snacks: ['Bananas'],
    dinner: ['Vegetable fried rice', 'Egg fried rice', 'Potato curry', 'Pickle', 'Curd']
  },
  thursday: {
    label: 'Thursday',
    tiffin: ['Upma', 'Idli', 'Normal chutney', 'Bombay chutney'],
    lunch: ['Rice', 'Normal curry', 'Fry curry', 'Sambar / Dal', 'Pickle', 'Curd'],
    snacks: ['Samosa'],
    dinner: ['Rice', 'Sambar / Dal', 'Fry curry', 'Normal curry', 'Pickle', 'Curd']
  },
  friday: {
    label: 'Friday',
    tiffin: ['Uttapam', 'Idli', 'Bombay chutney', 'Normal chutney'],
    lunch: ['Rice', 'Normal curry', 'Fry curry', 'Sambar / Dal', 'Pickle', 'Curd'],
    snacks: ['Roasted/boiled peanuts'],
    dinner: ['Rice', 'Fry curry', 'Normal curry', 'Sambar / Dal', 'Pickle', 'Curd']
  },
  saturday: {
    label: 'Saturday',
    tiffin: ['Masala dosa', 'Idli', 'Normal chutney', 'Bombay chutney'],
    lunch: ['Fry curry', 'Rice', 'Normal curry', 'Sambar / Dal', 'Pickle', 'Curd'],
    snacks: ['Punugulu'],
    dinner: ['Khichdi / tiffins', 'Potato curry', 'Normal chutney', 'Bombay chutney', 'Pickle', 'Curd']
  },
  sunday: {
    label: 'Sunday',
    tiffin: ['Poori / banda', 'Normal chutney', 'Bombay chutney', 'Idli'],
    lunch: ['Biryani', 'Chicken curry', 'Chicken gravy', 'Kachambari', 'Pickle', 'Curd'],
    snacks: ['Bun / banda', 'Cream bun', 'Egg bonda', 'Sweet corn'],
    dinner: ['Rice', 'Fry curry', 'Normal curry', 'Sambar / Dal', 'Pickle', 'Curd']
  }
};

export const DAY_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export const CANTEEN_CATEGORIES = [
  {
    id: 'tiffin',
    name: 'Tiffin',
    items: [
      'Puri',
      'Idly',
      'Mysore Bonda',
      'Onion Dosa',
      'Masala Dosa',
      'Normal Chutney',
      'Bombay Chutney'
    ]
  },
  {
    id: 'meals',
    name: 'Meals & Specials',
    items: [
      'Half Meals / Full Meals',
      'Veg Biryani',
      'Chicken Biryani',
      'Chapathi',
      'Parota',
      'Chicken Curry',
      'Fish Fry',
      'Fried Rice',
      'Omlette',
      'Tea',
      'Coffee'
    ]
  }
];

export const CANTEEN_ITEMS = [
  'Puri',
  'Idly',
  'Mysore Bonda',
  'Onion Dosa',
  'Masala Dosa',
  'Normal Chutney',
  'Bombay Chutney',
  'Half Meals / Full Meals',
  'Veg Biryani',
  'Chicken Biryani',
  'Chapathi',
  'Parota',
  'Chicken Curry',
  'Fish Fry',
  'Fried Rice',
  'Omlette',
  'Tea',
  'Coffee'
];

export const REASONS = [
  'Undercooked',
  'Overcooked',
  'Too spicy',
  'Bland / tasteless',
  'Cold',
  'Less quantity',
  'Stale / smell',
  'Too oily',
  'Other'
];

export function getTodayKey(): DayKey {
  const idx = new Date().getDay();
  const map: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[idx];
}

export function getCurrentMealTime(): MealType {
  const hours = new Date().getHours();
  if (hours >= 6 && hours < 11) return 'tiffin';
  if (hours >= 11 && hours < 16) return 'lunch';
  if (hours >= 16 && hours < 19) return 'snacks';
  return 'dinner';
}

export function getDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

// System reset date: starting fresh with Day 1
export const SYSTEM_START_DATE = '2026-09-03';

export function getSystemDayNumber(): number {
  try {
    const start = new Date(SYSTEM_START_DATE + 'T00:00:00');
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays + 1);
  } catch {
    return 1;
  }
}

// System reset: all past data cleared. Starting fresh with Day 1.
export const INITIAL_ENTRIES: FeedbackEntry[] = [];
