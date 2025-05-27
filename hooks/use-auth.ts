"use client"

import { useState, useEffect } from "react"
import { AuthManager, type User } from "@/lib/auth"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = AuthManager.getUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = (name: string) => {
    const newUser = AuthManager.saveUser(name)
    setUser(newUser)
    return newUser
  }

  const logout = () => {
    AuthManager.clearUser()
    setUser(null)
  }

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }
}
