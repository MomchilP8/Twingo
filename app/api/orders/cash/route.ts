import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { extractToken } from '@/lib/server-auth'
import type { OrderStatus } from '@/lib/store-types'

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function POST(request: Request) {
  try {
    const token = await extractToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Влезте в профила си преди поръчка.' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token, true)
    const body = await request.json() as {
      items?: Array<{ id?: string; quantity?: number }>
      customer?: {
        firstName?: string
        lastName?: string
        phone?: string
        email?: string
      }
      econtOffice?: {
        id?: string | number
        name?: string
        city?: string
        address?: string
        workingHours?: string
      }
    }

    const items = Array.isArray(body.items) ? body.items : []
    const customer = body.customer ?? {}
    const office = body.econtOffice ?? {}

    if (!items.length) {
      return NextResponse.json({ error: 'Количката е празна.' }, { status: 400 })
    }

    const firstName = text(customer.firstName)
    const lastName = text(customer.lastName)
    const phone = text(customer.phone)
    const email = text(customer.email) || text(decoded.email)

    if (!firstName || !lastName || !phone || !email) {
      return NextResponse.json({ error: 'Моля, попълнете всички данни за клиента (Име, Фамилия, Телефон, Имейл).' }, { status: 400 })
    }

    const officeName = text(office.name)
    const officeCity = text(office.city)
    const officeAddress = text(office.address)
    const officeId = office.id ?? ''

    if (!officeName || !officeCity) {
      return NextResponse.json({ error: 'Моля, изберете конкретен офис на Еконт от списъка.' }, { status: 400 })
    }

    const orderRef = adminDb.collection('orders').doc()
    const orderNumber = `TW-${Math.floor(100000 + Math.random() * 900000)}`

    let calculatedTotalCents = 0
    const validatedItems: Array<{
      id: string
      name: string
      quantity: number
      priceCents: number
      totalCents: number
      image?: string
    }> = []

    await adminDb.runTransaction(async (transaction) => {
      for (const item of items) {
        const id = text(item.id)
        const quantity = Number(item.quantity) || 1
        if (!id || quantity < 1) {
          throw new Error('Невалиден артикул в количката.')
        }

        const productRef = adminDb.doc(`products/${id}`)
        const productSnap = await transaction.get(productRef)

        if (!productSnap.exists) {
          // If not in firestore yet, check if product is valid
          throw new Error(`Продуктът не е намерен в базата.`)
        }

        const product = productSnap.data()!
        if (product.active === false) {
          throw new Error(`Продуктът "${product.name || id}" вече не е наличен.`)
        }

        const currentStock = Number(product.stock ?? 0)
        if (currentStock < quantity) {
          throw new Error(`Няма достатъчна наличност от "${product.name}". Налични: ${currentStock} бр.`)
        }

        // Deduct stock in transaction
        transaction.update(productRef, {
          stock: currentStock - quantity,
          updatedAt: FieldValue.serverTimestamp(),
        })

        const priceCents = Number(product.priceCents ?? 0)
        const itemTotalCents = priceCents * quantity
        calculatedTotalCents += itemTotalCents

        validatedItems.push({
          id,
          name: text(product.name),
          quantity,
          priceCents,
          totalCents: itemTotalCents,
          image: text(product.image),
        })
      }

      const initialStatus: OrderStatus = 'pending'

      transaction.set(orderRef, {
        orderId: orderRef.id,
        orderNumber,
        userId: decoded.uid,
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        customerPhone: phone,
        customer: {
          firstName,
          lastName,
          email,
          phone,
        },
        products: validatedItems,
        items: validatedItems,
        totalPrice: calculatedTotalCents / 100,
        totalCents: calculatedTotalCents,
        currency: 'EUR',
        paymentMethod: 'cash_on_delivery',
        paymentStatus: 'pending',
        shippingMethod: 'econt_office',
        econtOfficeId: officeId,
        econtOfficeName: officeName,
        econtOfficeAddress: officeAddress || officeName,
        city: officeCity,
        workingHours: text(office.workingHours),
        orderStatus: initialStatus,
        stockReserved: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    return NextResponse.json(
      {
        ok: true,
        orderId: orderRef.id,
        orderNumber,
        totalCents: calculatedTotalCents,
        message: 'Поръчката е приета успешно!',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Create Order Error]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Поръчката не можа да бъде създадена.' },
      { status: 400 }
    )
  }
}
