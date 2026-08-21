export type Product = {
  id: string
  name: string
  category: string
  brand: string
  priceCents: number
  oldPriceCents?: number
  image?: string
  badge?: string
  description: string
  stock: number
  active: boolean
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export type EcontOffice = {
  id: string | number
  code?: string
  name: string
  city: string
  cityId?: string | number
  postCode?: string
  address: string
  workingHours?: string
}

export type OrderItem = {
  id: string
  name: string
  quantity: number
  priceCents: number
  totalCents?: number
  image?: string
}

export type StoreOrder = {
  id: string
  orderNumber: string
  userId: string
  totalCents: number
  paymentMethod: 'cash_on_delivery' | 'cash'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  orderStatus: OrderStatus
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  shippingMethod: 'econt_office'
  econtOfficeId: string | number
  econtOfficeName: string
  econtOfficeAddress: string
  city: string
  workingHours?: string
  items: OrderItem[]
  createdAt?: { seconds: number; nanoseconds?: number } | string | Date
  updatedAt?: { seconds: number; nanoseconds?: number } | string | Date
}

export type UserProfile = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  role?: 'customer' | 'admin'
  favorites?: string[]
  preferredEcontOffice?: EcontOffice | null
  createdAt?: unknown
  updatedAt?: unknown
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Нова', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' },
  confirmed: { label: 'Потвърдена', color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800' },
  processing: { label: 'Подготвя се', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' },
  shipped: { label: 'Изпратена', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800' },
  delivered: { label: 'Получена', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' },
  cancelled: { label: 'Отказана', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800' },
}

/**
 * Formats price strictly as EUR (€99.99)
 */
export const money = (cents: number) => {
  const value = cents / 100
  return `€${value.toFixed(2)}`
}

export const formatPriceEUR = (amount: number) => {
  return `€${amount.toFixed(2)}`
}
