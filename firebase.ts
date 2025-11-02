// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcMpmRTAlPxE09dD9tAQ6kinZ-h3cL_1k",
  authDomain: "mindfulflow-a0d22.firebaseapp.com",
  projectId: "mindfulflow-a0d22",
  storageBucket: "mindfulflow-a0d22.firebasestorage.app",
  messagingSenderId: "1041770029535",
  appId: "1:1041770029535:web:6e08b83ba3c35534da646a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth with persistent session using AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
