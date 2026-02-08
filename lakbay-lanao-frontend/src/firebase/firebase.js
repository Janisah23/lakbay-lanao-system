// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_SFUvJhVa0BVDurgIX0nyj8SkWSLiLlg",
  authDomain: "lakbay-lanao-system.firebaseapp.com",
  projectId: "lakbay-lanao-system",
  storageBucket: "lakbay-lanao-system.firebasestorage.app",
  messagingSenderId: "36828250081",
  appId: "1:36828250081:web:82ab5325fa47cb778e9ca0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

