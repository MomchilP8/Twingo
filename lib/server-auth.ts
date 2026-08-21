import 'server-only'
import { cookies, headers } from 'next/headers'
import { adminAuth } from '@/lib/firebase-admin'

export const SESSION_COOKIE = 'twingo_id_token'

// Solo admin: ONLY this email may access the admin console & admin APIs.
export const ALLOWED_ADMIN_EMAIL = 'momchilparpulev20a@gmail.com'

/**
 * Extracts the Firebase ID token from Request headers, next/headers, or cookies.
 */
export async function extractToken(request?: Request): Promise<string | null> {
  // 1. Check Authorization header from passed Request
  if (request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7).trim()
    }
  }

  // 2. Check Authorization header from Next.js headers()
  try {
    const nextHeaders = await headers()
    const authHeader = nextHeaders.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7).trim()
    }
  } catch {
    // headers() might not be available in certain contexts
  }

  // 3. Check session cookie
  try {
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get(SESSION_COOKIE)?.value
    if (cookieToken) return cookieToken
  } catch {
    // cookies() might not be available in certain contexts
  }

  return null
}

/**
 * Verifies that the current request belongs to an authenticated user.
 */
export async function requireUser(request?: Request) {
  const token = await extractToken(request)
  if (!token) throw new Error('UNAUTHENTICATED')
  const decoded = await adminAuth.verifyIdToken(token, true)
  return decoded
}

/**
 * Verifies that the current request belongs strictly to the single allowed admin.
 */
export async function requireAdmin(request?: Request) {
  const token = await extractToken(request)
  if (!token) throw new Error('UNAUTHENTICATED')

  const decoded = await adminAuth.verifyIdToken(token, true)

  const email = decoded.email?.toLowerCase().trim()
  if (email !== ALLOWED_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('FORBIDDEN')
  }

  return decoded
}
