"use client"

import { useState, useEffect } from "react"
import SimpleAuth from "@/components/simple-auth"
import GameLobby from "@/components/game-lobby"
import LudoGame from "@/components/ludo-game"

interface User {
  id: string
  name: string
  timestamp: number
}

export default function SimplePage() {
  const [user, setUser] = useState<User | null>(null)
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem("ludoUser")
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        // Check if user data is less than 24 hours old
        if (Date.now() - userData.timestamp < 24 * 60 * 60 * 1000) {
          setUser(userData)
        } else {
          localStorage.removeItem("ludoUser")
        }
      } catch (error) {
        localStorage.removeItem("ludoUser")
      }
    }
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <SimpleAuth onLogin={(name) => setUser({ id: `user_${Date.now()}`, name, timestamp: Date.now() })} />
  }

  if (gameStarted && currentRoom) {
    return (
      <LudoGame
        roomId={currentRoom}
        onLeaveGame={() => {
          setGameStarted(false)
          setCurrentRoom(null)
        }}
      />
    )
  }

  return (
    <GameLobby
      onJoinRoom={(roomId) => {
        setCurrentRoom(roomId)
        setGameStarted(true)
      }}
    />
  )
}
