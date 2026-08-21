'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Truck,
  User,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react'
import { auth } from '@/lib/firebase-client'
import {
  money,
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type Product,
  type StoreOrder,
} from '@/lib/store-types'

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  category: 'AirPods',
  brand: 'Apple',
  priceCents: 0,
  oldPriceCents: 0,
  stock: 10,
  description: '',
  image: '',
  badge: '',
  active: true,
}

const ORDER_STATUSES: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: 'Нова' },
  { value: 'confirmed', label: 'Потвърдена' },
  { value: 'processing', label: 'Подготвя се' },
  { value: 'shipped', label: 'Изпратена' },
  { value: 'delivered', label: 'Получена' },
  { value: 'cancelled', label: 'Отказана' },
]

export function AdminConsole() {
  const [tab, setTab] = useState<'orders' | 'products'>('orders')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [editing, setEditing] = useState<Product | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [errorNotice, setErrorNotice] = useState('')
  const [loading, setLoading] = useState(true)

  // Filters
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [orderQuery, setOrderQuery] = useState('')
  const [productQuery, setProductQuery] = useState('')

  const getHeaders = async () => {
    const token = await auth.currentUser?.getIdToken(true)
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    }
  }

  const load = async () => {
    setLoading(true)
    setErrorNotice('')
    try {
      const headers = await getHeaders()
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch('/api/admin/products', { headers }),
        fetch('/api/admin/orders', { headers }),
      ])

      if (!productsResponse.ok || !ordersResponse.ok) {
        throw new Error('Сесията няма администраторски права. Влезте с momchilparpulev20a@gmail.com.')
      }

      setProducts(await productsResponse.json())
      setOrders(await ordersResponse.json())
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Грешка при зареждане на данните.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, order) => sum + (order.totalCents || 0), 0)
    const totalStock = products.reduce((sum, product) => sum + (product.stock || 0), 0)
    const activeCount = products.filter((p) => p.active).length
    return {
      revenue: totalRev,
      ordersCount: orders.length,
      stock: totalStock,
      activeProducts: activeCount,
    }
  }, [orders, products])

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchStatus = orderFilter === 'all' || o.orderStatus === orderFilter
      if (!matchStatus) return false
      if (!orderQuery) return true
      const q = orderQuery.toLowerCase()
      return (
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customer?.firstName?.toLowerCase().includes(q) ||
        o.customer?.lastName?.toLowerCase().includes(q) ||
        o.customer?.email?.toLowerCase().includes(q) ||
        o.customer?.phone?.includes(q) ||
        o.econtOfficeName?.toLowerCase().includes(q) ||
        o.city?.toLowerCase().includes(q)
      )
    })
  }, [orders, orderFilter, orderQuery])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!productQuery) return products
    const q = productQuery.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q)
    )
  }, [products, productQuery])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSaveProduct = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    const isNew = editing.id === 'new'
    setErrorNotice('')

    try {
      const headers = await getHeaders()
      const response = await fetch(
        isNew ? '/api/admin/products' : `/api/admin/products/${editing.id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers,
          body: JSON.stringify(editing),
        }
      )

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Продуктът не беше записан.')
      }

      setEditing(null)
      setNotice('Продуктът беше записан успешно!')
      setTimeout(() => setNotice(''), 4000)
      load()
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Грешка при запис.')
    }
  }

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Сигурни ли сте, че искате да изтриете продукта "${name}"?`)) return
    try {
      const headers = await getHeaders()
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers,
      })
      if (!response.ok) throw new Error('Продуктът не беше изтрит.')
      setNotice(`Продуктът "${name}" беше изтрит.`)
      setTimeout(() => setNotice(''), 4000)
      load()
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Грешка при изтриване.')
    }
  }

  const handleUpdateOrderStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      const headers = await getHeaders()
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ orderStatus: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Статусът не беше обновен.')
      }

      setOrders((curr) =>
        curr.map((o) => (o.id === id ? { ...o, orderStatus: newStatus } : o))
      )
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder((curr) => (curr ? { ...curr, orderStatus: newStatus } : null))
      }
      setNotice('Статусът на поръчката беше обновен!')
      setTimeout(() => setNotice(''), 3000)
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Грешка при смяна на статус.')
    }
  }

  const formatDate = (raw: unknown) => {
    if (!raw) return ''
    if (typeof raw === 'object' && 'seconds' in (raw as Record<string, unknown>)) {
      return new Date(Number((raw as Record<string, unknown>).seconds) * 1000).toLocaleDateString(
        'bg-BG',
        { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      )
    }
    return String(raw)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3.5 sm:py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="/"
              className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-bold transition hover:bg-muted"
            >
              <ArrowLeft size={14} /> Към магазина
            </a>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent">
                <Shield size={16} />
              </span>
              <span className="text-xs sm:text-sm font-black tracking-tight">TWINGO Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-bold transition hover:bg-muted"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Обнови</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 md:px-8">
        {/* Title & Account */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
            momchilparpulev20a@gmail.com
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            Управление на магазина
          </h1>
        </div>

        {/* Alerts */}
        {notice && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs sm:text-sm font-bold text-emerald-800">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs sm:text-sm font-bold text-destructive">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <MetricCard
            label="Общ оборот"
            value={money(stats.revenue)}
            sub="Наложен платеж"
          />
          <MetricCard
            label="Поръчки"
            value={String(stats.ordersCount)}
            sub="До офис на Еконт"
          />
          <MetricCard
            label="Наличности"
            value={`${stats.stock} бр.`}
            sub="Общо на склад"
          />
          <MetricCard
            label="Активни"
            value={`${stats.activeProducts} / ${products.length}`}
            sub="Видими в магазина"
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-2 border-b border-border pb-px text-xs sm:text-sm font-bold">
          <button
            onClick={() => setTab('orders')}
            className={`flex min-h-[44px] items-center gap-2 border-b-2 px-5 py-3 transition ${
              tab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Truck size={17} />
            Поръчки ({orders.length})
          </button>
          <button
            onClick={() => setTab('products')}
            className={`flex min-h-[44px] items-center gap-2 border-b-2 px-5 py-3 transition ${
              tab === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package size={17} />
            Продукти ({products.length})
          </button>
        </div>

        {/* ================= TAB 1: Orders Management ================= */}
        {tab === 'orders' && (
          <div className="mt-6 space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  placeholder="Търси по #TW, клиент, телефон, офис..."
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Статус:</span>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="min-h-[44px] rounded-2xl border border-border bg-background px-3 py-2 text-xs font-bold focus:border-accent focus:outline-none"
                >
                  <option value="all">Всички статуси</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Orders Presentation: Mobile Cards (< md) + Desktop Table (>= md) */}
            {loading ? (
              <div className="rounded-3xl border border-border p-12 text-center text-xs sm:text-sm text-muted-foreground">
                Зареждане на поръчки…
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-xs sm:text-sm text-muted-foreground">
                Няма намерени поръчки.
              </div>
            ) : (
              <>
                {/* Mobile Cards View (< md) */}
                <div className="grid gap-3 md:hidden">
                  {filteredOrders.map((order) => {
                    const statusConfig =
                      ORDER_STATUS_LABELS[order.orderStatus as OrderStatus] || {
                        label: order.orderStatus,
                        color: 'bg-muted',
                      }

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-3xl border border-border bg-card p-4 shadow-xs space-y-3 cursor-pointer transition hover:border-accent/50"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                            }}
                            className="font-black text-foreground hover:text-accent flex items-center gap-1"
                          >
                            <span>#{order.orderNumber}</span>
                            <ChevronRight size={15} className="text-accent" />
                          </button>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {order.customer?.firstName} {order.customer?.lastName} · {order.customer?.phone}
                          </p>
                          <p className="text-accent font-medium">
                            Еконт: {order.econtOfficeName} ({order.city})
                          </p>
                          <p>{formatDate(order.createdAt)}</p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                          <span className="text-muted-foreground">
                            {order.items.length} {order.items.length === 1 ? 'продукт' : 'продукта'}
                          </span>
                          <span className="text-sm font-black text-foreground">
                            {money(order.totalCents)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                        <tr>
                          <th className="p-4">Поръчка</th>
                          <th className="p-4">Клиент</th>
                          <th className="p-4">Офис на Еконт</th>
                          <th className="p-4">Артикули</th>
                          <th className="p-4">Сума</th>
                          <th className="p-4">Статус</th>
                          <th className="p-4 text-right">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredOrders.map((order) => {
                          const statusConfig =
                            ORDER_STATUS_LABELS[order.orderStatus as OrderStatus] || {
                              label: order.orderStatus,
                              color: 'bg-muted',
                            }

                          return (
                            <tr
                              key={order.id}
                              className="transition hover:bg-muted/30 cursor-pointer"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <td className="p-4 align-top">
                                <span className="font-black text-foreground hover:text-accent">
                                  #{order.orderNumber}
                                </span>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {formatDate(order.createdAt)}
                                </p>
                              </td>

                              <td className="p-4 align-top">
                                <p className="font-bold text-foreground">
                                  {order.customer?.firstName} {order.customer?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {order.customer?.phone}
                                </p>
                              </td>

                              <td className="p-4 align-top">
                                <p className="font-bold text-accent">
                                  {order.econtOfficeName}
                                </p>
                                <p className="text-xs text-muted-foreground">{order.city}</p>
                              </td>

                              <td className="p-4 align-top">
                                <span className="text-xs font-semibold">
                                  {order.items.length} {order.items.length === 1 ? 'продукт' : 'продукта'}
                                </span>
                              </td>

                              <td className="p-4 align-top">
                                <span className="font-black text-foreground">
                                  {money(order.totalCents)}
                                </span>
                              </td>

                              <td className="p-4 align-top" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={order.orderStatus}
                                  onChange={(e) =>
                                    handleUpdateOrderStatus(
                                      order.id,
                                      e.target.value as OrderStatus
                                    )
                                  }
                                  className={`rounded-xl border p-1.5 text-xs font-bold focus:outline-none ${statusConfig.color}`}
                                >
                                  {ORDER_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="p-4 align-top text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedOrder(order)
                                  }}
                                  className="rounded-full border border-border px-3 py-1 text-xs font-bold hover:bg-muted"
                                >
                                  Детайли
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= TAB 2: Products Management ================= */}
        {tab === 'products' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  placeholder="Търси продукт по име, категория..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full min-h-[44px] rounded-2xl border border-border bg-background py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <button
                onClick={() => setEditing({ id: 'new', ...emptyProduct })}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
              >
                <Plus size={16} /> Нов продукт
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-border p-12 text-center text-xs sm:text-sm text-muted-foreground">
                Зареждане на продукти…
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-12 text-center text-xs sm:text-sm text-muted-foreground">
                Няма намерени продукти.
              </div>
            ) : (
              <>
                {/* Mobile Products Cards (< md) */}
                <div className="grid gap-3 md:hidden">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-3xl border border-border bg-card p-4 shadow-xs flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 rounded-2xl bg-[#edf1f5] overflow-hidden shrink-0">
                          {product.image && (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover mix-blend-multiply"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold">{product.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {product.category} · {product.brand}
                          </p>
                          <p className="text-xs font-black text-foreground">
                            {money(product.priceCents)} ·{' '}
                            <span
                              className={
                                product.stock > 0 ? 'text-emerald-600' : 'text-destructive'
                              }
                            >
                              {product.stock} бр.
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(product)}
                          className="min-h-[36px] rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted"
                        >
                          Редактирай
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Products Table (>= md) */}
                <div className="hidden md:block overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/60 text-xs font-semibold text-muted-foreground">
                        <tr>
                          <th className="p-4">Продукт</th>
                          <th className="p-4">Категория / Марка</th>
                          <th className="p-4">Цена</th>
                          <th className="p-4">Наличност</th>
                          <th className="p-4">Статус</th>
                          <th className="p-4 text-right">Действия</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="transition hover:bg-muted/30">
                            <td className="p-4">
                              <p className="font-bold text-foreground">{product.name}</p>
                              {product.badge && (
                                <span className="mt-1 inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                                  {product.badge}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              <span>{product.category}</span>
                              {product.brand && <span> · {product.brand}</span>}
                            </td>
                            <td className="p-4 font-black text-foreground">
                              {money(product.priceCents)}
                              {product.oldPriceCents ? (
                                <span className="ml-2 text-xs text-muted-foreground line-through">
                                  {money(product.oldPriceCents)}
                                </span>
                              ) : null}
                            </td>
                            <td className="p-4">
                              <span
                                className={`font-bold ${
                                  product.stock > 0 ? 'text-emerald-600' : 'text-destructive'
                                }`}
                              >
                                {product.stock} бр.
                              </span>
                            </td>
                            <td className="p-4">
                              {product.active ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                  <Eye size={14} /> Активен
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                  <EyeOff size={14} /> Скрит
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setEditing(product)}
                                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold transition hover:bg-muted"
                                >
                                  Редактирай
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id, product.name)}
                                  className="rounded-xl border border-destructive/30 p-1.5 text-destructive transition hover:bg-destructive/10"
                                  title="Изтрий"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ================= ORDER DETAILS MODAL ================= */}
        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background p-5 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-black">
                    Поръчка #{selectedOrder.orderNumber}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(selectedOrder.orderNumber, 'order-id')}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                    title="Копирай номер на поръчка"
                  >
                    {copiedKey === 'order-id' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'order-id' ? 'Копирано' : 'Копирай'}</span>
                  </button>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 1. ORDER INFORMATION */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  1. Информация за поръчката
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Дата и час:</span>
                    <p className="font-bold text-foreground">
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Метод на плащане:</span>
                    <p className="font-bold text-foreground">Наложен платеж</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Доставка:</span>
                    <p className="font-bold text-foreground">Еконт — офис</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Крайна сума:</span>
                    <p className="text-base font-black text-accent">
                      {money(selectedOrder.totalCents)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Смяна на статус:</span>
                    <select
                      value={selectedOrder.orderStatus}
                      onChange={(e) =>
                        handleUpdateOrderStatus(
                          selectedOrder.id,
                          e.target.value as OrderStatus
                        )
                      }
                      className="mt-1 block w-full rounded-xl border border-border bg-background p-2 text-xs font-bold"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. CUSTOMER INFORMATION */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  2. Данни за клиента
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-muted-foreground" />
                      <span className="font-bold text-foreground text-sm">
                        {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-muted-foreground" />
                      <span>{selectedOrder.customer?.email}</span>
                    </div>
                    {selectedOrder.customer?.email && (
                      <button
                        onClick={() =>
                          copyToClipboard(selectedOrder.customer.email!, 'customer-email')
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                      >
                        {copiedKey === 'customer-email' ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedKey === 'customer-email' ? 'Копиран' : 'Копирай'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="text-muted-foreground" />
                      <span className="font-bold">{selectedOrder.customer?.phone}</span>
                    </div>
                    {selectedOrder.customer?.phone && (
                      <button
                        onClick={() =>
                          copyToClipboard(selectedOrder.customer.phone!, 'customer-phone')
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                      >
                        {copiedKey === 'customer-phone' ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedKey === 'customer-phone' ? 'Копиран' : 'Копирай'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. PRODUCT INFORMATION */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  3. Поръчани продукти ({selectedOrder.items.length})
                </span>
                <div className="divide-y divide-border">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover mix-blend-multiply"
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.quantity} бр. · {money(item.priceCents)} / бр.
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-foreground">
                        {money(item.priceCents * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. DELIVERY INFORMATION */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-2 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  4. Доставка до офис на Еконт
                </span>
                <p className="text-sm font-black text-foreground">
                  {selectedOrder.econtOfficeName}
                </p>
                <p className="text-muted-foreground">
                  <MapPin size={13} className="inline mr-1 text-accent" />
                  {selectedOrder.city}, {selectedOrder.econtOfficeAddress}
                </p>
                {selectedOrder.workingHours && (
                  <p className="text-[11px] text-muted-foreground">
                    <Clock size={13} className="inline mr-1" />
                    {selectedOrder.workingHours}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="min-h-[44px] rounded-full bg-primary px-8 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition hover:opacity-90"
                >
                  Затвори детайлите
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product Edit Modal */}
        {editing && (
          <ProductEditorModal
            value={editing}
            onChange={setEditing}
            onClose={() => setEditing(null)}
            onSave={handleSaveProduct}
          />
        )}
      </main>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-xs">
      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl sm:text-2xl font-black text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function ProductEditorModal({
  value,
  onChange,
  onClose,
  onSave,
}: {
  value: Product
  onChange: (product: Product) => void
  onClose: () => void
  onSave: (event: FormEvent) => void
}) {
  const updateField = (key: keyof Product, val: string | number | boolean) => {
    onChange({
      ...value,
      [key]:
        key === 'priceCents' || key === 'stock' || key === 'oldPriceCents'
          ? Number(val) || 0
          : val,
    })
  }

  const inputClass =
    'w-full min-h-[48px] rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={onSave}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background p-5 sm:p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg sm:text-xl font-bold">
            {value.id === 'new' ? 'Добави нов продукт' : 'Редактирай продукт'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">
              Име на продукта *
            </label>
            <input
              required
              value={value.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="AirPods Pro (2-ро поколение)"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Категория *
              </label>
              <input
                required
                value={value.category}
                onChange={(e) => updateField('category', e.target.value)}
                placeholder="AirPods, Слушалки, Зарядни..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Марка
              </label>
              <input
                value={value.brand || ''}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder="Apple, Bose, JBL..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Цена в евроцентове (напр. 27900 за €279.00) *
              </label>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={value.priceCents}
                onChange={(e) => updateField('priceCents', e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Визуализира се като: <b>{money(value.priceCents)}</b>
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Стара цена в центове (незадължително)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={value.oldPriceCents || ''}
                onChange={(e) => updateField('oldPriceCents', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Наличност (бройки) *
              </label>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={value.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-muted-foreground">
                Етикет / Бадж (напр. Бестселър, Ново)
              </label>
              <input
                value={value.badge || ''}
                onChange={(e) => updateField('badge', e.target.value)}
                placeholder="Бестселър"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">
              URL на изображение
            </label>
            <input
              type="url"
              value={value.image || ''}
              onChange={(e) => updateField('image', e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-muted-foreground">
              Описание на продукта
            </label>
            <textarea
              rows={3}
              value={value.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Подробно описание на функционалностите..."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 pt-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={value.active}
              onChange={(e) => updateField('active', e.target.checked)}
              className="h-4 w-4 rounded-sm border-border text-accent focus:ring-accent"
            />
            <span>Активен и видим за клиентите в магазина</span>
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-full border border-border px-6 py-2.5 text-xs sm:text-sm font-bold transition hover:bg-muted"
          >
            Отказ
          </button>
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-8 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-95 shadow-md"
          >
            <Save size={16} /> Запиши продукта
          </button>
        </div>
      </form>
    </div>
  )
}
