'use client'

import { FormEvent, useState } from 'react'
import { X } from 'lucide-react'
import { createUserWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase-client'

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Имейлът или паролата са грешни.',
  'auth/user-not-found': 'Не съществува акаунт с този имейл.',
  'auth/wrong-password': 'Паролата е грешна.',
  'auth/invalid-login': 'Имейлът или паролата са грешни.',
  'auth/email-already-in-use': 'Този имейл вече е регистриран. Опитай вход.',
  'auth/weak-password': 'Паролата трябва да е поне 8 символа.',
  'auth/invalid-email': 'Въведи валиден имейл адрес.',
  'auth/too-many-requests': 'Твърде много опити. Изчакай малко и опитай отново.',
  'auth/network-request-failed': 'Грешка в мрежата. Провери интернет връзката и изключи ад-блокер или прокси.',
  'auth/internal-error': 'Мрежова грешка от Firebase. Провери интернета и изключи ад-блокера.',
  'auth/operation-not-allowed': 'Този начин за вход не е активиран в конзолата на Firebase.',
  'auth/popup-closed': 'Прозорецът за вход с Google беше затворен. Опитай отново.',
  'auth/popup-blocked': 'Браузърът блокира изскачащия прозорец. Разреши го за тази страница.',
  'auth/cancelled': 'Входът с Google е отказан.',
  'permission-denied': 'Нямате право да записвате. Приложи firestore.rules в конзолата на Firebase.',
  'unavailable': 'Услугата е недостъпна. Опитай отново след няколко секунди.',
}
const message = (error: unknown) => {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code]
  const text = error instanceof Error ? error.message : String(error)
  if (text.includes('permission') || text.includes('Missing or insufficient')) return 'Нямате право за запис в момента. Приложи Firestore правилата в конзолата на Firebase.'
  if (text.includes('fetch') || text.includes('network') || text.includes('ERR_')) return 'Мрежова грешка. Провери интернета и изключи ад-блокера.'
  return 'Възникна грешка. Опитай отново.'
}

export function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin?: (email: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login'); const [firstName, setFirst] = useState(''); const [lastName, setLast] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false)
  const establishServerSession = async () => { const token = await auth.currentUser?.getIdToken(true); if (!token) throw new Error('Сесията не можа да бъде потвърдена.'); const response = await fetch('/api/auth/session', { method: 'POST', headers: { authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error('Сесията не можа да бъде защитена.') }
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(''); setNotice(''); if (mode === 'register' && password !== confirm) return setError('Паролите не съвпадат.'); if (mode === 'register' && password.length < 8) return setError('Паролата трябва да е поне 8 символа.'); setBusy(true); try { if (mode === 'reset') { await sendPasswordResetEmail(auth, email); setNotice('Изпратихме линк за възстановяване на паролата.'); return } if (mode === 'login') await signInWithEmailAndPassword(auth, email, password); else { const credential = await createUserWithEmailAndPassword(auth, email, password); try { await updateProfile(credential.user, { displayName: `${firstName} ${lastName}`.trim() }) } catch {} try { await setDoc(doc(db, 'users', credential.user.uid), { firstName, lastName, email, role: 'customer', createdAt: serverTimestamp() }) } catch {} } try { await establishServerSession() } catch {} onLogin?.(email); onClose() } catch (caught) { setError(message(caught)) } finally { setBusy(false) } }
  const googleLogin = async () => { setBusy(true); setError(''); try { const credential = await signInWithPopup(auth, new GoogleAuthProvider()); try { await setDoc(doc(db, 'users', credential.user.uid), { email: credential.user.email, createdAt: serverTimestamp() }, { merge: true }) } catch {} try { await establishServerSession() } catch {} onLogin?.(credential.user.email ?? ''); onClose() } catch (caught) { setError(message(caught)) } finally { setBusy(false) } }
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md bg-background p-6 shadow-2xl md:p-8"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-muted-foreground">TWINGO профил</p><h2 className="mt-2 text-2xl font-bold">{mode === 'register' ? 'Създай акаунт.' : mode === 'reset' ? 'Възстанови паролата.' : 'Влез в профила си.'}</h2></div><button aria-label="Затвори входа" onClick={onClose}><X size={20}/></button></div><form onSubmit={submit} className="mt-8 space-y-4">{mode === 'register' && <div className="grid grid-cols-2 gap-3"><input required value={firstName} onChange={(e) => setFirst(e.target.value)} placeholder="Име" className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm"/><input required value={lastName} onChange={(e) => setLast(e.target.value)} placeholder="Фамилия" className="rounded-lg border border-border bg-transparent px-4 py-3 text-sm"/></div>}<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Имейл" className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm"/>{mode !== 'reset' && <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Парола (минимум 8 символа)" className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm"/>}{mode === 'register' && <input required minLength={8} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Потвърди паролата" className="w-full rounded-lg border border-border bg-transparent px-4 py-3 text-sm"/>}{error && <p className="text-sm text-destructive">{error}</p>}{notice && <p className="text-sm text-accent-foreground">{notice}</p>}<button disabled={busy} className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? 'Изчакай…' : mode === 'register' ? 'Регистрация' : mode === 'reset' ? 'Изпрати линк' : 'Вход'}</button></form>{mode === 'login' && <button type="button" disabled={busy} onClick={googleLogin} className="mt-3 w-full rounded-full border border-border py-3 text-sm font-semibold disabled:opacity-50">Продължи с Google</button>}<div className="mt-5 flex flex-col gap-2 text-center text-xs text-muted-foreground"><button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Нямаш акаунт? Регистрация' : 'Вече имаш акаунт? Вход'}</button>{mode === 'login' && <button onClick={() => setMode('reset')}>Забравена парола</button>}</div></div></div>
}
