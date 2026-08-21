export type Product = {
  id: string
  name: string
  category: string
  brand: string
  price: number
  oldPrice?: number
  image: string
  badge?: string
  description: string
  stock: number
}

export const PRODUCTS: Product[] = [
  { id: 'airpods-pro-2', name: 'AirPods Pro (2-ро поколение)', category: 'AirPods', brand: 'Apple', price: 279, oldPrice: 299, badge: 'Бестселър', image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=900&q=85', description: 'Активно шумопотискане, адаптивно аудио и USB-C кейс. Бърза доставка до 2 работни дни.', stock: 12 },
  { id: 'watch-series-9', name: 'Apple Watch Series 9', category: 'Apple Watch', brand: 'Apple', price: 359, badge: 'Ново', image: 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=900&q=85', description: 'Интелигентен часовник за здраве, тренировки и ежедневни задачи. Бърза доставка до 2 работни дни.', stock: 7 },
  { id: 'quietcomfort-ultra', name: 'Bose QuietComfort Ultra', category: 'Слушалки', brand: 'Bose', price: 379, oldPrice: 409, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=900&q=85', description: 'Потапящ звук и водещо в класа си шумопотискане. Бърза доставка до 2 работни дни.', stock: 4 },
  { id: 'charge-5', name: 'JBL Charge 5 Bluetooth Колонка', category: 'Други джаджи', brand: 'JBL', price: 149, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=85', description: 'Мощен преносим звук с до 20 часа батерия. Бърза доставка до 2 работни дни.', stock: 19 },
  { id: 'anker-nano', name: 'Зарядно Anker Nano 30W', category: 'Зарядни', brand: 'Anker', price: 29, oldPrice: 35, image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=900&q=85', description: 'Компактно GaN бързо зарядно за телефон, таблет и лаптоп. Бърза доставка до 2 работни дни.', stock: 31 },
  { id: 'magsafe-powerbank', name: 'MagSafe Външна батерия', category: 'Външни батерии', brand: 'Baseus', price: 49, image: 'https://images.unsplash.com/photo-1627141234469-24711efb373c?w=900&q=85', description: 'Безжично зареждане в движение с магнитно закрепване. Бърза доставка до 2 работни дни.', stock: 22 },
]

export const CATEGORIES = ['Всички', 'AirPods', 'Apple Watch', 'Слушалки', 'Зарядни', 'Външни батерии', 'Кабели', 'Аксесоари', 'Други джаджи']

/**
 * Formats price as EUR (€99.99)
 */
export const money = (value: number) => `€${value.toFixed(2)}`

export const getProduct = (id: string) => PRODUCTS.find((product) => product.id === id)

export type OrderStatus = 'Нова' | 'Потвърдена' | 'Подготвя се' | 'Изпратена' | 'Получена' | 'Отказана'

export type Order = { id: string; date: string; customer: string; total: number; status: OrderStatus; items: number }

export const formatDate = (date: string) => date

export const canManageStore = (email?: string | null) => email?.toLowerCase() === 'momchilparpulev20a@gmail.com'

export const filterProducts = (products: Product[], category: string, query: string) => {
  const q = query.trim().toLowerCase()
  return products.filter((p) => {
    const matchesCategory = category === 'Всички' || p.category === category
    if (!matchesCategory) return false
    if (!q) return true
    const searchString = `${p.name} ${p.brand} ${p.category} ${p.description}`.toLowerCase()
    return searchString.includes(q)
  })
}
