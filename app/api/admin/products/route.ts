import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/server-auth'

function parseProductPayload(value: unknown) {
  const data = value as Record<string, unknown>
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const category = typeof data.category === 'string' ? data.category.trim() : ''
  const priceCents = Number(data.priceCents)
  const stock = Number(data.stock)
  const oldPriceCents = Number(data.oldPriceCents)

  if (!name || !category || !Number.isSafeInteger(priceCents) || priceCents < 0 || !Number.isSafeInteger(stock) || stock < 0) {
    throw new Error('Моля, попълнете коректно име, категория, цена и наличност.')
  }

  return {
    name,
    category,
    brand: typeof data.brand === 'string' ? data.brand.trim() : '',
    description: typeof data.description === 'string' ? data.description.trim() : '',
    image: typeof data.image === 'string' ? data.image.trim() : '',
    badge: typeof data.badge === 'string' ? data.badge.trim() : '',
    priceCents,
    oldPriceCents: Number.isSafeInteger(oldPriceCents) && oldPriceCents > 0 ? oldPriceCents : 0,
    stock,
    active: data.active !== false,
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request)
    const snapshot = await adminDb.collection('products').orderBy('name').get()
    return NextResponse.json(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    )
  } catch (error) {
    const isAuth = error instanceof Error && error.message === 'UNAUTHENTICATED'
    return NextResponse.json(
      { error: isAuth ? 'Моля, влезте в профила си.' : 'Нямате администраторски права.' },
      { status: isAuth ? 401 : 403 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request)
    const product = parseProductPayload(await request.json())
    const ref = await adminDb.collection('products').add({
      ...product,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id, ...product }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Продуктът не беше създаден.' },
      { status: 400 }
    )
  }
}
