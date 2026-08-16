import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const ALLOWED_EMAIL_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || "rvu.edu.in";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Restrict the Google account picker to the institution's Workspace domain.
// This is a UX convenience only — it is NOT a security boundary by itself,
// so it is enforced again on sign-in (src/lib/auth.js) and in Firestore
// security rules (firestore.rules).
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN });
