import { NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { extractToken } from '@/lib/server-auth'
import { PRODUCTS } from '@/lib/products'
import type { OrderStatus } from '@/lib/store-types'

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function POST(request: Request) {
  try {
    const token = await extractToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'Моля, влезте в профила си преди да завършите поръчката.' },
        { status: 401 }
      )
    }

    let decoded: { uid: string; email?: string }
    try {
      decoded = await adminAuth.verifyIdToken(token, true)
    } catch {
      return NextResponse.json(
        { error: 'Сесията ви е изтекла. Моля, влезте отново в профила си.' },
        { status: 401 }
      )
    }

    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Невалидни данни за поръчката.' }, { status: 400 })
    }

    const items = Array.isArray(body.items) ? (body.items as Array<{ id?: string; quantity?: number }>) : []
    const customer = (body.customer as Record<string, unknown>) ?? {}
    const office = (body.econtOffice as Record<string, unknown>) ?? {}

    if (!items.length) {
      return NextResponse.json({ error: 'Количката ви е празна.' }, { status: 400 })
    }

    const firstName = clean(customer.firstName)
    const lastName = clean(customer.lastName)
    const phone = clean(customer.phone)
    const email = clean(customer.email) || clean(decoded.email)

    // Validations
    if (!firstName || firstName.length < 2) {
      return NextResponse.json(
        { error: 'Моля, въведете валидно собствено име (минимум 2 букви).' },
        { status: 400 }
      )
    }
    if (!lastName || lastName.length < 2) {
      return NextResponse.json(
        { error: 'Моля, въведете валидна фамилия (минимум 2 букви).' },
        { status: 400 }
      )
    }
    if (!phone || phone.replace(/\D/g, '').length < 7) {
      return NextResponse.json(
        { error: 'Моля, въведете валиден телефонен номер (напр. 0888 123 456).' },
        { status: 400 }
      )
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Моля, въведете валиден имейл адрес.' },
        { status: 400 }
      )
    }

    const officeName = clean(office.name)
    const officeCity = clean(office.city)
    const officeAddress = clean(office.address)
    const officeId = office.id ?? ''

    if (!officeName || !officeCity) {
      return NextResponse.json(
        { error: 'Моля, изберете конкретен офис на Еконт от списъка.' },
        { status: 400 }
      )
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
        const id = clean(item.id)
        const quantity = Math.max(1, Number(item.quantity) || 1)
        if (!id) continue

        const productRef = adminDb.doc(`products/${id}`)
        const productSnap = await transaction.get(productRef)

        let productName = id
        let priceCents = 0
        let image = ''
        let currentStock = 50

        if (productSnap.exists) {
          const pData = productSnap.data()!
          if (pData.active === false) {
            throw new Error(`Продуктът "${pData.name || id}" вече не е наличен.`)
          }
          productName = clean(pData.name) || id
          priceCents = Number(pData.priceCents) || 0
          image = clean(pData.image)
          currentStock = Number(pData.stock ?? 10)

          if (currentStock < quantity) {
            throw new Error(`Няма достатъчна наличност от "${productName}". Налични: ${currentStock} бр.`)
          }

          transaction.update(productRef, {
            stock: Math.max(0, currentStock - quantity),
            updatedAt: FieldValue.serverTimestamp(),
          })
        } else {
          // Fallback to static catalog definition if not yet created in Firestore
          const staticP = PRODUCTS.find((p) => p.id === id)
          if (staticP) {
            productName = staticP.name
            priceCents = Math.round(staticP.price * 100)
            image = staticP.image
            currentStock = staticP.stock

            transaction.set(productRef, {
              name: staticP.name,
              category: staticP.category,
              brand: staticP.brand,
              priceCents,
              stock: Math.max(0, currentStock - quantity),
              image: staticP.image,
              description: staticP.description,
              badge: staticP.badge || '',
              active: true,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            })
          } else {
            priceCents = 2900
          }
        }

        const itemTotalCents = priceCents * quantity
        calculatedTotalCents += itemTotalCents

        validatedItems.push({
          id,
          name: productName,
          quantity,
          priceCents,
          totalCents: itemTotalCents,
          image,
        })
      }

      if (validatedItems.length === 0) {
        throw new Error('Няма валидни артикули за поръчка.')
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
        workingHours: clean(office.workingHours),
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
      {
        error:
          error instanceof Error
            ? error.message
            : 'Възникна грешка при създаване на поръчката.',
      },
      { status: 400 }
    )
  }
}
