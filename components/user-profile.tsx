'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import {
  Package,
  Heart,
  User,
  MapPin,
  Settings,
  LogOut,
  ChevronLeft,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Search,
  Shield,
  Trash2,
  X,
  Copy,
  Check,
} from 'lucide-react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { sendEmailVerification } from 'firebase/auth'
import { auth, db } from '@/lib/firebase-client'
import { useAuth } from '@/components/auth-provider'
import { money, type Product } from '@/lib/products'
import {
  ORDER_STATUS_LABELS,
  type EcontOffice,
  type OrderStatus,
  type StoreOrder,
  type UserProfile,
} from '@/lib/store-types'

type ProfileTab = 'orders' | 'favorites' | 'personal' | 'delivery' | 'settings'

export function UserProfileDashboard({
  onShop,
  allProducts,
  onAddToCart,
  onOpenProduct,
}: {
  onShop: () => void
  allProducts: Product[]
  onAddToCart: (p: Product) => void
  onOpenProduct: (p: Product) => void
}) {
  const { user, profile, logout, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<ProfileTab>('orders')
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Personal Info Form State
  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [lastName, setLastName] = useState(profile?.lastName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [personalNotice, setPersonalNotice] = useState('')
  const [personalError, setPersonalError] = useState('')

  // Preferred Econt Office State
  const [offices, setOffices] = useState<EcontOffice[]>([])
  const [loadingOffices, setLoadingOffices] = useState(false)
  const [officeSearch, setOfficeSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('Всички градове')
  const [preferredOffice, setPreferredOffice] = useState<EcontOffice | null>(
    profile?.preferredEcontOffice ?? null
  )
  const [savingOffice, setSavingOffice] = useState(false)
  const [officeNotice, setOfficeNotice] = useState('')

  // Settings State
  const [verificationNotice, setVerificationNotice] = useState('')

  // Sync state when profile updates
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName ?? '')
      setLastName(profile.lastName ?? '')
      setPhone(profile.phone ?? '')
      setPreferredOffice(profile.preferredEcontOffice ?? null)
    }
  }, [profile])

  // Real-time Orders Listener for current user
  useEffect(() => {
    if (!auth.currentUser) return
    setLoadingOrders(true)
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: StoreOrder[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            id: docSnap.id,
            orderNumber: data.orderNumber || `TW-${docSnap.id.slice(0, 6)}`,
            userId: data.userId,
            totalCents: data.totalCents ?? Math.round((data.totalPrice ?? 0) * 100),
            paymentMethod: data.paymentMethod ?? 'cash_on_delivery',
            paymentStatus: data.paymentStatus ?? 'pending',
            orderStatus: data.orderStatus ?? 'pending',
            customer: data.customer ?? {
              firstName: data.customerName?.split(' ')[0] || '',
              lastName: data.customerName?.split(' ').slice(1).join(' ') || '',
              email: data.customerEmail || '',
              phone: data.customerPhone || '',
            },
            shippingMethod: data.shippingMethod ?? 'econt_office',
            econtOfficeId: data.econtOfficeId ?? '',
            econtOfficeName: data.econtOfficeName ?? 'Офис на Еконт',
            econtOfficeAddress: data.econtOfficeAddress ?? '',
            city: data.city ?? '',
            workingHours: data.workingHours ?? '',
            items: data.items || data.products || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          }
        })
        setOrders(list)
        setLoadingOrders(false)
      },
      (err) => {
        console.error('Failed to load user orders:', err)
        setLoadingOrders(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Load Econt offices for Preferred Office tab
  useEffect(() => {
    if (activeTab === 'delivery' && offices.length === 0) {
      setLoadingOffices(true)
      fetch('/api/econt/offices')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.offices)) {
            setOffices(data.offices)
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingOffices(false))
    }
  }, [activeTab, offices.length])

  // Filtered offices for selection
  const filteredOffices = useMemo(() => {
    const q = officeSearch.trim().toLowerCase()
    return offices.filter((o) => {
      const matchCity = selectedCity === 'Всички градове' || o.city === selectedCity
      if (!matchCity) return false
      if (!q) return true
      return (
        o.name.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q)
      )
    })
  }, [offices, selectedCity, officeSearch])

  const cities = useMemo(() => {
    const set = new Set(offices.map((o) => o.city))
    return ['Всички градове', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'bg'))]
  }, [offices])

  // Save Personal Info
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser) return
    setSavingPersonal(true)
    setPersonalNotice('')
    setPersonalError('')

    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: auth.currentUser.email,
          updatedAt: new Date(),
        },
        { merge: true }
      )
      await refreshProfile()
      setPersonalNotice('Данните за профила бяха запазени успешно!')
      setTimeout(() => setPersonalNotice(''), 4000)
    } catch (err) {
      setPersonalError(err instanceof Error ? err.message : 'Възникна грешка при запис.')
    } finally {
      setSavingPersonal(false)
    }
  }

  // Save Preferred Econt Office
  const handleSavePreferredOffice = async (office: EcontOffice) => {
    if (!auth.currentUser) return
    setSavingOffice(true)
    setPreferredOffice(office)
    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          preferredEcontOffice: office,
          updatedAt: new Date(),
        },
        { merge: true }
      )
      await refreshProfile()
      setOfficeNotice(`Офис "${office.name}" е запазен като предпочитан!`)
      setTimeout(() => setOfficeNotice(''), 4000)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingOffice(false)
    }
  }

  // Remove Favorite
  const handleRemoveFavorite = async (productId: string) => {
    if (!auth.currentUser) return
    const currentFavorites = profile?.favorites ?? []
    const updated = currentFavorites.filter((id) => id !== productId)
    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        { favorites: updated },
        { merge: true }
      )
      await refreshProfile()
    } catch (err) {
      console.error(err)
    }
  }

  // Send Email Verification
  const handleSendVerification = async () => {
    if (!auth.currentUser) return
    try {
      await sendEmailVerification(auth.currentUser)
      setVerificationNotice('Изпратихме линк за потвърждение на вашия имейл адрес.')
    } catch {
      setVerificationNotice('Неуспешно изпращане. Опитайте отново по-късно.')
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Favorites list products
  const favoriteProducts = useMemo(() => {
    const favIds = profile?.favorites ?? []
    return allProducts.filter((p) => favIds.includes(p.id))
  }, [allProducts, profile?.favorites])

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : user?.displayName || user?.email?.split('@')[0] || 'Потребител'

  const isAdmin = user?.email?.toLowerCase() === 'momchilparpulev20a@gmail.com'

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
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-16">
      {/* Top back button */}
      <button
        onClick={onShop}
        className="mb-6 inline-flex min-h-[40px] items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ChevronLeft size={18} />
        Към магазина
      </button>

      {/* Profile Header Dashboard Card */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* User Avatar */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl sm:text-2xl font-black text-primary-foreground shadow-md">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
                  Здравей, {displayName}!
                </h1>
                {isAdmin ? (
                  <span className="rounded-full bg-accent/20 px-3 py-0.5 text-[11px] font-extrabold text-accent">
                    Администратор
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Клиент
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {isAdmin && (
              <a
                href="/admin"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold text-accent-foreground shadow-xs transition hover:opacity-90 active:scale-95"
              >
                <Shield size={16} />
                Admin Конзола
              </a>
            )}
            <button
              onClick={async () => {
                await logout()
                onShop()
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-destructive/30 px-5 py-2.5 text-xs font-bold text-destructive transition hover:bg-destructive/10 active:scale-95"
            >
              <LogOut size={16} />
              Изход
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="mt-8 flex gap-2 overflow-x-auto border-t border-border pt-4 text-xs sm:text-sm font-bold scrollbar-none">
          {[
            { id: 'orders', label: 'Моите поръчки', icon: <Package size={17} />, count: orders.length },
            { id: 'favorites', label: 'Любими', icon: <Heart size={17} />, count: favoriteProducts.length },
            { id: 'personal', label: 'Данни', icon: <User size={17} /> },
            { id: 'delivery', label: 'Еконт офис', icon: <MapPin size={17} /> },
            { id: 'settings', label: 'Настройки', icon: <Settings size={17} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`flex shrink-0 min-h-[44px] items-center gap-2 rounded-full px-4 sm:px-5 py-2.5 transition ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    activeTab === tab.id
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted-foreground/15 text-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="mt-8">
        {/* ================= TAB 3: Personal Information ================= */}
        {activeTab === 'personal' && (
          <section className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold md:text-2xl">Моите данни</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Управлявайте вашата лична информация и контакти.
              </p>
            </div>

            {personalNotice && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs sm:text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{personalNotice}</span>
              </div>
            )}

            {personalError && (
              <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs sm:text-sm font-semibold text-destructive">
                <AlertCircle size={18} className="shrink-0" />
                <span>{personalError}</span>
              </div>
            )}

            <form
              onSubmit={handleSavePersonal}
              className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Собствено име *
                  </label>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Иван"
                    className="w-full min-h-[48px] rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                    Фамилия *
                  </label>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Иванов"
                    className="w-full min-h-[48px] rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  Телефонен номер * (за доставка с Еконт)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0888 123 456"
                  className="w-full min-h-[48px] rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
                  Имейл адрес (акаунт)
                </label>
                <input
                  disabled
                  value={user?.email || ''}
                  className="w-full min-h-[48px] rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Имейлът е свързан с вашия Firebase профил за сигурност.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="min-h-[48px] w-full sm:w-auto rounded-full bg-primary px-8 py-3 text-xs sm:text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50 active:scale-95 shadow-md"
                >
                  {savingPersonal ? 'Запазване…' : 'Запази промените'}
                </button>
              </div>
            </form>
          </section>
        )}
        {/* ================= TAB 1: My Orders ================= */}
        {activeTab === 'orders' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold md:text-2xl">Моите поръчки</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                История на вашите поръчки с доставка до 2 работни дни до офис на Еконт.
              </p>
            </div>

            {loadingOrders ? (
              <div className="flex min-h-48 items-center justify-center rounded-3xl border border-border bg-card p-12 text-xs sm:text-sm text-muted-foreground">
                Зареждане на поръчките…
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <div className="rounded-full bg-muted p-4 text-muted-foreground">
                  <Package size={36} />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-bold">Все още нямаш направени поръчки.</h3>
                <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground">
                  Разгледай подбраните ни технологични продукти и направи първата си поръчка.
                </p>
                <button
                  onClick={onShop}
                  className="mt-6 min-h-[44px] rounded-full bg-primary px-7 py-3 text-xs sm:text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-95"
                >
                  Пазарувай сега
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => {
                  const statusInfo =
                    ORDER_STATUS_LABELS[order.orderStatus as OrderStatus] || {
                      label: order.orderStatus,
                      color: 'bg-muted text-foreground border-border',
                    }

                  return (
                    <div
                      key={order.id}
                      className="rounded-3xl border border-border bg-card p-5 shadow-xs transition hover:border-accent/40 md:p-6"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="font-extrabold text-foreground">
                              Поръчка #{order.orderNumber}
                            </h3>
                            <span
                              className={`rounded-full border px-3 py-0.5 text-[11px] font-bold ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 md:text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {order.items.length}{' '}
                              {order.items.length === 1 ? 'продукт' : 'продукта'}
                            </p>
                            <p className="text-lg font-black text-foreground">
                              {money(Math.round(order.totalCents / 100))}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="min-h-[40px] rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-muted active:scale-95"
                          >
                            Детайли
                          </button>
                        </div>
                      </div>

                      {/* Delivery & Payment Badges */}
                      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Truck size={15} className="text-accent" />
                          Еконт — {order.econtOfficeName} ({order.city})
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          Наложен платеж
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ================= TAB 2: Favorites ================= */}
        {activeTab === 'favorites' && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold md:text-2xl">Любими продукти</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Всички продукти, които сте запазили.
              </p>
            </div>

            {favoriteProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <div className="rounded-full bg-muted p-4 text-muted-foreground">
                  <Heart size={36} />
                </div>
                <h3 className="mt-4 text-base sm:text-lg font-bold">Все още нямаш любими продукти.</h3>
                <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground">
                  Добави продукти в любими, като натиснеш иконата със сърце върху продуктовите карти.
                </p>
                <button
                  onClick={onShop}
                  className="mt-6 min-h-[44px] rounded-full bg-primary px-7 py-3 text-xs sm:text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-95"
                >
                  Разгледай продуктите
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {favoriteProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group relative rounded-3xl border border-border bg-card p-3 sm:p-4 transition hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <button
                        onClick={() => onOpenProduct(product)}
                        className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-[#edf1f5]"
                      >
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover mix-blend-multiply transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            Няма изображение
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleRemoveFavorite(product.id)}
                        className="absolute right-5 top-5 rounded-full bg-background/90 p-2 text-destructive shadow-xs transition hover:scale-110"
                        title="Премахни от любими"
                      >
                        <Trash2 size={15} />
                      </button>

                      <div className="pt-3">
                        <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground">
                          {product.brand}
                        </p>
                        <h4 className="line-clamp-1 text-xs sm:text-sm font-bold">{product.name}</h4>
                        <p className="mt-1 text-sm font-black text-foreground">
                          {money(product.price)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onAddToCart(product)}
                      className="mt-3 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 active:scale-95"
                    >
                      <ShoppingBag size={14} /> В количката
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        

        {/* ================= TAB 4: Preferred Econt Office ================= */}
        {activeTab === 'delivery' && (
          <section className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold md:text-2xl">Предпочитан офис на Еконт</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Запазете любим офис на Еконт, който автоматично да се зарежда при поръчка.
              </p>
            </div>

            {officeNotice && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs sm:text-sm font-semibold text-emerald-800">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{officeNotice}</span>
              </div>
            )}

            {/* Current Preferred Office */}
            {preferredOffice && (
              <div className="rounded-3xl border-2 border-accent bg-accent/5 p-5 sm:p-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                    Текущ предпочитан офис:
                  </span>
                  <h3 className="mt-1 text-base sm:text-lg font-bold text-foreground">
                    {preferredOffice.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={14} className="text-accent shrink-0" />
                    {preferredOffice.city}, {preferredOffice.address}
                  </p>
                  {preferredOffice.workingHours && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {preferredOffice.workingHours}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Office Picker */}
            <div className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-8">
              <h3 className="text-sm font-bold">Избери друг офис на Еконт:</h3>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    placeholder="Търси град или офис..."
                    value={officeSearch}
                    onChange={(e) => setOfficeSearch(e.target.value)}
                    className="w-full min-h-[48px] rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-xs sm:text-sm focus:border-accent focus:outline-none"
                  />
                </div>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="min-h-[48px] rounded-2xl border border-border bg-background px-4 py-3 text-xs sm:text-sm focus:border-accent focus:outline-none"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-border bg-background p-2">
                {loadingOffices ? (
                  <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground">
                    Зареждане на офиси…
                  </div>
                ) : filteredOffices.length === 0 ? (
                  <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground">
                    Няма намерени офиси.
                  </div>
                ) : (
                  filteredOffices.map((office) => {
                    const isPreferred = preferredOffice?.name === office.name
                    return (
                      <button
                        key={`${office.city}-${office.name}-${office.id}`}
                        type="button"
                        onClick={() => handleSavePreferredOffice(office)}
                        disabled={savingOffice}
                        className={`flex w-full items-start justify-between rounded-xl p-3 text-left transition ${
                          isPreferred
                            ? 'border-2 border-accent bg-accent/10 font-medium'
                            : 'border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-foreground">
                              {office.name}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {office.city}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground">
                            {office.address}
                          </p>
                        </div>
                        {isPreferred ? (
                          <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-white shrink-0">
                            Избран
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-accent hover:underline shrink-0">
                            Запази
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* ================= TAB 5: Settings ================= */}
        {activeTab === 'settings' && (
          <section className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-extrabold md:text-2xl">Настройки на акаунта</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Сигурност и настройки на вашия профил.
              </p>
            </div>

            <div className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h4 className="text-sm font-bold">Имейл верификация</h4>
                  <p className="text-xs text-muted-foreground">
                    {user?.emailVerified
                      ? 'Вашият имейл адрес е потвърден.'
                      : 'Имейл адресът все още не е потвърден.'}
                  </p>
                </div>
                {user?.emailVerified ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    Потвърден
                  </span>
                ) : (
                  <button
                    onClick={handleSendVerification}
                    className="min-h-[40px] rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-muted"
                  >
                    Потвърди имейл
                  </button>
                )}
              </div>

              {verificationNotice && (
                <p className="rounded-2xl bg-accent/10 p-3 text-xs font-semibold text-accent">
                  {verificationNotice}
                </p>
              )}

              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h4 className="text-sm font-bold">Режим на плащане</h4>
                  <p className="text-xs text-muted-foreground">
                    Наложен платеж при получаване от офис на Еконт
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
                  По подразбиране
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-sm font-bold text-destructive">Изход от профила</h4>
                  <p className="text-xs text-muted-foreground">
                    Прекратяване на активната сесия на това устройство.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await logout()
                    onShop()
                  }}
                  className="min-h-[40px] rounded-full border border-destructive/30 px-5 py-2 text-xs font-bold text-destructive transition hover:bg-destructive/10"
                >
                  Изход
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-background p-5 sm:p-8 shadow-2xl">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X size={20} />
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-xl sm:text-2xl font-black">
                Поръчка #{selectedOrder.orderNumber}
              </h3>
              <button
                onClick={() =>
                  copyToClipboard(selectedOrder.orderNumber, 'order-num')
                }
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                title="Копирай номер на поръчка"
              >
                {copiedKey === 'order-num' ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedKey === 'order-num' ? 'Копирано' : 'Копирай'}</span>
              </button>
              <span
                className={`rounded-full border px-3 py-0.5 text-xs font-bold ${
                  ORDER_STATUS_LABELS[selectedOrder.orderStatus as OrderStatus]?.color || 'bg-muted'
                }`}
              >
                {ORDER_STATUS_LABELS[selectedOrder.orderStatus as OrderStatus]?.label ||
                  selectedOrder.orderStatus}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Дата: {formatDate(selectedOrder.createdAt)}
            </p>

            <div className="mt-6 space-y-3 sm:space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Доставка:
                </span>
                <p className="mt-1 text-sm font-bold">
                  Еконт — {selectedOrder.econtOfficeName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedOrder.city}, {selectedOrder.econtOfficeAddress}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Поръчани артикули ({selectedOrder.items.length}):
                </span>
                <div className="mt-2 divide-y divide-border">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between py-2 text-xs sm:text-sm">
                      <div className="pr-2">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Количество: {item.quantity} бр. · {money(item.priceCents)} / бр.
                        </p>
                      </div>
                      <span className="font-black shrink-0">{money(item.priceCents * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-4">
                <div>
                  <p className="text-[11px] text-muted-foreground">Начин на плащане</p>
                  <p className="text-xs sm:text-sm font-bold">Наложен платеж</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Крайна сума</p>
                  <p className="text-lg sm:text-xl font-black text-accent">{money(selectedOrder.totalCents)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="min-h-[44px] rounded-full bg-primary px-7 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-95 shadow-md"
              >
                Затвори
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
