import { existsSync, readFileSync } from 'node:fs'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    const value = match[2].trim().replace(/^['"]|['"]$/g, '')
    process.env[match[1]] = value
  }
}
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
if (!process.env.FIREBASE_CLIENT_EMAIL || !privateKey) throw new Error('Задай FIREBASE_CLIENT_EMAIL и FIREBASE_PRIVATE_KEY в .env.local (от сервизния акаунт на Firebase). Текущият .env.local вече ги съдържа.')
  if (!process.env.ADMIN_EMAIL) throw new Error('Липсва ADMIN_EMAIL. Добави ADMIN_EMAIL=твоят@имейл.com в .env.local и стартирай отново командата. Този акаунт трябва вече да е регистриран в приложението.')
  console.log('OK: FIREBASE_CLIENT_EMAIL и FIREBASE_PRIVATE_KEY са намерени.')
const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'twingo-dfd29'
const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }) })
const auth = getAuth(app); const db = getFirestore(app)
const user = await auth.getUserByEmail(process.env.ADMIN_EMAIL)
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true })
const products = [
  ['airpods-pro-2','AirPods Pro (2-ро поколение)','AirPods','Apple',54900,12,'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=900&q=85'], ['watch-series-9','Apple Watch Series 9','Apple Watch','Apple',69900,7,'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=900&q=85'], ['quietcomfort-ultra','Bose QuietComfort Ultra','Слушалки','Bose',74900,4,'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=900&q=85'], ['charge-5','JBL Charge 5 Bluetooth Колонка','Други джаджи','JBL',28900,19,'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=85'], ['anker-nano','Зарядно Anker Nano 30W','Зарядни','Anker',5900,31,'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=900&q=85'], ['magsafe-powerbank','MagSafe Външна батерия','Външни батерии','Baseus',9900,22,'https://images.unsplash.com/photo-1627141234469-24711efb373c?w=900&q=85'],
]
for (const [id,name,category,brand,priceCents,stock,image] of products) await db.doc(`products/${id}`).set({ name, category, brand, priceCents, stock, active: true, image, description: '', updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp() }, { merge: true })
console.log(`Админ права зададени за ${user.email}; добавени ${products.length} продукта. Излез и влез отново или опресни токена.`)
console.log('\nСледващи стъпки:')
console.log('1) Публикувай Firestore правилата: отвори firestore.rules и го копирай в Firebase Console -> Firestore -> Rules. Това е ЗАДЪЛЖИТЕЛНО — без него приложението връща "Missing or insufficient permissions" за продукти, поръчки и профили.')
console.log('2) Отвори /admin докато си влязъл с админа по-горе — ще те помоли да влезеш отново, за да се отрази новата админ роля.')
