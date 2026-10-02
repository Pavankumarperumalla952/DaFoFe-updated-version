import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  limit,
  where
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { FeedbackEntry, MealType, UserMealReview } from './types';
import { INITIAL_ENTRIES, SYSTEM_START_DATE, getSystemDayNumber } from './data/menuData';

// Storage keys for single meal review constraint
const STUDENT_STORAGE_KEY = 'dafofe_student_uid';
const REVIEWED_MEALS_STORAGE_KEY = 'dafofe_user_reviewed_meals_v1';

let inMemoryStudentId: string | null = null;
let inMemoryReviewedMeals: Record<string, Partial<Record<MealType, UserMealReview>>> = {};

/**
 * Retrieve or generate a persistent unique anonymous student identifier token.
 * This guarantees a consistent individual person identity across reloads and sessions.
 */
export function getPersistentStudentId(): string {
  try {
    let studentId = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (!studentId) {
      const randomPart = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      studentId = `student_${randomPart}`;
      localStorage.setItem(STUDENT_STORAGE_KEY, studentId);
    }
    inMemoryStudentId = studentId;
    return studentId;
  } catch {
    if (!inMemoryStudentId) {
      inMemoryStudentId = auth.currentUser?.uid || `student_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`;
    }
    return inMemoryStudentId;
  }
}

/**
 * Retrieve all meal reviews logged by this person stored in localStorage.
 * Format: { [dateString: string]: Partial<Record<MealType, UserMealReview>> }
 */
export function getLocalReviewedMeals(): Record<string, Partial<Record<MealType, UserMealReview>>> {
  try {
    const raw = localStorage.getItem(REVIEWED_MEALS_STORAGE_KEY);
    if (!raw) return inMemoryReviewedMeals;
    const parsed = JSON.parse(raw);
    inMemoryReviewedMeals = { ...inMemoryReviewedMeals, ...parsed };
    return inMemoryReviewedMeals;
  } catch {
    return inMemoryReviewedMeals;
  }
}

/**
 * Save a meal review for this person into local storage for immediate client-side lock.
 */
export function saveLocalReviewedMeal(review: UserMealReview): void {
  try {
    if (!inMemoryReviewedMeals[review.date]) {
      inMemoryReviewedMeals[review.date] = {};
    }
    inMemoryReviewedMeals[review.date][review.meal] = review;

    const data = getLocalReviewedMeals();
    if (!data[review.date]) {
      data[review.date] = {};
    }
    data[review.date][review.meal] = review;
    localStorage.setItem(REVIEWED_MEALS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not cache reviewed meal locally:', e);
  }
}

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with long-polling to guarantee reliable connectivity across preview iframes and networks
const targetDbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true
    },
    targetDbId
  );
} catch {
  firestoreDb = targetDbId ? getFirestore(app, targetDbId) : getFirestore(app);
}

export const db = firestoreDb;

// Initialize Firebase Auth
export const auth = getAuth(app);

const FEEDBACK_COLLECTION = 'feedbacks';
const USERS_COLLECTION = 'users';
const ADMINS_COLLECTION = 'admins';
const SYSTEM_COLLECTION = 'system';

// Primary Designated Super Admin Email
export const PRIMARY_SUPER_ADMIN_EMAIL = 'pavankumarperumalla952@gmail.com';

// Ensure student session is initialized (students use unique persistent client ID)
export function ensureAnonymousAuth(): Promise<void> {
  return Promise.resolve();
}

export interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
}

export interface AdminMember {
  uid: string;
  email: string;
  role: 'super_admin' | 'admin';
  addedAt: string;
  addedBy?: string;
}

/**
 * Check if the given user has verified Admin credentials in Firestore
 */
export async function checkUserIsAdmin(user: User | null): Promise<{ isAdmin: boolean; isSuperAdmin: boolean }> {
  if (!user || user.isAnonymous) {
    return { isAdmin: false, isSuperAdmin: false };
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const isSuperAdminEmail = userEmail === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase().trim();

  // If primary super admin, automatically ensure their admin doc exists in Firestore
  if (isSuperAdminEmail) {
    try {
      const adminDocRef = doc(db, ADMINS_COLLECTION, user.uid);
      const adminDoc = await getDoc(adminDocRef);
      if (!adminDoc.exists()) {
        await setDoc(adminDocRef, {
          uid: user.uid,
          email: user.email,
          role: 'super_admin',
          addedAt: new Date().toISOString(),
          addedBy: 'system_root'
        });
      }

      const userDocRef = doc(db, USERS_COLLECTION, user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Super admin sync notice:', e);
    }
    return { isAdmin: true, isSuperAdmin: true };
  }

  try {
    // 1. Check if UID exists in /admins/{uid} collection
    const adminDoc = await getDoc(doc(db, ADMINS_COLLECTION, user.uid));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      const isSuper = data?.role === 'super_admin';
      return { isAdmin: true, isSuperAdmin: isSuper };
    }

    // 2. Check if email exists in /admins by query (for pre-authorized invites)
    const emailQuery = query(
      collection(db, ADMINS_COLLECTION),
      where('email', '==', userEmail)
    );
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      // Provision the UID document for fast rules checking
      try {
        await setDoc(doc(db, ADMINS_COLLECTION, user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          addedAt: new Date().toISOString(),
          authorizedViaInvite: true
        });
      } catch {
        // ignore
      }
      return { isAdmin: true, isSuperAdmin: false };
    }

    // 3. Check /users/{uid} role field
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
    if (userDoc.exists() && userDoc.data()?.role === 'admin') {
      return { isAdmin: true, isSuperAdmin: false };
    }
  } catch (err) {
    console.warn('Admin validation notice:', err);
  }

  // Strictly return false for anyone else!
  return { isAdmin: false, isSuperAdmin: false };
}

/**
 * Listen for authentication state changes and determine admin status strictly
 */
export function subscribeToAuthState(onStateChange: (state: AdminAuthState) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user || user.isAnonymous) {
      onStateChange({ user: null, isAdmin: false, isSuperAdmin: false, loading: false });
    } else {
      const { isAdmin, isSuperAdmin } = await checkUserIsAdmin(user);
      onStateChange({ user, isAdmin, isSuperAdmin, loading: false });
    }
  });
}

/**
 * Admin Sign In with strict authorization check
 */
export async function signInAdmin(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const user = cred.user;

  const { isAdmin } = await checkUserIsAdmin(user);

  if (!isAdmin) {
    // If not an admin, sign out immediately to prevent unauthorized session
    await signOut(auth);
    await ensureAnonymousAuth();
    throw new Error(
      `Access Denied: The account (${email}) is not authorized as an Admin. Only designated Hostel Committee members and Wardens can access the Admin Console.`
    );
  }

  return user;
}

/**
 * Admin Account Registration
 * Checks if the email is the designated super admin or pre-authorized in the admins registry.
 */
export async function registerAdmin(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const isSuperAdminEmail = cleanEmail === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase();

  // If not super admin, check if pre-authorized in admins registry
  if (!isSuperAdminEmail) {
    try {
      const emailQuery = query(
        collection(db, ADMINS_COLLECTION),
        where('email', '==', cleanEmail)
      );
      const emailSnap = await getDocs(emailQuery);

      if (emailSnap.empty) {
        throw new Error(
          `Unauthorized Email: "${email}" is not on the authorized Hostel Admin whitelist. Please ask an existing Admin (${PRIMARY_SUPER_ADMIN_EMAIL}) to add your email to the Admin Team list first.`
        );
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Unauthorized Email')) {
        throw e;
      }
      console.warn('Pre-auth check notice:', e);
    }
  }

  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  const user = cred.user;

  // Set user role as admin in Firestore
  try {
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    const adminDocRef = doc(db, ADMINS_COLLECTION, user.uid);
    await setDoc(adminDocRef, {
      uid: user.uid,
      email: user.email,
      role: isSuperAdminEmail ? 'super_admin' : 'admin',
      createdAt: new Date().toISOString(),
      addedBy: isSuperAdminEmail ? 'system_root' : 'authorized_invite'
    });
  } catch (e) {
    console.warn('Admin record write notice:', e);
  }

  return user;
}

/**
 * Admin Sign Out (switches back to anonymous student mode)
 */
export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
  await ensureAnonymousAuth();
}

/**
 * Fetch list of all authorized admins from Firestore (Admin only)
 */
export async function getAuthorizedAdminsList(): Promise<AdminMember[]> {
  try {
    const adminSnap = await getDocs(collection(db, ADMINS_COLLECTION));
    const list: AdminMember[] = [];
    adminSnap.forEach((d) => {
      const data = d.data();
      list.push({
        uid: d.id,
        email: data.email || 'N/A',
        role: data.role === 'super_admin' ? 'super_admin' : 'admin',
        addedAt: data.addedAt || data.createdAt || new Date().toISOString(),
        addedBy: data.addedBy || 'Admin'
      });
    });

    // If list is empty, include the primary super admin
    if (!list.some((a) => a.email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase())) {
      list.unshift({
        uid: 'primary_root',
        email: PRIMARY_SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        addedAt: new Date().toISOString(),
        addedBy: 'system_root'
      });
    }

    return list;
  } catch (err) {
    console.warn('Error fetching admin list:', err);
    return [
      {
        uid: 'primary_root',
        email: PRIMARY_SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        addedAt: new Date().toISOString(),
        addedBy: 'system_root'
      }
    ];
  }
}

/**
 * Add a new authorized admin email to the whitelist (Admin only)
 */
export async function addAuthorizedAdmin(
  newAdminEmail: string,
  addedByEmail?: string
): Promise<void> {
  const cleanEmail = newAdminEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  // Create an admin invite doc with email as key/field
  const inviteDocId = `invite_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const docRef = doc(db, ADMINS_COLLECTION, inviteDocId);

  await setDoc(docRef, {
    email: cleanEmail,
    role: 'admin',
    addedAt: new Date().toISOString(),
    addedBy: addedByEmail || 'Admin Lead'
  });
}

/**
 * Remove an authorized admin from Firestore (Super Admin or authorized admin)
 */
export async function removeAuthorizedAdmin(adminId: string, email: string): Promise<void> {
  if (email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('The Primary Super Admin account cannot be removed.');
  }
  const docRef = doc(db, ADMINS_COLLECTION, adminId);
  await deleteDoc(docRef);
}

/**
 * Subscribe to real-time feedback updates from Firestore.
 * Clean slate from Day 1 - no legacy mock seeds injected.
 */
export function subscribeToFeedbacks(
  onUpdate: (entries: FeedbackEntry[]) => void,
  onError?: (err: Error) => void
) {
  const feedbacksRef = collection(db, FEEDBACK_COLLECTION);
  const q = query(feedbacksRef, orderBy('ts', 'desc'), limit(500));

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      const list: FeedbackEntry[] = [];
      const legacySeedDocIds: string[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = docSnap.id;

        // Identify legacy mock seed entries from previous sample states
        if (docId.startsWith('seed-') || (data.id && String(data.id).startsWith('seed-'))) {
          legacySeedDocIds.push(docId);
          return; // omit legacy sample data from Day 1 rating system
        }

        const entryAuthorId = data.authorId || undefined;
        list.push({
          id: docSnap.id,
          category: data.category || (data.mode as any) || 'mess',
          day: data.day || null,
          meal: data.meal || null,
          rating: Number(data.rating) || 3,
          reasons: Array.isArray(data.reasons) ? data.reasons : [],
          comment: data.comment || '',
          date: data.date || new Date().toISOString().split('T')[0],
          ts:
            typeof data.ts === 'number'
              ? data.ts
              : data.timestamp
              ? new Date(data.timestamp).getTime()
              : Date.now(),
          upvotes: typeof data.upvotes === 'number' ? data.upvotes : 0,
          authorId: entryAuthorId
        });
      });

      // Synchronize student's own logged reviews into local cache
      const currentStudentId = getPersistentStudentId();
      list.forEach((item) => {
        if (item.category === 'mess' && item.meal && item.authorId === currentStudentId) {
          saveLocalReviewedMeal({
            meal: item.meal,
            date: item.date,
            rating: item.rating,
            reasons: item.reasons,
            comment: item.comment,
            ts: item.ts,
            entryId: item.id
          });
        }
      });

      // Silently attempt to purge any legacy mock seeds found in Firestore
      if (legacySeedDocIds.length > 0 && auth.currentUser) {
        legacySeedDocIds.forEach((sid) => {
          deleteDoc(doc(db, FEEDBACK_COLLECTION, sid)).catch(() => {
            // Ignored if permissions don't allow delete
          });
        });
      }

      onUpdate(list);
    },
    (err) => {
      console.warn('Firestore onSnapshot access notice:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Reset Rating System to Day 1 (Admin action)
 * Wipes all existing feedback documents in Firestore and restarts system fresh from Day 1.
 */
export async function resetRatingSystemToDay1(): Promise<{ success: boolean; deletedCount: number; message: string }> {
  const feedbacksRef = collection(db, FEEDBACK_COLLECTION);
  const snapshot = await getDocs(feedbacksRef);
  let deletedCount = 0;

  for (const docSnap of snapshot.docs) {
    try {
      await deleteDoc(doc(db, FEEDBACK_COLLECTION, docSnap.id));
      deletedCount++;
    } catch (e) {
      console.warn('Error deleting doc during reset:', docSnap.id, e);
    }
  }

  try {
    const cycleDocRef = doc(db, SYSTEM_COLLECTION, 'rating_cycle');
    await setDoc(cycleDocRef, {
      startDate: SYSTEM_START_DATE,
      day: 1,
      lastResetAt: new Date().toISOString(),
      resetBy: auth.currentUser?.email || 'Admin',
      totalDeleted: deletedCount
    });
  } catch (e) {
    console.warn('System cycle doc notice:', e);
  }

  return {
    success: true,
    deletedCount,
    message: `Successfully cleared ${deletedCount} feedbacks and started Day 1.`
  };
}

/**
 * Save new feedback entry permanently into Firestore (Accessible anonymously by students)
 * Enforces single review per meal per person for Morning Tiffin, Afternoon Lunch, Evening Snacks, and Night Dinner.
 */
export async function addFeedbackToFirestore(entry: FeedbackEntry): Promise<void> {
  await ensureAnonymousAuth();
  const persistentUid = getPersistentStudentId();
  const authorId = entry.authorId || auth.currentUser?.uid || persistentUid;

  // Use a deterministic document ID for mess meals per date, meal, and person:
  // rev_<YYYY-MM-DD>_<meal>_<authorId>
  const docId =
    entry.category === 'mess' && entry.meal && entry.date
      ? `rev_${entry.date}_${entry.meal}_${authorId.replace(/[^a-zA-Z0-9_-]/g, '_')}`
      : entry.id;

  const docRef = doc(db, FEEDBACK_COLLECTION, docId);
  await setDoc(docRef, {
    id: docId,
    category: entry.category,
    day: entry.day,
    meal: entry.meal,
    rating: entry.rating,
    reasons: entry.reasons,
    comment: entry.comment,
    date: entry.date,
    ts: entry.ts,
    timestamp: new Date(entry.ts).toISOString(),
    upvotes: entry.upvotes || 0,
    authorId: authorId
  });

  // Lock review in local storage cache immediately
  if (entry.category === 'mess' && entry.meal) {
    saveLocalReviewedMeal({
      meal: entry.meal,
      date: entry.date,
      rating: entry.rating,
      reasons: entry.reasons,
      comment: entry.comment,
      ts: entry.ts,
      entryId: docId
    });
  }
}

/**
 * Increment upvotes count for a specific feedback document in Firestore
 */
export async function incrementFeedbackUpvote(id: string): Promise<void> {
  try {
    const docRef = doc(db, FEEDBACK_COLLECTION, id);
    await updateDoc(docRef, {
      upvotes: increment(1)
    });
  } catch (err) {
    console.warn('Feedback upvote Firestore notice:', err);
  }
}

/**
 * Delete feedback document (Admin Only)
 */
export async function deleteFeedbackFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, FEEDBACK_COLLECTION, id);
  await deleteDoc(docRef);
}
