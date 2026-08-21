import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireAdmin } from '@/lib/server-auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    const data = (await request.json()) as Record<string, unknown>

    const priceCents = Number(data.priceCents)
    const stock = Number(data.stock)
    const oldPriceCents = Number(data.oldPriceCents)

    if (
      !Number.isSafeInteger(priceCents) ||
      priceCents < 0 ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      throw new Error('Невалидна цена или наличност.')
    }

    await adminDb.doc(`products/${id}`).update({
      name: String(data.name ?? '').trim(),
      category: String(data.category ?? '').trim(),
      brand: String(data.brand ?? '').trim(),
      description: String(data.description ?? '').trim(),
      image: String(data.image ?? '').trim(),
      badge: String(data.badge ?? '').trim(),
      priceCents,
      oldPriceCents: Number.isSafeInteger(oldPriceCents) && oldPriceCents > 0 ? oldPriceCents : 0,
      stock,
      active: data.active !== false,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Промяната не беше записана.' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    const { id } = await params
    await adminDb.doc(`products/${id}`).delete()
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Изтриването не е позволено.' }, { status: 403 })
  }
}
