import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { SESSION_COOKIE } from '@/lib/server-auth'

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')?.trim()
    if (!token) {
      return NextResponse.json({ error: 'Липсва токен за вход.' }, { status: 401 })
    }

    try {
      await adminAuth.verifyIdToken(token, true)
    } catch (authError) {
      console.warn('[Session Auth warning]: Token verification failed:', authError)
      return NextResponse.json({ error: 'Невалиден или изтекъл токен.' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, token, cookieOptions)
    return response
  } catch (err) {
    console.error('[Session Error]:', err)
    return NextResponse.json({ error: 'Грешка при създаване на сесия.' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 })
    return response
  } catch (err) {
    console.error('[Session Delete Error]:', err)
    return NextResponse.json({ ok: true })
  }
}
