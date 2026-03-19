// src/firebase.js
// ⚠️  Replace these values with your own Firebase project credentials
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD_rhD1TqOXkkAm4_8cIbHHItbPrmRu00I",
  authDomain: "nutrition-91783.firebaseapp.com",
  projectId: "nutrition-91783",
  storageBucket: "nutrition-91783.firebasestorage.app",
  messagingSenderId: "1027847645875",
  appId: "1:1027847645875:web:0d62538af9f2bcdfe75ec6"
};


const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
