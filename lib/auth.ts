"use client"

export interface User {
  id: string
  name: string
  email: string
  timestamp: number
}

export class AuthManager {
  private static readonly STORAGE_KEY = "ludo_user"
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

  static saveUser(name: string): User {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      email: `${name.toLowerCase().replace(/\s+/g, "")}@guest.local`,
      timestamp: Date.now(),
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
    }

    return user
  }

  static getUser(): User | null {
    if (typeof window === "undefined") return null

    try {
      const userData = localStorage.getItem(this.STORAGE_KEY)
      if (!userData) return null

      const user: User = JSON.parse(userData)

      // Check if session is still valid
      if (Date.now() - user.timestamp > this.SESSION_DURATION) {
        this.clearUser()
        return null
      }

      return user
    } catch (error) {
      this.clearUser()
      return null
    }
  }

  static clearUser(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY)
    }
  }

  static isAuthenticated(): boolean {
    return this.getUser() !== null
  }
}
