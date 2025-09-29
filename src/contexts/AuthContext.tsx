"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/firebaseConfig";
import { User } from "@prisma/client";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle as googleSignIn,
  signOut as authSignOut,
} from "@/lib/firebase/auth";

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync Firebase user with database
  const syncUserWithDatabase = async (firebaseUser: FirebaseUser) => {
    try {
      console.log("Syncing user with database:", {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
      });

      const response = await fetch("/api/auth/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        console.log("User synced successfully:", userData);
        setDbUser(userData);
      } else {
        const errorData = await response.json();
        console.error("Failed to sync user:", response.status, errorData);
        setError(`Failed to sync user: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error syncing user with database:", error);
      setError("Failed to connect to database");
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
    setLoading(true);
    setError(null);

    const { user: firebaseUser, error: authError } = await signInWithEmail(
      email,
      password
    );

    if (authError) {
      setError(authError);
      setLoading(false);
      throw new Error(authError);
    }

    // Don't set loading to false here - let onAuthStateChanged handle it
    console.log("Sign in successful, waiting for auth state change");
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);

    const { user: firebaseUser, error: authError } = await signUpWithEmail(
      email,
      password,
      name
    );

    if (authError) {
      setError(authError);
      setLoading(false);
      throw new Error(authError);
    }

    // Don't set loading to false here - let onAuthStateChanged handle it
    console.log("Sign up successful, waiting for auth state change");
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    const { user: firebaseUser, error: authError } = await googleSignIn();

    if (authError) {
      setError(authError);
      setLoading(false);
      throw new Error(authError);
    }

    // Don't set loading to false here - let onAuthStateChanged handle it
    console.log("Google sign in successful, waiting for auth state change");
  };

  const signOut = async () => {
    setLoading(true);
    const { error: signOutError } = await authSignOut();

    if (signOutError) {
      setError(signOutError);
    }
    setLoading(false);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    dbUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
