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
  currentBusiness: BusinessProfile | null;
  userBusinesses: BusinessProfile[];
  setCurrentBusiness: (business: BusinessProfile | null) => void;
  refreshBusinesses: () => Promise<void>;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessProfile | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<BusinessProfile[]>([]);

  const refreshBusinesses = async () => {
    if (!currentUser) {
      setUserBusinesses([]);
      setCurrentBusiness(null);
      return;
    }
    try {
      const businesses = await getUserBusinesses(currentUser.uid);
      setUserBusinesses(businesses);
      if (businesses.length > 0) {
        // Keep current selected if valid, otherwise pick first
        setCurrentBusiness((prev) => {
          if (prev && businesses.some((b) => b.id === prev.id)) {
            const updated = businesses.find((b) => b.id === prev.id);
            return updated || prev;
          }
          return businesses[0];
        });
      } else {
        setCurrentBusiness(null);
      }
    } catch (err) {
      console.error('Failed to load user businesses:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const businesses = await getUserBusinesses(user.uid);
          setUserBusinesses(businesses);
          if (businesses.length > 0) {
            setCurrentBusiness(businesses[0]);
          } else {
            setCurrentBusiness(null);
          }
        } catch (e) {
          console.error('Error fetching businesses on auth change:', e);
        }
      } else {
        setUserBusinesses([]);
        setCurrentBusiness(null);
      }
      setLoading(false);
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
    setCurrentBusiness(null);
    setUserBusinesses([]);
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
    setCurrentBusiness(newBiz);
    return newBiz;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        currentBusiness,
        userBusinesses,
        setCurrentBusiness,
        refreshBusinesses,
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
