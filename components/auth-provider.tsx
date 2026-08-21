'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, authPersistence, db } from '@/lib/firebase-client'
import type { UserProfile } from '@/lib/store-types'

type AuthContextValue = {
  loading: boolean
  user: User | null
  profile: UserProfile | null
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  toggleFavorite: (productId: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null)
      return
    }
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid))
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile)
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    }
  }

  useEffect(() => {
    let active = true
    authPersistence.catch(() => undefined)

    return onAuthStateChanged(auth, async (next) => {
      if (!active) return
      setUser(next)
      if (next) {
        let nextProfile: UserProfile | null = null
        try {
          const snap = await getDoc(doc(db, 'users', next.uid))
          if (snap.exists()) {
            nextProfile = snap.data() as UserProfile
          }
        } catch {
          nextProfile = null
        }
        setProfile(nextProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const toggleFavorite = async (productId: string): Promise<boolean> => {
    if (!auth.currentUser) return false
    const currentFavs = profile?.favorites ?? []
    const isFav = currentFavs.includes(productId)
    const nextFavs = isFav
      ? currentFavs.filter((id) => id !== productId)
      : [...currentFavs, productId]

    // Optimistically update local profile
    setProfile((prev) => (prev ? { ...prev, favorites: nextFavs } : { favorites: nextFavs }))

    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        { favorites: nextFavs, updatedAt: new Date() },
        { merge: true }
      )
      return true
    } catch (err) {
      console.error('Failed to sync favorite with Firestore:', err)
      return false
    }
  }

  const logout = async () => {
    await signOut(auth)
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined)
    setProfile(null)
  }

  const value = useMemo(
    () => ({
      loading,
      user,
      profile,
      logout,
      refreshProfile,
      toggleFavorite,
    }),
    [loading, user, profile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
