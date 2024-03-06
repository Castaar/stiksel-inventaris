// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJ2QUe2cf0azVXYuVHSJqyuE6_OG3KmeA",
  authDomain: "administration-godefroy.firebaseapp.com",
  projectId: "administration-godefroy",
  storageBucket: "administration-godefroy.appspot.com",
  messagingSenderId: "725575953462",
  appId: "1:725575953462:web:d4605c6932f980e2f3fc97",
  measurementId: "G-4RK0987F9K",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const storage = getStorage(app);
