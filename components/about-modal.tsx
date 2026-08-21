'use client'

import { Truck, Clock, Sparkles, X, Mail, Phone, CheckCircle2, Shield } from 'lucide-react'

export function AboutModal({ onClose, onShop }: { onClose: () => void; onShop: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl md:p-10">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Затвори"
        >
          <X size={22} />
        </button>

        <div>
          <span className="text-xs font-bold uppercase tracking-[.2em] text-accent">За TWINGO</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            Технология, която е с теб.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            TWINGO е модерен български онлайн магазин за подбрани електронни устройства, слушалки, зарядни и аксесоари. Ние предлагаме бърза обработка, доставка до офис на Еконт и сигурен наложен платеж с преглед.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/20 p-2.5 text-accent">
                <Truck size={22} />
              </div>
              <h3 className="font-bold">Доставка до 2 работни дни</h3>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              Всички поръчки се обработват веднага и пътуват от България с бърза доставка до 2 работни дни до избран от вас офис на Еконт.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/20 p-2.5 text-accent">
                <Clock size={22} />
              </div>
              <h3 className="font-bold">Наложен платеж</h3>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              Плащате сигурно и спокойно при получаване и преглед на пратката в офиса на куриера — без предплащане с банкова карта.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/20 p-2.5 text-accent">
                <CheckCircle2 size={22} />
              </div>
              <h3 className="font-bold">Опция за преглед</h3>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              Всяка пратка се изпраща с право на отваряне и преглед преди заплащане на сумата по наложения платеж.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/20 p-2.5 text-accent">
                <Sparkles size={22} />
              </div>
              <h3 className="font-bold">Подбрано качество</h3>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              Всеки продукт в каталога е подбран за максимална издръжливост, функционалност и съвместимост с любимите ви устройства.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-5">
          <h4 className="text-sm font-bold">Контакти за клиенти:</h4>
          <div className="mt-3 flex flex-wrap gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-accent" />
              <span>momchilparpulev20a@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-accent" />
              <span>+359 888 123 456</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose()
              onShop()
            }}
            className="rounded-full bg-primary px-8 py-3 text-xs font-bold text-primary-foreground shadow-md transition hover:opacity-90"
          >
            Разгледай магазина
          </button>
        </div>
      </div>
    </div>
  )
}
