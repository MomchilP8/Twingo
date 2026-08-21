'use client'

import { X, Shield, FileText } from 'lucide-react'

type LegalType = 'privacy' | 'terms'

export function LegalModal({
  type,
  onClose,
}: {
  type: LegalType
  onClose: () => void
}) {
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

        {type === 'privacy' ? (
          <div>
            <div className="flex items-center gap-3 text-accent">
              <Shield size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Правна информация
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Политика за поверителност
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Последна актуализация: 2026 г.
            </p>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                В <b>TWINGO</b> сигурността и защитата на вашите лични данни са наш водещ приоритет. Тази политика описва как събираме, съхраняваме и обработваме информацията при използване на нашия онлайн магазин.
              </p>

              <h3 className="text-base font-semibold text-foreground">1. Какви данни събираме?</h3>
              <p>
                За обработка и изпълнение на вашите поръчки с доставка до офис на Еконт събираме минимално необходимите данни: собствено име, фамилия, телефонен номер за връзка и SMS известяване, имейл адрес и избран офис на Еконт.
              </p>

              <h3 className="text-base font-semibold text-foreground">2. Цели на обработката</h3>
              <p>
                Данните се използват единствено за:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Приемане, обработка и доставка на вашата поръчка чрез куриерска служба Еконт.</li>
                <li>Изпращане на системни съобщения относно статуса на пратката.</li>
                <li>Възстановяване на достъп до вашия потребителски профил.</li>
              </ul>

              <h3 className="text-base font-semibold text-foreground">3. Сигурност и съхранение</h3>
              <p>
                Всички данни се съхраняват сигурно чрез криптирани облачни бази на Google Firebase. Ние не съхраняваме банкови карти или финансови инструменти, тъй като плащанията се извършват изцяло чрез <b>Наложен платеж</b> при получаване от куриера.
              </p>

              <h3 className="text-base font-semibold text-foreground">4. Вашите права</h3>
              <p>
                Имате право по всяко време да прегледате, редактирате или поискате изтриване на профила и личните си данни чрез менюто „Моят Профил“ или като се свържете с нас на <span className="text-foreground font-medium">momchilparpulev20a@gmail.com</span>.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 text-accent">
              <FileText size={24} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Правна информация
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              Общи условия за ползване
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Последна актуализация: 2026 г.
            </p>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                Добре дошли в <b>TWINGO</b>. С осъществяването на поръчка в нашия сайт, вие се съгласявате с настоящите Общи условия.
              </p>

              <h3 className="text-base font-semibold text-foreground">1. Поръчки и наличности</h3>
              <p>
                Всички артикули в каталога се предлагат до изчерпване на наличните количества. При успешно завършване на поръчка получавате уникален номер на поръчка `#TW-...` и потвърждение в профила си.
              </p>

              <h3 className="text-base font-semibold text-foreground">2. Доставка</h3>
              <p>
                Доставката се извършва <b>до 2 работни дни</b> единствено до избран от клиента офис на куриерска фирма Еконт Експрес на територията на Република България. Доставката за поръчки над €80 е напълно безплатна.
              </p>

              <h3 className="text-base font-semibold text-foreground">3. Плащане и опция за преглед</h3>
              <p>
                Заплащането на закупените стоки става чрез <b>Наложен платеж</b> в брой или с карта на ПОС терминал в офиса на Еконт при получаване. Всички пратки се изпращат с включена опция за преглед преди плащане.
              </p>

              <h3 className="text-base font-semibold text-foreground">4. Връщане и рекламации</h3>
              <p>
                Всеки клиент има законово право да се откаже от покупката в 14-дневен срок от датата на получаване, при условие че продуктът е в оригинален търговски вид и ненарушена опаковка.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end border-t border-border pt-4">
          <button
            onClick={onClose}
            className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90"
          >
            Разбрах
          </button>
        </div>
      </div>
    </div>
  )
}

