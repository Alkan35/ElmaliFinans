import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDlw9P2LsrcBQAih9OK3fpSWr75NYoiR0o",
  authDomain: "elmalifinans.firebaseapp.com",
  projectId: "elmalifinans",
  storageBucket: "elmalifinans.firebasestorage.app",
  messagingSenderId: "40706623914",
  appId: "1:40706623914:web:985d3524ba235afa7d83d3",
  measurementId: "G-JZ7YH92GZS"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Sadece tarayıcıda analytics başlat
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}
export { analytics }; 