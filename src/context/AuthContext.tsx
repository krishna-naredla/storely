import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { BusinessProfile } from '../types';
import { getUserBusinesses, createBusiness } from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  authLoading: boolean;
  businessLoading: boolean;
  businessesLoaded: boolean;
  resolved: boolean;
  businessError: string | null;
  hasExistingBusiness: boolean;
  currentBusiness: BusinessProfile | null;
  userBusinesses: BusinessProfile[];
  setCurrentBusiness: (business: BusinessProfile | null) => void;
  setUserBusinesses: React.Dispatch<React.SetStateAction<BusinessProfile[]>>;
  selectBusiness: (business: BusinessProfile) => void;
  refreshBusinesses: () => Promise<BusinessProfile[]>;
  retryLoadBusinesses: () => Promise<BusinessProfile[]>;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  createNewBusiness: (data: Omit<BusinessProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<BusinessProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [businessLoading, setBusinessLoading] = useState<boolean>(false);
  const [businessesLoaded, setBusinessesLoaded] = useState<boolean>(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessProfile | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<BusinessProfile[]>([]);

  // Derived readiness: authentication completed and (either unauthenticated OR businesses fully resolved OR failure recorded)
  const resolved = !authLoading && (!currentUser || (!businessLoading && (businessesLoaded || Boolean(businessError))));
  const hasExistingBusiness = businessesLoaded && !businessError && userBusinesses.length > 0;

  const resolveUserBusinesses = async (uid: string, email?: string | null, retryCount = 0): Promise<BusinessProfile[]> => {
    setBusinessLoading(true);
    setBusinessError(null);
    try {
      // Authoritative Firestore lookup by ownerId & email
      const allBiz = await getUserBusinesses(uid, email || undefined);
      const businesses = (allBiz || []).filter((b) => b.status !== 'deleted');
      setUserBusinesses(businesses);

      if (businesses.length > 0) {
        // Restore last selected active business if exists in user's owned list, otherwise default to first
        const savedId = localStorage.getItem('storelly_active_biz');
        const found = businesses.find((b) => b.id === savedId) || businesses[0];
        setCurrentBusiness(found);
        localStorage.setItem('storelly_active_biz', found.id);
      } else {
        // Explicitly 0 businesses found in Firestore
        setCurrentBusiness(null);
        localStorage.removeItem('storelly_active_biz');
      }

      setBusinessesLoaded(true);
      setBusinessError(null);
      return businesses;
    } catch (err: any) {
      console.error('Error fetching businesses in AuthContext:', err);
      if (retryCount < 2) {
        await new Promise((r) => setTimeout(r, 600));
        return resolveUserBusinesses(uid, email, retryCount + 1);
      }
      setBusinessError(err?.message || 'Failed to load business profiles from cloud.');
      setBusinessesLoaded(false); // Strictly keep false on error - do NOT mark as successfully loaded!
      return [];
    } finally {
      setBusinessLoading(false);
    }
  };

  const selectBusiness = (business: BusinessProfile) => {
    setCurrentBusiness(business);
    localStorage.setItem('storelly_active_biz', business.id);
  };

  const refreshBusinesses = async (): Promise<BusinessProfile[]> => {
    if (!currentUser) {
      setUserBusinesses([]);
      setCurrentBusiness(null);
      setBusinessesLoaded(false);
      setBusinessLoading(false);
      return [];
    }
    return resolveUserBusinesses(currentUser.uid, currentUser.email);
  };

  const retryLoadBusinesses = async (): Promise<BusinessProfile[]> => {
    if (!currentUser) return [];
    return resolveUserBusinesses(currentUser.uid, currentUser.email);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        await resolveUserBusinesses(user.uid, user.email);
      } else {
        setUserBusinesses([]);
        setCurrentBusiness(null);
        setBusinessesLoaded(false);
        setBusinessLoading(false);
        setBusinessError(null);
        localStorage.removeItem('storelly_active_biz');
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, name?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && res.user) {
      await updateProfile(res.user, { displayName: name });
    }
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentBusiness(null);
    setUserBusinesses([]);
    setBusinessesLoaded(false);
    setBusinessLoading(false);
    setBusinessError(null);
    localStorage.removeItem('storelly_active_biz');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const createNewBusiness = async (
    data: Omit<BusinessProfile, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>
  ): Promise<BusinessProfile> => {
    if (!currentUser) throw new Error('Must be logged in to create a business');
    const newBiz = await createBusiness({
      ...data,
      ownerId: currentUser.uid,
    });
    await refreshBusinesses();
    selectBusiness(newBiz);
    return newBiz;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading: authLoading,
        authLoading,
        businessLoading,
        businessesLoaded,
        resolved,
        businessError,
        hasExistingBusiness,
        currentBusiness,
        userBusinesses,
        setCurrentBusiness,
        setUserBusinesses,
        selectBusiness,
        refreshBusinesses,
        retryLoadBusinesses,
        login,
        signup,
        loginWithGoogle,
        logout,
        resetPassword,
        createNewBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
