import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  AuthError
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  QueryConstraint,
  CollectionReference
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Firebase Configuration
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize analytics
let analytics: ReturnType<typeof getAnalytics> | null = null;
(async () => {
  try {
    if (typeof window !== 'undefined' && await isSupported()) {
      analytics = getAnalytics(app);
    }
  } catch (e) {
    console.warn('Analytics not available:', e);
  }
})();

/**
 * ===========================
 * AUTHENTICATION SERVICE
 * ===========================
 */

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  trustScore: number;
  itemsReported: number;
  itemsRecovered: number;
  createdAt: string;
  role: 'user' | 'admin';
}

export const authService = {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: User; profile: UserProfile }> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        id: firebaseUser.uid,
        email: data.email,
        name: data.name,
        phone: data.phone || '',
        trustScore: 100,
        itemsReported: 0,
        itemsRecovered: 0,
        createdAt: new Date().toISOString(),
        role: 'user'
      };

      await setDoc(doc(db, 'Users', firebaseUser.uid), userProfile);

      return { user: firebaseUser, profile: userProfile };
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || 'Registration failed');
    }
  },

  /**
   * Login with email and password
   */
  async login(data: LoginData): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      return userCredential.user;
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || 'Login failed');
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || 'Logout failed');
    }
  },

  /**
   * Get current user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'Users', userId));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'Users', userId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message || 'Profile update failed');
    }
  }
};

/**
 * ===========================
 * ITEMS SERVICE
 * ===========================
 */

interface LostItem {
  id: string;
  userId: string;
  itemName: string;
  category: string;
  description: string;
  location: string;
  lostDate: string;
  lostTime: string;
  imageUrl?: string;
  color?: string;
  brand?: string;
  estimatedValue?: number;
  status: 'lost' | 'found' | 'recovered';
  views: number;
  matches: any[];
  createdAt: string;
  updatedAt: string;
}

interface FoundItem {
  id: string;
  userId: string;
  itemName: string;
  category: string;
  description: string;
  foundLocation: string;
  foundDate: string;
  foundTime: string;
  currentLocation: string;
  imageUrl?: string;
  color?: string;
  brand?: string;
  status: 'lost' | 'found' | 'recovered';
  views: number;
  matches: any[];
  createdAt: string;
  updatedAt: string;
}

export const itemsService = {
  /**
   * Report a lost item
   */
  async reportLostItem(userId: string, itemData: Partial<LostItem>): Promise<LostItem> {
    try {
      const itemId = `lost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newItem: LostItem = {
        id: itemId,
        userId,
        status: 'lost',
        views: 0,
        matches: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(itemData as Partial<LostItem>)
      } as LostItem;

      await setDoc(doc(db, 'LostItems', itemId), newItem);

      // Update user stats
      const userDoc = await getDoc(doc(db, 'Users', userId));
      if (userDoc.exists()) {
        await updateDoc(doc(db, 'Users', userId), {
          itemsReported: (userDoc.data()?.itemsReported || 0) + 1
        });
      }

      return newItem;
    } catch (error) {
      console.error('Failed to report lost item:', error);
      throw error;
    }
  },

  /**
   * Report a found item
   */
  async reportFoundItem(userId: string, itemData: Partial<FoundItem>): Promise<FoundItem> {
    try {
      const itemId = `found_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newItem: FoundItem = {
        id: itemId,
        userId,
        status: 'found',
        views: 0,
        matches: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(itemData as Partial<FoundItem>)
      } as FoundItem;

      await setDoc(doc(db, 'FoundItems', itemId), newItem);
      return newItem;
    } catch (error) {
      console.error('Failed to report found item:', error);
      throw error;
    }
  },

  /**
   * Get single item by ID
   */
  async getItem(itemId: string): Promise<LostItem | FoundItem | null> {
    try {
      const itemDoc = await getDoc(doc(db, 'LostItems', itemId));
      if (itemDoc.exists()) {
        // Increment views
        await updateDoc(doc(db, 'LostItems', itemId), {
          views: (itemDoc.data()?.views || 0) + 1
        });
        return itemDoc.data() as LostItem | FoundItem;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch item:', error);
      return null;
    }
  },

  /**
   * Get user's items
   */
  async getUserItems(userId: string, type?: 'lost' | 'found'): Promise<(LostItem | FoundItem)[]> {
    try {
      let q = query(
        collection(db, 'items'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (type) {
        q = query(
          collection(db, 'items'),
          where('userId', '==', userId),
          where('status', '==', type),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as LostItem | FoundItem);
    } catch (error) {
      console.error('Failed to fetch user items:', error);
      return [];
    }
  },

  /**
   * Search items
   */
  async searchItems(searchQuery?: string, category?: string, status?: string): Promise<(LostItem | FoundItem)[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (status) {
        constraints.push(where('status', '==', status));
      }

      if (category) {
        constraints.push(where('category', '==', category));
      }

      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(50));

      const q = query(collection(db, 'items'), ...constraints);
      const snapshot = await getDocs(q);
      let items = snapshot.docs.map(doc => doc.data() as LostItem | FoundItem);

      // Client-side text search
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        items = items.filter(item =>
          item.itemName.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery) ||
          item.category.toLowerCase().includes(lowerQuery)
        );
      }

      return items;
    } catch (error) {
      console.error('Failed to search items:', error);
      return [];
    }
  },

  /**
   * Get items by category
   */
  async getItemsByCategory(category: string): Promise<(LostItem | FoundItem)[]> {
    try {
      const q = query(
        collection(db, 'items'),
        where('category', '==', category),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as LostItem | FoundItem);
    } catch (error) {
      console.error('Failed to fetch items by category:', error);
      return [];
    }
  },

  /**
   * Update an item
   */
  async updateItem(itemId: string, updates: Partial<LostItem | FoundItem>): Promise<void> {
    try {
      await updateDoc(doc(db, 'LostItems', itemId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  },

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'LostItems', itemId));
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  }
};

/**
 * ===========================
 * FILE UPLOAD SERVICE
 * ===========================
 */

export const uploadService = {
  /**
   * Upload item image
   */
  async uploadItemImage(file: File, itemId: string): Promise<string> {
    try {
      const fileName = `items/${itemId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      return downloadUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw new Error('Image upload failed');
    }
  },

  /**
   * Upload user profile image
   */
  async uploadUserProfileImage(file: File, userId: string): Promise<string> {
    try {
      const fileName = `users/${userId}/profile_${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      return downloadUrl;
    } catch (error) {
      console.error('Failed to upload profile image:', error);
      throw new Error('Profile image upload failed');
    }
  }
};

// Export services and utilities
export { auth, db, storage, analytics };
