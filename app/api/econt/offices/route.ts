import { NextResponse } from 'next/server'
import type { EcontOffice } from '@/lib/store-types'

// Built-in high-quality catalog of Econt offices across Bulgaria.
// Used as immediate fallback and instant response if external Econt API is not configured or fails.
const FALLBACK_OFFICES: EcontOffice[] = [
  // София
  { id: 101, code: '1001', name: 'София — Център (ул. Раковски)', city: 'София', postCode: '1000', address: 'ул. Г. С. Раковски 128', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 102, code: '1002', name: 'София — Младост 1', city: 'София', postCode: '1784', address: 'ж.к. Младост 1, бл. 74А', workingHours: 'Пн-Пт: 09:00 - 18:30, Сб: 09:00 - 13:30' },
  { id: 103, code: '1003', name: 'София — Младост 4 (Бизнес Парк)', city: 'София', postCode: '1766', address: 'ж.к. Младост 4, до сграда 12', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 104, code: '1004', name: 'София — Люлин 3', city: 'София', postCode: '1336', address: 'ж.к. Люлин 3, бл. 308', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 105, code: '1005', name: 'София — Лозенец', city: 'София', postCode: '1421', address: 'ул. Богатица 20', workingHours: 'Пн-Пт: 09:00 - 18:30, Сб: 09:00 - 13:00' },
  { id: 106, code: '1006', name: 'София — Студентски град', city: 'София', postCode: '1700', address: 'ул. Академик Борис Стефанов 8', workingHours: 'Пн-Пт: 09:00 - 19:00, Сб: 09:00 - 14:00' },
  { id: 107, code: '1007', name: 'София — Оборище / Театър София', city: 'София', postCode: '1504', address: 'ул. Оборище 78', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 108, code: '1008', name: 'София — Надежда 2', city: 'София', postCode: '1231', address: 'ул. Свети Никола Нови 26', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 109, code: '1009', name: 'София — Борово / България мол', city: 'София', postCode: '1680', address: 'ул. Тодор Каблешков 53', workingHours: 'Пн-Пт: 09:00 - 18:30, Сб: 09:00 - 13:30' },
  { id: 110, code: '1010', name: 'София — Дружба 2', city: 'София', postCode: '1582', address: 'ж.к. Дружба 2, бул. Проф. Цветан Лазаров 12', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Пловдив
  { id: 201, code: '2001', name: 'Пловдив — Център (ул. Иван Вазов)', city: 'Пловдив', postCode: '4000', address: 'ул. Иван Вазов 34', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 202, code: '2002', name: 'Пловдив — Тракия (до Форум)', city: 'Пловдив', postCode: '4023', address: 'ж.к. Тракия, бл. 100', workingHours: 'Пн-Пт: 09:00 - 18:30, Сб: 09:00 - 13:00' },
  { id: 203, code: '2003', name: 'Пловдив — Кършияка (до Новотел)', city: 'Пловдив', postCode: '4003', address: 'ул. Златю Бояджиев 15', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 204, code: '2004', name: 'Пловдив — Смирненски', city: 'Пловдив', postCode: '4002', address: 'ул. Пещерско шосе 80', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 205, code: '2005', name: 'Пловдив — Кючук Париж', city: 'Пловдив', postCode: '4004', address: 'ул. Стефан Стамболов 42', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Варна
  { id: 301, code: '3001', name: 'Варна — Център (до Общината)', city: 'Варна', postCode: '9000', address: 'бул. Осми Приморски Полк 64', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 302, code: '3002', name: 'Варна — Левски', city: 'Варна', postCode: '9010', address: 'ул. Дубровник 14', workingHours: 'Пн-Пт: 09:00 - 18:30, Сб: 09:00 - 13:00' },
  { id: 303, code: '3003', name: 'Варна — Младост', city: 'Варна', postCode: '9020', address: 'ж.к. Младост, бл. 138', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 304, code: '3004', name: 'Варна — Чайка', city: 'Варна', postCode: '9005', address: 'кв. Чайка, бл. 53', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 305, code: '3005', name: 'Варна — Аспарухово', city: 'Варна', postCode: '9003', address: 'ул. Народни Будители 12', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Бургас
  { id: 401, code: '4001', name: 'Бургас — Център (ул. Александровска)', city: 'Бургас', postCode: '8000', address: 'ул. Александровска 95', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 402, code: '4002', name: 'Бургас — Лазур', city: 'Бургас', postCode: '8001', address: 'ж.к. Лазур, бл. 153', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 403, code: '4003', name: 'Бургас — Меден Рудник', city: 'Бургас', postCode: '8011', address: 'ж.к. Меден Рудник, зона Б, бл. 92', workingHours: 'Пн-Пт: 09:00 - 18:30, Сб: 09:00 - 13:30' },
  { id: 404, code: '4004', name: 'Бургас — Славейков', city: 'Бургас', postCode: '8005', address: 'ж.к. Славейков, до бл. 55', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Русе
  { id: 501, code: '5001', name: 'Русе — Център (ул. Борисова)', city: 'Русе', postCode: '7000', address: 'ул. Борисова 45', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 502, code: '5002', name: 'Русе — Здравец', city: 'Русе', postCode: '7005', address: 'ул. Байкал 6', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Стара Загора
  { id: 601, code: '6001', name: 'Стара Загора — Център (бул. Цар Симеон Велики)', city: 'Стара Загора', postCode: '6000', address: 'бул. Цар Симеон Велики 108', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 602, code: '6002', name: 'Стара Загора — Казански', city: 'Стара Загора', postCode: '6004', address: 'ул. Капитан Петко Войвода 22', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Плевен
  { id: 701, code: '7001', name: 'Плевен — Център (ул. Данаил Попов)', city: 'Плевен', postCode: '5800', address: 'ул. Данаил Попов 16', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 702, code: '7002', name: 'Плевен — Сторгозия', city: 'Плевен', postCode: '5802', address: 'ж.к. Сторгозия, бл. 22', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Велико Търново
  { id: 801, code: '8001', name: 'Велико Търново — Център (ул. Васил Левски)', city: 'Велико Търново', postCode: '5000', address: 'ул. Васил Левски 29', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 802, code: '8002', name: 'Велико Търново — Колю Фичето', city: 'Велико Търново', postCode: '5008', address: 'ул. Симеон Велики 3', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Благоевград
  { id: 901, code: '9001', name: 'Благоевград — Център (ул. Тодор Александров)', city: 'Благоевград', postCode: '2700', address: 'ул. Тодор Александров 41', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
  { id: 902, code: '9002', name: 'Благоевград — Еленово', city: 'Благоевград', postCode: '2704', address: 'ж.к. Еленово, бл. 45', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Пазарджик
  { id: 1001, code: '10001', name: 'Пазарджик — Център (ул. Георги Бенковски)', city: 'Пазарджик', postCode: '4400', address: 'ул. Георги Бенковски 18', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Хасково
  { id: 1101, code: '11001', name: 'Хасково — Център (бул. България)', city: 'Хасково', postCode: '6300', address: 'бул. България 42', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Шумен
  { id: 1201, code: '12001', name: 'Шумен — Център (ул. Цар Освободител)', city: 'Шумен', postCode: '9700', address: 'ул. Цар Освободител 85', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Сливен
  { id: 1301, code: '13001', name: 'Сливен — Център (ул. Генерал Скобелев)', city: 'Сливен', postCode: '8800', address: 'ул. Генерал Скобелев 12', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Перник
  { id: 1401, code: '14001', name: 'Перник — Център (ул. Търговска)', city: 'Перник', postCode: '2300', address: 'ул. Търговска 33', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Добрич
  { id: 1501, code: '15001', name: 'Добрич — Център (ул. Отец Паисий)', city: 'Добрич', postCode: '9300', address: 'ул. Отец Паисий 21', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Габрово
  { id: 1601, code: '16001', name: 'Габрово — Център (ул. Радецка)', city: 'Габрово', postCode: '5300', address: 'ул. Радецка 15', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Враца
  { id: 1701, code: '17001', name: 'Враца — Център (ул. Никола Войводов)', city: 'Враца', postCode: '3000', address: 'ул. Никола Войводов 8', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Кърджали
  { id: 1801, code: '18001', name: 'Кърджали — Център (бул. България)', city: 'Кърджали', postCode: '6600', address: 'бул. България 65', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Ямбол
  { id: 1901, code: '19001', name: 'Ямбол — Център (ул. Търговска)', city: 'Ямбол', postCode: '8600', address: 'ул. Търговска 48', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Видин
  { id: 2001, code: '20001', name: 'Видин — Център (ул. Градинска)', city: 'Видин', postCode: '3700', address: 'ул. Градинска 19', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Казанлък
  { id: 2101, code: '21001', name: 'Казанлък — Център (ул. Искра)', city: 'Казанлък', postCode: '6100', address: 'ул. Искра 14', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },

  // Асеновград
  { id: 2201, code: '22001', name: 'Асеновград — Център (ул. Цар Иван Асен II)', city: 'Асеновград', postCode: '4230', address: 'ул. Цар Иван Асен II 45', workingHours: 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00' },
]

/**
 * Attempts to fetch live offices from Econt Nomenclatures API if configured,
 * otherwise returns the enriched fallback list.
 */
async function fetchEcontOffices(): Promise<EcontOffice[]> {
  const apiUrl = process.env.ECONT_API_URL || 'https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json'
  const username = process.env.ECONT_USERNAME
  const password = process.env.ECONT_PASSWORD

  // If no credentials and default production URL, we can attempt with demo/test or return fallback
  if (!username || !password) {
    return FALLBACK_OFFICES
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ countryCode: 'BGR' }),
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
    })

    if (!response.ok) {
      console.warn(`[Econt API] Error status ${response.status}. Falling back to standard catalog.`)
      return FALLBACK_OFFICES
    }

    const data = await response.json()
    if (data && Array.isArray(data.offices)) {
      // Map Econt API offices structure to our clean EcontOffice type
      const offices: EcontOffice[] = data.offices.map((off: Record<string, unknown>) => {
        const addressObj = (off.address as Record<string, unknown>) || {}
        const cityObj = (addressObj.city as Record<string, unknown>) || {}
        const cityName = String(cityObj.name || addressObj.cityName || off.cityName || 'България')
        const postCode = String(cityObj.postCode || addressObj.postCode || '')
        const fullAddress = String(addressObj.fullAddress || addressObj.street || off.address || '')

        let workingHours = 'Пн-Пт: 09:00 - 18:00, Сб: 09:00 - 13:00'
        if (off.workingTimeFrom && off.workingTimeTo) {
          workingHours = `Пн-Пт: ${off.workingTimeFrom} - ${off.workingTimeTo}`
          if (off.workingTimeHalfFrom && off.workingTimeHalfTo) {
            workingHours += `, Сб: ${off.workingTimeHalfFrom} - ${off.workingTimeHalfTo}`
          }
        }

        return {
          id: off.id ?? off.code ?? Math.random(),
          code: String(off.code || ''),
          name: String(off.name || `Офис ${cityName}`),
          city: cityName,
          cityId: cityObj.id as string | number | undefined,
          postCode,
          address: fullAddress || `${cityName}, ${off.name || 'Офис на Еконт'}`,
          workingHours,
        }
      })

      return offices.length > 0 ? offices : FALLBACK_OFFICES
    }

    return FALLBACK_OFFICES
  } catch (error) {
    console.error('[Econt API] Fetch failed:', error)
    return FALLBACK_OFFICES
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim().toLowerCase() || ''
  const city = searchParams.get('city')?.trim().toLowerCase() || ''

  try {
    const allOffices = await fetchEcontOffices()

    let filtered = allOffices
    if (city) {
      filtered = filtered.filter((o) => o.city.toLowerCase().includes(city))
    }
    if (query) {
      filtered = filtered.filter(
        (o) =>
          o.name.toLowerCase().includes(query) ||
          o.city.toLowerCase().includes(query) ||
          o.address.toLowerCase().includes(query) ||
          String(o.code || '').includes(query)
      )
    }

    // Extract unique cities list for convenience
    const uniqueCities = Array.from(new Set(allOffices.map((o) => o.city))).sort((a, b) => a.localeCompare(b, 'bg'))

    return NextResponse.json({
      offices: filtered,
      cities: uniqueCities,
      total: filtered.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Неуспешно зареждане на офиси на Еконт.' },
      { status: 500 }
    )
  }
}

