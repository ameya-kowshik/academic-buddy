import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth"
import { auth } from "./firebaseConfig"

// Simple error message mapping
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/user-not-found":
      return "No account found with this email"
    case "auth/wrong-password":
      return "Incorrect password"
    case "auth/email-already-in-use":
      return "An account with this email already exists"
    case "auth/weak-password":
      return "Password should be at least 6 characters"
    case "auth/invalid-email":
      return "Invalid email address"
    case "auth/popup-closed-by-user":
      return "Sign-in cancelled"
    default:
      return "An error occurred. Please try again."
  }
}

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update the user's display name
    await updateProfile(result.user, {
      displayName: name,
    })
    
    return { user: result.user, error: null }
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) }
  }
}

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return { user: result.user, error: null }
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) }
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return { user: result.user, error: null }
  } catch (error: any) {
    return { user: null, error: getErrorMessage(error.code) }
  }
}

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: "Failed to sign out" }
  }
}