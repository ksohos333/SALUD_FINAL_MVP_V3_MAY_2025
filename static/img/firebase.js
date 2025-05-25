// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDP0ajEA1sfjDNrHEq0EfOsnf1NoliOyhQ",
  authDomain: "saludmvpyescorrect.firebaseapp.com",
  projectId: "saludmvpyescorrect",
  storageBucket: "saludmvpyescorrect.firebasestorage.app",
  messagingSenderId: "664615109363",
  appId: "1:664615109363:web:076848418836fb461f6d86",
  measurementId: "G-31T1TMR48X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);