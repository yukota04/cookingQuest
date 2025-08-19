// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage"; // Import Storage

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3XD66vu9SKAslVJEEdhBjeJUHfr-0oOM",
  authDomain: "cookingquest-e0dae.firebaseapp.com",
  projectId: "cookingquest-e0dae",
  storageBucket: "cookingquest-e0dae.firebasestorage.app",
  messagingSenderId: "916364928110",
  appId: "1:916364928110:web:03f9be7cc7c372a6cbf27f",
  measurementId: "G-5Y2YCGBQ1D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize Storage

export { app, analytics, db, storage };
