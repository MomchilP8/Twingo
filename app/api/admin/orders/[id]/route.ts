import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/server-auth'
import type { OrderStatus } from '@/lib/store-types'

const validStatuses = new Set<OrderStatus>([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const body = await request.json()
    const { orderStatus } = body as { orderStatus: OrderStatus }

    if (!validStatuses.has(orderStatus)) {
      return NextResponse.json({ error: 'Невалиден статус на поръчка.' }, { status: 400 })
    }

    const orderRef = adminDb.doc(`orders/${id}`)
    const snap = await orderRef.get()
    if (!snap.exists) {
      return NextResponse.json({ error: 'Поръчката не съществува.' }, { status: 404 })
    }

    await orderRef.update({
      orderStatus,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true, orderStatus })
  } catch (error) {
    const isAuth = error instanceof Error && error.message === 'UNAUTHENTICATED'
    return NextResponse.json(
      { error: isAuth ? 'Моля, влезте в профила си.' : 'Нямате администраторски права.' },
      { status: isAuth ? 401 : 403 }
    )
  }
}
