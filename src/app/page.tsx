"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase/firebaseConfig";

export default function LoginButton() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      console.log("Firebase Token:", token); // you'll send this to your backend later
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Sign in with Google
    </button>
  );
}
