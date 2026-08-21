'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  Truck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
} from 'lucide-react'
import { auth } from '@/lib/firebase-client'
import { money, type Product } from '@/lib/products'
import type { EcontOffice, UserProfile } from '@/lib/store-types'

export function CheckoutForm({
  cart,
  total,
  user,
  userProfile,
  onClose,
  onSuccess,
}: {
  cart: Product[]
  total: number
  user: { email?: string | null } | null
  userProfile?: UserProfile | null
  onClose: () => void
  onSuccess: (orderInfo: { orderNumber: string; officeName: string; total: number }) => void
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Form State
  const [firstName, setFirstName] = useState(userProfile?.firstName ?? '')
  const [lastName, setLastName] = useState(userProfile?.lastName ?? '')
  const [phone, setPhone] = useState(userProfile?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? userProfile?.email ?? '')

  // Econt Offices State
  const [offices, setOffices] = useState<EcontOffice[]>([])
  const [loadingOffices, setLoadingOffices] = useState(true)
  const [officeQuery, setOfficeQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState<string>('Всички градове')
  const [selectedOffice, setSelectedOffice] = useState<EcontOffice | null>(
    userProfile?.preferredEcontOffice ?? null
  )

  // Fetch Econt offices on mount
  useEffect(() => {
    let active = true
    const loadOffices = async () => {
      try {
        setLoadingOffices(true)
        const res = await fetch('/api/econt/offices')
        const data = await res.json()
        if (active && Array.isArray(data.offices)) {
          setOffices(data.offices)
          if (userProfile?.preferredEcontOffice) {
            const match = data.offices.find(
              (o: EcontOffice) =>
                String(o.id) === String(userProfile.preferredEcontOffice?.id) ||
                o.name === userProfile.preferredEcontOffice?.name
            )
            if (match) setSelectedOffice(match)
          }
        }
      } catch (err) {
        console.error('Failed to load Econt offices:', err)
      } finally {
        if (active) setLoadingOffices(false)
      }
    }
    loadOffices()
    return () => {
      active = false
    }
  }, [userProfile])

  // Extract list of cities
  const cities = useMemo(() => {
    const set = new Set(offices.map((o) => o.city))
    return ['Всички градове', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'bg'))]
  }, [offices])

  // Filtered offices based on search query and city
  const filteredOffices = useMemo(() => {
    const q = officeQuery.trim().toLowerCase()
    return offices.filter((o) => {
      const matchCity = selectedCity === 'Всички градове' || o.city === selectedCity
      if (!matchCity) return false
      if (!q) return true
      return (
        o.name.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        String(o.code || '').includes(q)
      )
    })
  }, [offices, selectedCity, officeQuery])

  // Step 1 Validation
  const validateStep1 = () => {
    if (!firstName.trim()) return 'Моля, въведете собствено име.'
    if (!lastName.trim()) return 'Моля, въведете фамилия.'
    if (!phone.trim() || phone.trim().length < 6) return 'Моля, въведете валиден телефонен номер.'
    if (!email.trim() || !email.includes('@')) return 'Моля, въведете валиден имейл адрес.'
    return null
  }

  // Step 2 Validation
  const validateStep2 = () => {
    if (!selectedOffice) {
      return 'Моля, изберете конкретен офис на Еконт от списъка.'
    }
    return null
  }

  const handleNext = () => {
    setError('')
    if (step === 1) {
      const err = validateStep1()
      if (err) return setError(err)
      setStep(2)
    } else if (step === 2) {
      const err = validateStep2()
      if (err) return setError(err)
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    }
  }

  const submitOrder = async () => {
    if (busy) return // Prevent double-click
    setError('')
    const err1 = validateStep1()
    if (err1) {
      setStep(1)
      return setError(err1)
    }
    const err2 = validateStep2()
    if (err2) {
      setStep(2)
      return setError(err2)
    }

    setBusy(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        throw new Error('Сесията ви е изтекла. Моля, влезте отново в профила си.')
      }

      // Group cart items by quantity
      const itemMap = new Map<string, { id: string; quantity: number }>()
      for (const item of cart) {
        const current = itemMap.get(item.id)
        if (current) current.quantity += 1
        else itemMap.set(item.id, { id: item.id, quantity: 1 })
      }

      const payload = {
        items: Array.from(itemMap.values()),
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        },
        econtOffice: {
          id: selectedOffice!.id,
          name: selectedOffice!.name,
          city: selectedOffice!.city,
          address: selectedOffice!.address,
          workingHours: selectedOffice!.workingHours || '',
        },
      }

      const response = await fetch('/api/orders/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Възникна проблем при създаването на поръчката.')
      }

      onSuccess({
        orderNumber: data.orderNumber || 'TW-1001',
        officeName: selectedOffice!.name,
        total,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Възникна грешка.')
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'w-full min-h-[48px] rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:border-accent focus:outline-none transition'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-background/95 p-3 sm:p-6 md:p-10 backdrop-blur-md">
      <div className="mx-auto max-w-3xl">
        {/* Header navigation */}
        <div className="flex items-center justify-between border-b border-border pb-4 sm:pb-6">
          <button
            onClick={step > 1 ? () => setStep((s) => (s - 1) as 1 | 2 | 3 | 4) : onClose}
            className="flex min-h-[40px] items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft size={18} />
            {step > 1 ? 'Назад' : 'Отказ'}
          </button>
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Стъпка {step} от 4
          </span>
        </div>

        {/* Progress Stepper */}
        <div className="mt-4 sm:mt-6 grid grid-cols-4 gap-1.5 sm:gap-2">
          {[
            { n: 1, label: 'Данни' },
            { n: 2, label: 'Еконт' },
            { n: 3, label: 'Плащане' },
            { n: 4, label: 'Преглед' },
          ].map((s) => (
            <button
              key={s.n}
              disabled={busy}
              onClick={() => {
                if (s.n < step) setStep(s.n as 1 | 2 | 3 | 4)
              }}
              className={`flex flex-col items-center border-t-2 pt-2 text-[11px] sm:text-xs font-bold transition ${
                step >= s.n
                  ? 'border-accent text-accent'
                  : 'border-border text-muted-foreground opacity-60'
              }`}
            >
              <span>0{s.n}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 sm:mt-8">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs sm:text-sm text-destructive">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ================= STEP 1: Customer Data ================= */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  СТЪПКА 1
                </span>
                <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">Данни за клиента</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Въведете информация за получателя на пратката в офиса на Еконт.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Собствено име *
                  </label>
                  <input
                    required
                    placeholder="напр. Иван"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Фамилия *
                  </label>
                  <input
                    required
                    placeholder="напр. Иванов"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Телефонен номер * (за SMS известяване)
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="0888 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    Имейл адрес *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-90 active:scale-95"
                >
                  Продължи към доставка <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: Delivery to Econt Office ================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  СТЪПКА 2
                </span>
                <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">Доставка до офис на Еконт</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Бърза доставка до 2 работни дни до избран от вас офис в страната.
                </p>
              </div>

              {/* Fixed courier badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-3.5 sm:p-4">
                  <div className="rounded-xl bg-primary p-2 text-primary-foreground">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Куриер</p>
                    <p className="text-xs sm:text-sm font-bold text-foreground">Еконт Експрес</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary/5 p-3.5 sm:p-4">
                  <div className="rounded-xl bg-primary p-2 text-primary-foreground">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Получаване</p>
                    <p className="text-xs sm:text-sm font-bold text-foreground">Офис на Еконт</p>
                  </div>
                </div>
              </div>

              {/* Currently Selected Office Card */}
              {selectedOffice && (
                <div className="rounded-2xl border-2 border-accent bg-accent/5 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-accent p-1 text-white">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                        Избран офис за получаване:
                      </span>
                      <h4 className="mt-0.5 text-base sm:text-lg font-bold text-foreground">
                        {selectedOffice.name}
                      </h4>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={14} className="shrink-0 text-accent" />
                        <span>
                          {selectedOffice.city}, {selectedOffice.address}
                        </span>
                      </p>
                      {selectedOffice.workingHours && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock size={13} className="shrink-0" />
                          <span>{selectedOffice.workingHours}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filters for Econt offices */}
              <div className="space-y-3">
                <label className="block text-xs sm:text-sm font-bold">
                  Търси и избери офис на Еконт:
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      placeholder="Въведи град, квартал или улица..."
                      value={officeQuery}
                      onChange={(e) => setOfficeQuery(e.target.value)}
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
              </div>

              {/* Office Selection List */}
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-border bg-background p-2">
                {loadingOffices ? (
                  <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground">
                    Зареждане на офиси на Еконт…
                  </div>
                ) : filteredOffices.length === 0 ? (
                  <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground">
                    Няма намерени офиси за посоченото търсене.
                  </div>
                ) : (
                  filteredOffices.map((office) => {
                    const isSelected = selectedOffice?.name === office.name
                    return (
                      <button
                        key={`${office.city}-${office.name}-${office.id}`}
                        type="button"
                        onClick={() => setSelectedOffice(office)}
                        className={`flex w-full items-start justify-between rounded-xl p-3 text-left transition ${
                          isSelected
                            ? 'border-2 border-accent bg-accent/10 font-medium'
                            : 'border border-transparent hover:bg-muted'
                        }`}
                      >
                        <div className="space-y-0.5">
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
                        {isSelected && (
                          <span className="rounded-full bg-accent p-1 text-white shrink-0">
                            <CheckCircle2 size={15} />
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] rounded-full border border-border px-6 py-2.5 text-xs sm:text-sm font-bold transition hover:bg-muted"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!selectedOffice}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50 active:scale-95"
                >
                  Продължи към плащане <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: Payment ================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  СТЪПКА 3
                </span>
                <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">Начин на плащане</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Единственият наличен метод за плащане в Twingo е Наложен платеж.
                </p>
              </div>

              {/* Single Payment Option */}
              <div className="rounded-3xl border-2 border-primary bg-primary/5 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold">Наложен платеж</h3>
                      <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-black text-accent-foreground">
                        Сигурно
                      </span>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                      Плащате при получаване на поръчката. Всички пратки се изпращат с опция за преглед преди заплащане в избрания от вас офис на Еконт.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] rounded-full border border-border px-6 py-2.5 text-xs sm:text-sm font-bold transition hover:bg-muted"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-90 active:scale-95"
                >
                  Преглед на поръчката <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: Order Review & Confirmation ================= */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  СТЪПКА 4
                </span>
                <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">Преглед и поръчка</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Моля, проверете данните преди да изпратите поръчката.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Summary Cards */}
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Получател
                      </span>
                      <button
                        onClick={() => setStep(1)}
                        className="text-xs font-bold text-accent hover:underline"
                      >
                        Промени
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-bold">
                      {firstName} {lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{phone}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Доставка
                      </span>
                      <button
                        onClick={() => setStep(2)}
                        className="text-xs font-bold text-accent hover:underline"
                      >
                        Промени
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-bold">Еконт — {selectedOffice?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedOffice?.city}, {selectedOffice?.address}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Плащане
                    </span>
                    <p className="mt-2 text-sm font-bold">Наложен платеж</p>
                    <p className="text-xs text-muted-foreground">
                      Плащате при получаване на поръчката в офиса на Еконт.
                    </p>
                  </div>
                </div>

                {/* Items & Total Card */}
                <div className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Поръчани продукти ({cart.length})
                  </span>
                  <div className="mt-3 max-h-44 divide-y divide-border overflow-y-auto">
                    {cart.map((item, i) => (
                      <div key={`${item.id}-${i}`} className="flex justify-between py-2 text-xs sm:text-sm">
                        <div className="pr-2">
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground">{item.brand}</p>
                        </div>
                        <span className="font-bold shrink-0">{money(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Междинна сума:</span>
                      <span className="font-semibold">{money(total)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Доставка до офис на Еконт:</span>
                      <span className="font-bold text-emerald-600">
                        {total >= 80 ? 'БЕЗПЛАТНА' : 'според тарифата на Еконт'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-base sm:text-lg font-black">
                      <span>Общо за плащане:</span>
                      <span className="text-accent">{money(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={busy}
                  className="min-h-[44px] rounded-full border border-border px-6 py-2.5 text-xs sm:text-sm font-bold transition hover:bg-muted"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={busy}
                  className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-primary px-10 py-3.5 text-base font-black text-primary-foreground shadow-lg transition hover:opacity-90 disabled:opacity-60 active:scale-95"
                >
                  {busy ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Обработка на поръчката…</span>
                    </>
                  ) : (
                    `ПОРЪЧАЙ · ${money(total)}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}