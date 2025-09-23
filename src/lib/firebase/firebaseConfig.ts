// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDLbHLPbEfiOjBEPw8gHkjvcvMJkKnxMAA",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "academic-buddy-8c812.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "academic-buddy-8c812",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "academic-buddy-8c812.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1042139427797",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1042139427797:web:623e492f2d19b3ebf5435c",
  measurementId: "G-BPVT3NF2JV"
};

// Initialize Firebase (avoid re-initializing during HMR)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Core services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const provider = new GoogleAuthProvider();


export { app, auth, db, storage, provider };