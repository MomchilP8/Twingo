'use client'

import { Heart, Search, ShoppingBag, UserRound, X, Info, Shield } from 'lucide-react'

export function MobileMenu({
  isOpen,
  onClose,
  onShop,
  onSearch,
  onAbout,
  onAccount,
  onFavorites,
  onCart,
  authenticated,
  isAdmin,
}: {
  isOpen: boolean
  onClose: () => void
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
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        inert={!isOpen || undefined}
        aria-label="Мобилна навигация"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-50 flex h-dvh w-[min(85vw,340px)] flex-col bg-background p-6 text-foreground shadow-2xl transition-transform duration-300 ease-out md:hidden overflow-y-auto overflow-x-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <span className="text-lg font-black tracking-[.2em] text-foreground">TWINGO</span>
          <button
            aria-label="Затвори меню"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="mt-6 flex flex-col gap-1 text-base font-semibold">
          <button
            className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-muted"
            onClick={() => {
              onShop()
              onClose()
            }}
          >
            <ShoppingBag size={19} className="text-muted-foreground" />
            Пазарувай
          </button>

          <button
            className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-muted"
            onClick={() => {
              onSearch()
              onClose()
            }}
          >
            <Search size={19} className="text-muted-foreground" />
            Търсене
          </button>

          <button
            className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-muted"
            onClick={() => {
              onAbout()
              onClose()
            }}
          >
            <Info size={19} className="text-muted-foreground" />
            За Нас
          </button>

          {onFavorites && (
            <button
              className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-muted"
              onClick={() => {
                onFavorites()
                onClose()
              }}
            >
              <Heart size={19} className="text-muted-foreground" />
              Любими продукти
            </button>
          )}

          <button
            className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-muted"
            onClick={() => {
              onAccount()
              onClose()
            }}
          >
            <UserRound size={19} className="text-muted-foreground" />
            {authenticated ? 'Моят Профил' : 'Вход / Регистрация'}
          </button>

          <button
            className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-muted"
            onClick={() => {
              onCart()
              onClose()
            }}
          >
            <ShoppingBag size={19} className="text-muted-foreground" />
            Количка
          </button>

          {isAdmin && (
            <a
              href="/admin"
              className="mt-4 flex min-h-[48px] items-center gap-3 rounded-2xl bg-accent/15 px-4 py-3 text-left font-bold text-accent"
            >
              <Shield size={19} />
              Admin Конзола
            </a>
          )}
        </nav>

        <div className="mt-auto border-t border-border pt-6 text-xs text-muted-foreground">
          <p className="font-bold text-foreground">TWINGO България</p>
          <p className="mt-1">Бърза доставка до 2 работни дни до офис на Еконт · Наложен платеж</p>
        </div>
      </aside>
    </>
  )
}
