'use client'

import { FormEvent, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
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
  'auth/network-request-failed': 'Грешка в мрежата. Провери интернет връзката.',
  'auth/internal-error': 'Мрежова грешка от Firebase. Провери връзката.',
  'auth/operation-not-allowed': 'Този начин за вход (Google/Email) не е активиран в Firebase Console.',
  'auth/unauthorized-domain':
    'Vercel домейнът на сайта не е добавен в Firebase Console -> Authentication -> Settings -> Authorized domains. Моля, добавете го там.',
  'auth/popup-closed-by-user': 'Прозорецът за вход с Google беше затворен преди завършване.',
  'auth/popup-blocked': 'Браузърът блокира изскачащия прозорец. Разреши popups за този сайт.',
  'auth/cancelled-popup-request': 'Заявката за вход беше отменена.',
  'auth/cancelled': 'Входът с Google е отказан.',
  'permission-denied': 'Нямате право за запис. Проверете firestore.rules в Firebase Console.',
  'unavailable': 'Услугата е временно недостъпна. Опитайте отново след няколко секунди.',
}

const getErrorMessage = (error: unknown) => {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  if (code && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code]

  const text = error instanceof Error ? error.message : String(error)
  if (text.includes('unauthorized-domain') || text.includes('authorized domain')) {
    return 'Vercel домейнът не е добавен в Firebase Console -> Authentication -> Settings -> Authorized domains.'
  }
  if (text.includes('permission') || text.includes('Missing or insufficient')) {
    return 'Нямате право за запис в момента. Приложете Firestore правилата в Firebase Console.'
  }
  if (text.includes('fetch') || text.includes('network') || text.includes('ERR_')) {
    return 'Мрежова грешка. Проверете интернет връзката.'
  }
  return text || 'Възникна грешка при вход. Опитайте отново.'
}

export function LoginModal({
  onClose,
  onLogin,
}: {
  onClose: () => void
  onLogin?: (email: string) => void
}) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login')
  const [firstName, setFirst] = useState('')
  const [lastName, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const establishServerSession = async () => {
    const token = await auth.currentUser?.getIdToken(true)
    if (!token) throw new Error('Сесията не можа да бъде потвърдена.')
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw new Error('Сесията не можа да бъде защитена.')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setNotice('')
    if (mode === 'register' && password !== confirm) {
      return setError('Паролите не съвпадат.')
    }
    if (mode === 'register' && password.length < 8) {
      return setError('Паролата трябва да е поне 8 символа.')
    }

    setBusy(true)
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email.trim())
        setNotice('Изпратихме линк за възстановяване на паролата.')
        return
      }

      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        try {
          await updateProfile(credential.user, {
            displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
          })
        } catch {}
        try {
          await setDoc(doc(db, 'users', credential.user.uid), {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            role: 'customer',
            createdAt: serverTimestamp(),
          })
        } catch {}
      }

      try {
        await establishServerSession()
      } catch {}

      onLogin?.(email.trim())
      onClose()
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  const googleLogin = async () => {
    setBusy(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const credential = await signInWithPopup(auth, provider)

      try {
        const displayName = credential.user.displayName || ''
        const parts = displayName.split(' ')
        const gFirst = parts[0] || ''
        const gLast = parts.slice(1).join(' ') || ''

        await setDoc(
          doc(db, 'users', credential.user.uid),
          {
            email: credential.user.email,
            firstName: gFirst,
            lastName: gLast,
            role: credential.user.email?.toLowerCase() === 'momchilparpulev20a@gmail.com' ? 'admin' : 'customer',
            createdAt: serverTimestamp(),
          },
          { merge: true }
        )
      } catch {}

      try {
        await establishServerSession()
      } catch {}

      onLogin?.(credential.user.email ?? '')
      onClose()
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.18em] text-accent">
              TWINGO профил
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {mode === 'register'
                ? 'Създай акаунт'
                : mode === 'reset'
                ? 'Възстанови парола'
                : 'Влез в профила си'}
            </h2>
          </div>
          <button
            aria-label="Затвори"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3.5">
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                value={firstName}
                onChange={(e) => setFirst(e.target.value)}
                placeholder="Име"
                className="w-full min-h-[46px] rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:border-accent focus:outline-none"
              />
              <input
                required
                value={lastName}
                onChange={(e) => setLast(e.target.value)}
                placeholder="Фамилия"
                className="w-full min-h-[46px] rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:border-accent focus:outline-none"
              />
            </div>
          )}

          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Имейл адрес"
            className="w-full min-h-[46px] rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:border-accent focus:outline-none"
          />

          {mode !== 'reset' && (
            <input
              required
              minLength={8}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Парола (минимум 8 символа)"
              className="w-full min-h-[46px] rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:border-accent focus:outline-none"
            />
          )}

          {mode === 'register' && (
            <input
              required
              minLength={8}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Потвърди паролата"
              className="w-full min-h-[46px] rounded-2xl border border-border bg-background px-4 py-2.5 text-xs sm:text-sm focus:border-accent focus:outline-none"
            />
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <p className="rounded-2xl bg-accent/10 p-3 text-xs font-semibold text-accent">
              {notice}
            </p>
          )}

          <button
            disabled={busy}
            className="w-full min-h-[48px] rounded-full bg-primary py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-90 disabled:opacity-50 active:scale-95"
          >
            {busy
              ? 'Моля, изчакайте…'
              : mode === 'register'
              ? 'Регистрация'
              : mode === 'reset'
              ? 'Изпрати линк'
              : 'Вход'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            type="button"
            disabled={busy}
            onClick={googleLogin}
            className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-full border border-border py-3 text-xs sm:text-sm font-bold transition hover:bg-muted disabled:opacity-50 active:scale-95 shadow-2xs"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            Продължи с Google
          </button>
        )}

        <div className="mt-6 flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="hover:text-foreground font-semibold"
          >
            {mode === 'login' ? 'Нямаш акаунт? Регистрация' : 'Вече имаш акаунт? Вход'}
          </button>
          {mode === 'login' && (
            <button
              onClick={() => {
                setMode('reset')
                setError('')
              }}
              className="hover:text-foreground font-medium"
            >
              Забравена парола
            </button>
          )}
          {mode === 'reset' && (
            <button
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className="hover:text-foreground font-semibold"
            >
              Назад към Вход
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
