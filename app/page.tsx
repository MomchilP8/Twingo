'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
  Zap,
  Sparkles,
  Shield,
  FileText,
  Mail,
  Phone,
} from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { CATEGORIES, filterProducts, money, PRODUCTS, type Product } from '@/lib/products'
import { db } from '@/lib/firebase-client'
import { useAuth } from '@/components/auth-provider'
import { Navbar } from '@/components/navbar'
import { LoginModal } from '@/components/login-modal'
import { CheckoutForm } from '@/components/checkout-form'
import { AboutModal } from '@/components/about-modal'
import { LegalModal } from '@/components/legal-modal'
import { UserProfileDashboard } from '@/components/user-profile'

export default function Page() {
  const { user, profile, loading: authLoading, toggleFavorite } = useAuth()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [view, setView] = useState<'shop' | 'profile'>('shop')
  const [category, setCategory] = useState('Всички')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<Product[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string
    officeName: string
    total: number
  } | null>(null)

  // Real-time listener for products from Firestore
  useEffect(() => {
    setLoadingProducts(true)
    const fallback = () => {
      setProducts(PRODUCTS.map((p) => ({ ...p, stock: Math.max(1, p.stock) })))
      setLoadingProducts(false)
    }

    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        if (snapshot.empty) {
          fallback()
          return
        }

        const mapped: (Product | null)[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          const staticFallback = PRODUCTS.find((p) => p.id === docSnap.id)
          const image = String(data.image ?? '') || staticFallback?.image || ''
          if (!image) return null

          return {
            id: docSnap.id,
            name: String(data.name ?? ''),
            category: String(data.category ?? 'Други'),
            brand: String(data.brand ?? ''),
            price: Number(data.priceCents ?? 0) / 100,
            oldPrice: data.oldPriceCents ? Number(data.oldPriceCents) / 100 : undefined,
            image,
            badge: data.badge ? String(data.badge) : undefined,
            description: String(data.description ?? ''),
            stock: Number(data.stock ?? 0),
          }
        })

        const activeList = mapped.filter(
          (p): p is Product => p !== null && p.stock > 0
        )
        setProducts(activeList.length ? activeList : PRODUCTS)
        setLoadingProducts(false)
      },
      () => {
        fallback()
      }
    )

    return () => unsubscribe()
  }, [])

  // Lock scroll when mobile menu is active
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  // Filtered Products
  const filtered = useMemo(
    () => filterProducts(products, category, query),
    [products, category, query]
  )

  const userFavorites = profile?.favorites ?? []
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)
  const isAdmin = user?.email?.toLowerCase() === 'momchilparpulev20a@gmail.com'

  const handleFavoriteClick = async (productId: string) => {
    if (!user) {
      setLoginOpen(true)
      return
    }
    await toggleFavorite(productId)
  }

  const addToCart = (product: Product) => {
    setCart((prev) => [...prev, product])
    setCartOpen(true)
  }

  const navigateToShop = () => {
    setView('shop')
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const focusSearch = () => {
    setView('shop')
    setMenuOpen(false)
    setTimeout(() => {
      const searchInput = document.getElementById('search-input')
      searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      searchInput?.focus()
    }, 150)
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Зареждане на TWINGO…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Top Announcement Bar */}
      <div className="bg-primary px-4 py-2 text-center text-[11px] sm:text-xs font-semibold tracking-wide text-primary-foreground">
        <span>Безплатна доставка над €80 · Бърза доставка до 2 работни дни до офис на Еконт · Наложен платеж</span>
      </div>

      {/* Simplified Navbar */}
      <Navbar
        cartCount={cart.length}
        favoritesCount={userFavorites.length}
        isMenuOpen={menuOpen}
        onMenuChange={setMenuOpen}
        onShop={navigateToShop}
        onSearch={focusSearch}
        onAbout={() => setAboutOpen(true)}
        onAccount={() => {
          if (user) setView('profile')
          else setLoginOpen(true)
        }}
        onFavorites={() => {
          if (user) setView('profile')
          else setLoginOpen(true)
        }}
        onCart={() => setCartOpen(true)}
        authenticated={Boolean(user)}
        isAdmin={isAdmin}
      />

      {/* ================= MAIN VIEW: Profile or Shop ================= */}
      {view === 'profile' ? (
        <UserProfileDashboard
          onShop={navigateToShop}
          allProducts={products}
          onAddToCart={addToCart}
          onOpenProduct={setSelectedProduct}
        />
      ) : (
        <main id="top">
          {/* Hero Section */}
          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:py-14 md:grid-cols-[1fr_1.1fr] md:items-center md:px-8 md:py-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-accent">
                <Sparkles size={14} /> Подбрана електроника
              </div>
              <h1 className="mt-4 text-balance text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
                Технология,<br />
                <span className="text-accent">която е с теб.</span>
              </h1>
              <p className="mt-5 max-w-md text-sm sm:text-base leading-relaxed text-muted-foreground md:text-lg">
                Оригинални слушалки, смарт аксесоари и зарядни устройства. Бърза доставка до 2 работни дни до избран офис на Еконт с опция за преглед и наложен платеж.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-lg transition hover:opacity-90 active:scale-95"
                >
                  Пазарувай сега <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setAboutOpen(true)}
                  className="min-h-[48px] rounded-full border border-border px-6 py-3.5 text-xs sm:text-sm font-bold transition hover:bg-muted active:scale-95"
                >
                  Защо Twingo?
                </button>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#f0f4f8] shadow-sm">
              <Image
                src={products[0]?.image || PRODUCTS[0].image}
                alt="TWINGO Технологични продукти"
                fill
                priority
                className="object-cover mix-blend-multiply"
              />
              <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 rounded-2xl bg-background/95 p-3.5 sm:p-4 shadow-lg backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ТОП ПРОДУКТ</p>
                <p className="text-xs sm:text-sm font-black text-foreground">{products[0]?.name || PRODUCTS[0].name}</p>
                <p className="mt-0.5 text-xs sm:text-sm font-black text-accent">
                  {money(products[0]?.price || PRODUCTS[0].price)}
                </p>
              </div>
            </div>
          </section>

          {/* Categories Pills Bar */}
          <section className="border-y border-border bg-muted/40 py-5">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={`shrink-0 min-h-[38px] rounded-full border px-4 sm:px-5 py-1.5 text-xs font-bold transition ${
                      category === item
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border bg-background text-foreground hover:border-foreground'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Products & Search Section */}
          <section id="products-section" className="mx-auto max-w-7xl px-4 py-12 sm:py-16 md:px-8 md:py-24">
            {/* Header & Search Bar */}
            <div className="mb-8 sm:mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Каталог продукти
                </span>
                <h2 className="mt-1 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight">
                  {category === 'Всички' ? 'Всички продукти' : category}
                </h2>
                {query && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Намерени {filtered.length} {filtered.length === 1 ? 'продукт' : 'продукта'} за &quot;{query}&quot;
                  </p>
                )}
              </div>

              {/* Live Search Input */}
              <div className="relative w-full md:w-80">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  id="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Търси по име, марка..."
                  className="w-full min-h-[48px] rounded-full border border-border bg-background py-3 pl-11 pr-10 text-xs sm:text-sm focus:border-accent focus:outline-none shadow-xs transition"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Product Grid */}
            {loadingProducts ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-8 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="animate-pulse space-y-3 rounded-3xl border border-border p-4">
                    <div className="aspect-square rounded-2xl bg-muted" />
                    <div className="h-4 w-2/3 rounded-sm bg-muted" />
                    <div className="h-4 w-1/3 rounded-sm bg-muted" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card p-12 sm:p-16 text-center">
                <Search size={36} className="text-muted-foreground" />
                <h3 className="mt-4 text-lg sm:text-xl font-bold">Няма намерени продукти.</h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Опитайте с друго търсене или изчистете филтрите.
                </p>
                <button
                  onClick={() => {
                    setQuery('')
                    setCategory('Всички')
                  }}
                  className="mt-6 min-h-[40px] rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground active:scale-95"
                >
                  Изчисти търсенето
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14">
                {filtered.map((product) => {
                  const isFavorite = userFavorites.includes(product.id)

                  return (
                    <article key={product.id} className="group flex flex-col justify-between">
                      <div>
                        {/* Image & Badges */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[#edf1f5] p-3 sm:p-4 transition-all duration-300 group-hover:shadow-md">
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="relative block h-full w-full focus:outline-none"
                          >
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover mix-blend-multiply transition duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                Няма изображение
                              </span>
                            )}
                          </button>

                          {/* Heart Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFavoriteClick(product.id)
                            }}
                            aria-label="Любими"
                            className="absolute right-3 top-3 rounded-full bg-background/90 p-2 sm:p-2.5 shadow-xs backdrop-blur-xs transition hover:scale-110 active:scale-90"
                          >
                            <Heart
                              size={16}
                              className={
                                isFavorite ? 'fill-red-500 text-red-500' : 'text-foreground'
                              }
                            />
                          </button>

                          {/* Badge */}
                          {product.badge && (
                            <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] font-black text-accent-foreground shadow-xs">
                              {product.badge}
                            </span>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="pt-3 sm:pt-4">
                          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {product.brand} · {product.category}
                          </p>
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="mt-1 text-left text-xs sm:text-sm md:text-base font-bold leading-snug transition hover:text-accent line-clamp-2"
                          >
                            {product.name}
                          </button>

                          {/* Price */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm sm:text-base md:text-lg font-black text-foreground">
                              {money(product.price)}
                            </span>
                            {product.oldPrice && (
                              <span className="text-xs text-muted-foreground line-through">
                                {money(product.oldPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => addToCart(product)}
                        className="mt-3 sm:mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-border py-2.5 text-xs font-bold transition hover:bg-primary hover:text-primary-foreground shadow-2xs active:scale-95"
                      >
                        <ShoppingBag size={15} /> Добави в количката
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          {/* Why Twingo Section */}
          <section id="why" className="border-y border-border bg-primary text-primary-foreground">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:py-16 md:px-8 md:py-24">
              <div className="max-w-xl">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  Защо Twingo?
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight">
                  Технология без компромиси.
                </h2>
              </div>

              <div className="mt-10 sm:mt-12 grid gap-6 sm:gap-8 md:grid-cols-3">
                <div className="rounded-3xl bg-white/5 p-6 backdrop-blur-xs">
                  <div className="mb-4 inline-flex rounded-2xl bg-accent/20 p-3 text-accent">
                    <Truck size={24} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">Доставка до 2 работни дни</h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-primary-foreground/75">
                    Всички поръчки се обработват веднага и пътуват от България с бърза доставка до избран от вас офис на Еконт.
                  </p>
                </div>

                <div className="rounded-3xl bg-white/5 p-6 backdrop-blur-xs">
                  <div className="mb-4 inline-flex rounded-2xl bg-accent/20 p-3 text-accent">
                    <ShieldCheck size={24} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">Наложен платеж с преглед</h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-primary-foreground/75">
                    Плащате спокойно на куриера при получаване и преглед на пратката в офиса на Еконт.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-6 backdrop-blur-xs">
                  <div className="mb-4 inline-flex rounded-2xl bg-accent/20 p-3 text-accent">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">100% Оригинални продукти</h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-primary-foreground/75">
                    Подбрано премиум качество от доказани производители с гарантиран произход и надеждност.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ================= FOOTER & WATERMARK ================= */}
      <footer className="border-t border-border bg-card px-4 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm space-y-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/twingo-logo.png"
                  alt="Twingo"
                  width={80}
                  height={64}
                  className="h-8 w-auto object-contain"
                />
                <span className="text-sm font-black tracking-widest text-foreground">TWINGO</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Модерен български онлайн магазин за подбрани електронни аксесоари и устройства. Доставка до 2 работни дни до офис на Еконт.
              </p>
            </div>

            {/* Navigation & Legal Links */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-xs">
              <div className="space-y-2.5">
                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Магазин</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <button onClick={navigateToShop} className="hover:text-foreground transition">
                      Пазарувай
                    </button>
                  </li>
                  <li>
                    <button onClick={focusSearch} className="hover:text-foreground transition">
                      Търсене
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        if (user) setView('profile')
                        else setLoginOpen(true)
                      }}
                      className="hover:text-foreground transition"
                    >
                      Моят Профил
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Информация</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>
                    <button onClick={() => setAboutOpen(true)} className="hover:text-foreground transition">
                      За Нас
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLegalModalType('privacy')} className="hover:text-foreground transition">
                      Поверителност
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setLegalModalType('terms')} className="hover:text-foreground transition">
                      Общи условия
                    </button>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5 col-span-2 sm:col-span-1">
                <p className="font-bold text-foreground uppercase tracking-wider text-[11px]">Контакти</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <Mail size={13} className="text-accent" />
                    <span>momchilparpulev20a@gmail.com</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Phone size={13} className="text-accent" />
                    <span>+359 888 123 456</span>
                  </li>
                  {isAdmin && (
                    <li className="pt-1">
                      <a href="/admin" className="font-bold text-accent hover:underline">
                        Admin Конзола
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Discreet Watermark & Copyright */}
          <div className="mt-12 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-muted-foreground">
            <p>© 2026 Twingo. All rights reserved.</p>
            <p className="text-[11px] text-muted-foreground/75">
              Бърза доставка до 2 работни дни само чрез Еконт Експрес с Наложен платеж.
            </p>
          </div>
        </div>
      </footer>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-xs md:items-center md:p-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative grid max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-background md:grid-cols-2 md:rounded-3xl shadow-2xl">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 text-foreground backdrop-blur-xs hover:bg-muted"
              aria-label="Затвори"
            >
              <X size={20} />
            </button>

            <div className="relative aspect-square bg-[#edf1f5]">
              {selectedProduct.image ? (
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover mix-blend-multiply"
                />
              ) : null}
            </div>

            <div className="flex flex-col justify-between p-6 md:p-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {selectedProduct.brand} · {selectedProduct.category}
                </p>
                <h3 className="mt-2 text-xl sm:text-2xl font-black tracking-tight md:text-3xl">
                  {selectedProduct.name}
                </h3>
                <p className="mt-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {selectedProduct.description ||
                    'Висококачествен оригинален продукт с бърза доставка до 2 работни дни до избран офис на Еконт с преглед.'}
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <span className="text-2xl font-black text-foreground">
                    {money(selectedProduct.price)}
                  </span>
                  {selectedProduct.oldPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {money(selectedProduct.oldPrice)}
                    </span>
                  )}
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <Check size={15} /> В наличност · Доставка до 2 работни дни с Еконт
                </p>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => {
                    addToCart(selectedProduct)
                    setSelectedProduct(null)
                  }}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-xs sm:text-sm font-bold text-primary-foreground transition hover:opacity-90 shadow-md active:scale-95"
                >
                  <ShoppingBag size={16} /> Добави в количката
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setCartOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-accent" />
                <h2 className="text-lg sm:text-xl font-black">Количка ({cart.length})</h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="rounded-full bg-muted p-4 text-muted-foreground">
                  <ShoppingBag size={36} />
                </div>
                <h3 className="mt-4 text-sm sm:text-base font-bold">Количката ви е празна.</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Добавете продукти от каталога, за да завършите поръчка.
                </p>
                <button
                  onClick={() => setCartOpen(false)}
                  className="mt-6 min-h-[40px] rounded-full bg-primary px-6 py-2 text-xs font-bold text-primary-foreground"
                >
                  Разгледай продуктите
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 divide-y divide-border overflow-y-auto py-2">
                  {cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-center gap-4 py-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover mix-blend-multiply"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <h4 className="line-clamp-1 text-xs sm:text-sm font-bold">{item.name}</h4>
                        <p className="text-xs font-black text-foreground">{money(item.price)}</p>
                      </div>
                      <button
                        onClick={() =>
                          setCart((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Премахни"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-5 space-y-3">
                  <div className="flex items-center justify-between text-sm sm:text-base font-black">
                    <span>Обща сума:</span>
                    <span className="text-lg sm:text-xl text-accent">{money(cartTotal)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Доставка до 2 работни дни до офис на Еконт · Наложен платеж
                  </p>

                  <button
                    onClick={() => {
                      setCartOpen(false)
                      if (!user) {
                        setLoginOpen(true)
                      } else {
                        setCheckoutOpen(true)
                      }
                    }}
                    className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-xs sm:text-sm font-black text-primary-foreground shadow-lg transition hover:opacity-90 active:scale-95"
                  >
                    Към поръчка <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* Checkout Form Modal */}
      {checkoutOpen && (
        <CheckoutForm
          cart={cart}
          total={cartTotal}
          user={user}
          userProfile={profile}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(info) => {
            setCheckoutOpen(false)
            setCart([])
            setOrderSuccess(info)
          }}
        />
      )}

      {/* Order Success Screen */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-background p-6 sm:p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={32} />
            </div>
            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-accent">
              Успешна поръчка
            </span>
            <h3 className="mt-1 text-2xl font-black">Поръчката е приета!</h3>

            <div className="mt-6 space-y-2 rounded-2xl border border-border bg-muted/40 p-4 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Номер на поръчка:</span>
                <span className="font-bold">#{orderSuccess.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка:</span>
                <span className="font-semibold">Еконт — {orderSuccess.officeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Плащане:</span>
                <span className="font-semibold">Наложен платеж</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm font-black">
                <span>Обща сума:</span>
                <span className="text-accent">{money(orderSuccess.total)}</span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Ще получите SMS от Еконт, когато пратката пристигне в офиса до 2 работни дни.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setOrderSuccess(null)
                  setView('profile')
                }}
                className="min-h-[44px] w-full rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md transition hover:opacity-90 active:scale-95"
              >
                Преглед в Моите поръчки
              </button>
              <button
                onClick={() => {
                  setOrderSuccess(null)
                  setView('shop')
                }}
                className="min-h-[44px] w-full rounded-full border border-border py-3 text-xs font-bold hover:bg-muted"
              >
                Към магазина
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {aboutOpen && (
        <AboutModal onClose={() => setAboutOpen(false)} onShop={navigateToShop} />
      )}

      {/* Legal / Privacy / Terms Modal */}
      {legalModalType && (
        <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
      )}

      {/* Login / Auth Modal */}
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onLogin={() => {
            setLoginOpen(false)
          }}
        />
      )}
    </div>
  )
}