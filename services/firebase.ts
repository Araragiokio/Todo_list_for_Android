import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8Q5pVUCf_L78pbOoZrPPSdH3QmIW-gSA",
  authDomain: "todo-list-app-8d8f4.firebaseapp.com",
  projectId: "todo-list-app-8d8f4",
  storageBucket: "todo-list-app-8d8f4.firebasestorage.app",
  messagingSenderId: "825421551593",
  appId: "1:825421551593:web:eaab359b8aa57f5d189d78",
  measurementId: "G-DKRRB67ERZ"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);