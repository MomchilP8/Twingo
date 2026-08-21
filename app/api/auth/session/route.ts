import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { SESSION_COOKIE } from '@/lib/server-auth'

const cookie = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 7 }

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Липсва токен за вход.' }, { status: 401 })
  try {
    await adminAuth.verifyIdToken(token, true)
    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, token, cookie)
    return response
  } catch { return NextResponse.json({ error: 'Невалиден токен за вход.' }, { status: 401 }) }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { ...cookie, maxAge: 0 })
  return response
}
