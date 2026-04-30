// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAra_GwPKZLXwh-N7r7BKrgydZMkXfYaNg",
  authDomain: "testingokok.firebaseapp.com",
  projectId: "testingokok",
  storageBucket: "testingokok.firebasestorage.app",
  messagingSenderId: "998795412080",
  appId: "1:998795412080:web:3bb9f11e1457af90502ab5",
  measurementId: "G-L83XTJ45WS"
};

// Initialize Firebase
// Initialize the Firebase connection
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

// Initialize Firestore and explicitly EXPORT it as 'db'
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();