// Custom type declarations for Firebase modules
declare module "firebase/app" {
    import { FirebaseApp } from "@firebase/app"
    export { FirebaseApp }
    export function initializeApp(options: any, name?: string): FirebaseApp
  }
  
  declare module "firebase/auth" {
    import { Auth, User, UserCredential } from "@firebase/auth"
    export { Auth, User, UserCredential }
    export function getAuth(app?: any): Auth
    export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>
    export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>
    export function signOut(auth: Auth): Promise<void>
    export function onAuthStateChanged(auth: Auth, nextOrObserver: any, error?: any, completed?: any): () => void
    export class GoogleAuthProvider {
      constructor()
      addScope(scope: string): GoogleAuthProvider
    }
  }
  
  declare module "firebase/firestore" {
    export function getFirestore(app?: any): any
    export function doc(firestore: any, path: string, ...pathSegments: string[]): any
    export function collection(firestore: any, path: string, ...pathSegments: string[]): any
    export function setDoc(reference: any, data: any): Promise<void>
    export function getDoc(reference: any): Promise<any>
    export function serverTimestamp(): any
    export function initializeFirestore(app: any, settings?: any): any
  }
  
  declare module "firebase/storage" {
    export function getStorage(app?: any): any
    export function ref(storage: any, path?: string): any
    export function uploadBytes(reference: any, data: any): Promise<any>
    export function getDownloadURL(reference: any): Promise<string>
  }
  
  declare module "@env" {
    export const FIREBASE_API_KEY: string
    export const FIREBASE_AUTH_DOMAIN: string
    export const FIREBASE_PROJECT_ID: string
    export const FIREBASE_STORAGE_BUCKET: string
    export const FIREBASE_MESSAGING_SENDER_ID: string
    export const FIREBASE_APP_ID: string
  }
  