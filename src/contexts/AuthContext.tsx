'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { auth, provider } from '@/lib/firebase/firebaseConfig';
import { User } from '@prisma/client';

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (name: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Firebase user with database
  const syncUserWithDatabase = async (firebaseUser: FirebaseUser) => {
    try {
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          profilePic: firebaseUser.photoURL,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        setDbUser(userData);
      }
    } catch (error) {
      console.error('Error syncing user with database:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await syncUserWithDatabase(firebaseUser);
      } else {
        setDbUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newUser, { displayName: name });
  };

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const updateUserProfile = async (name: string, photoURL?: string) => {
    if (user) {
      await updateProfile(user, { 
        displayName: name, 
        ...(photoURL && { photoURL }) 
      });
      // Sync updated profile with database
      await syncUserWithDatabase(user);
    }
  };

  const value: AuthContextType = {
    user,
    dbUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}