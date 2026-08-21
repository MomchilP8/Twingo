import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? process.env.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'twingo-dfd29.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'twingo-dfd29',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'twingo-dfd29.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '498711297685',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:498711297685:web:298199f49f88c88005e59c',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-STDTXLZPPQ',
}

const browserApp = typeof window === 'undefined' ? null : (getApps().length ? getApp() : initializeApp(firebaseConfig))
export const firebaseApp = browserApp as FirebaseApp
export const auth = (browserApp ? getAuth(browserApp) : null) as Auth
export const db = (browserApp ? getFirestore(browserApp) : null) as Firestore
export const authPersistence = browserApp ? setPersistence(auth, browserLocalPersistence) : Promise.resolve()
