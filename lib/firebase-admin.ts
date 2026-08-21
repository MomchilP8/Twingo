import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function cleanPrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined
  let key = raw.trim()
  // Remove surrounding single or double quotes
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1)
  }
  // Replace literal \n with real newline characters
  key = key.replace(/\\n/g, '\n')
  return key
}

function getFirebaseAdminApp(): App {
  const apps = getApps()
  if (apps.length > 0) {
    return apps[0]
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = cleanPrivateKey(process.env.FIREBASE_PRIVATE_KEY)
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
    'twingo-dfd29'

  if (clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } catch (err) {
      console.error('[Firebase Admin cert error]:', err)
    }
  }

  // Fallback to default or project initialization
  try {
    return initializeApp({ projectId })
  } catch (err) {
    console.error('[Firebase Admin fallback init error]:', err)
    return initializeApp()
  }
}

export const adminApp = getFirebaseAdminApp()
export const adminAuth = getAuth(adminApp)
export const adminDb = getFirestore(adminApp)
