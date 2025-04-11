// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  clientId: "426204756584-du6aigeqfpm4tplqeiilbg5dtsoc9ovm.apps.googleusercontent.com",
  apiKey: "AIzaSyD8I4xQGWGDSTAJihs2RCKRvqHzquaW8h0",
  authDomain: "saviour-app-675e4.firebaseapp.com",
  projectId: "saviour-app-675e4",
  storageBucket: "saviour-app-675e4.appspot.com",
  messagingSenderId: "426204756584",
  appId: "1:426204756584:android:3c67487d483b7f6c8219dd",
  measurementId: "G-5HLXF5GX90",
}

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize Auth
const auth = getAuth(app)

// Initialize Firestore
const db = getFirestore(app)

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider()
googleProvider.addScope("profile")
googleProvider.addScope("email")

export { auth, googleProvider, db }
