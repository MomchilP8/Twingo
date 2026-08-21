import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/server-auth'

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const snapshot = await adminDb
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json(orders)
  } catch (error) {
    const isAuth = error instanceof Error && error.message === 'UNAUTHENTICATED'
    return NextResponse.json(
      { error: isAuth ? 'Моля, влезте като администратор.' : 'Нямате администраторски права.' },
      { status: isAuth ? 401 : 403 }
    )
  }
}
