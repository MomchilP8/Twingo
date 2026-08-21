'use client'

import Image from 'next/image'
import { Menu, Search, ShoppingBag, UserRound, Heart } from 'lucide-react'
import { MobileMenu } from '@/components/mobile-menu'

export function Navbar({
  cartCount,
  favoritesCount,
  isMenuOpen,
  onMenuChange,
  onShop,
  onSearch,
  onAbout,
  onAccount,
  onFavorites,
  onCart,
  authenticated,
  isAdmin,
}: {
  cartCount: number
  favoritesCount?: number
  isMenuOpen: boolean
  onMenuChange: (open: boolean) => void
  onShop: () => void
  onSearch: () => void
  onAbout: () => void
  onAccount: () => void
  onFavorites?: () => void
  onCart: () => void
  authenticated: boolean
  isAdmin?: boolean
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20 md:px-8">
        {/* Left: Mobile hamburger */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition hover:bg-muted md:hidden"
          aria-label="Отвори меню"
          aria-expanded={isMenuOpen}
          onClick={() => onMenuChange(true)}
        >
          <Menu size={22} />
        </button>

        {/* Left Desktop: Main Navigation */}
        <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
          <button
            onClick={onShop}
            className="transition-colors hover:text-accent focus:outline-none"
          >
            Пазарувай
          </button>
          <button
            onClick={onSearch}
            className="flex items-center gap-1.5 transition-colors hover:text-accent focus:outline-none"
          >
            <Search size={15} />
            Търсене
          </button>
          <button
            onClick={onAbout}
            className="transition-colors hover:text-accent focus:outline-none"
          >
            За Нас
          </button>
          {isAdmin && (
            <a
              href="/admin"
              className="rounded-full bg-accent/15 px-3.5 py-1 text-xs font-bold text-accent transition hover:bg-accent/25"
            >
              Admin Панел
            </a>
          )}
        </nav>

        {/* Center: Brand Logo */}
        <button
          onClick={onShop}
          className="focus:outline-none md:absolute md:left-1/2 md:-translate-x-1/2"
          aria-label="Twingo Начало"
        >
          <Image
            src="/twingo-logo.png"
            alt="Twingo"
            width={96}
            height={76}
            priority
            className="h-9 w-auto object-contain sm:h-10 md:h-12"
          />
        </button>

        {/* Right Desktop/Mobile: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-muted md:flex"
            aria-label="Търсене"
            onClick={onSearch}
          >
            <Search size={19} />
          </button>

          {onFavorites && (
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
              aria-label="Любими продукти"
              onClick={onFavorites}
            >
              <Heart size={19} />
              {typeof favoritesCount === 'number' && favoritesCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          <button
            className="flex h-10 items-center gap-2 rounded-full px-2.5 text-foreground transition hover:bg-muted"
            aria-label="Профил"
            onClick={onAccount}
          >
            <UserRound size={19} />
            <span className="hidden text-xs font-bold md:inline">
              {authenticated ? 'Профил' : 'Вход'}
            </span>
          </button>

          <button
            aria-label="Количка"
            className="relative flex h-10 items-center gap-2 rounded-full bg-primary px-3.5 text-primary-foreground shadow-xs transition hover:opacity-90 active:scale-95"
            onClick={onCart}
          >
            <ShoppingBag size={17} />
            <span className="text-xs font-black">{cartCount}</span>
          </button>
        </div>
      </div>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => onMenuChange(false)}
        onShop={onShop}
        onSearch={onSearch}
        onAbout={onAbout}
        onAccount={onAccount}
        onFavorites={onFavorites}
        onCart={onCart}
        authenticated={authenticated}
        isAdmin={isAdmin}
      />
    </header>
  )
}
