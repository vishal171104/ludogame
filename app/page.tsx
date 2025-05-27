"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import AuthComponent from "@/components/auth-component"
import GlobalGameLobby from "@/components/global-game-lobby"
import WaitingRoom from "@/components/waiting-room"
import FixedLudoGame from "@/components/fixed-ludo-game"
import { useGlobalSocket } from "@/lib/global-socket"

export default function HomePage() {
  const { user, loading, login, logout } = useAuth()
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [roomData, setRoomData] = useState<any>(null)
  const socket = useGlobalSocket()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!socket) return

    socket.on("room-updated", (room: any) => {
      if (room.id === currentRoom) {
        setRoomData(room)
      }
    })

    socket.on("game-started", () => {
      setGameStarted(true)
    })

    return () => {
      socket.off("room-updated")
      socket.off("game-started")
    }
  }, [socket, currentRoom])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <div className="text-white text-xl">🌍 Connecting to Global Ludo Network...</div>
          <div className="text-white/70 text-sm">Setting up worldwide multiplayer...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthComponent onLogin={login} />
  }

  if (gameStarted && currentRoom) {
    return (
      <FixedLudoGame
        roomId={currentRoom}
        onLeaveGame={() => {
          setGameStarted(false)
          setCurrentRoom(null)
          setRoomData(null)
        }}
      />
    )
  }

  if (currentRoom && roomData) {
    const isHost = roomData.players[0] === user.name

    return (
      <WaitingRoom
        roomId={currentRoom}
        roomName={roomData.name}
        gameMode={roomData.game_mode}
        players={roomData.players}
        maxPlayers={roomData.max_players}
        isHost={isHost}
        onStartGame={() => setGameStarted(true)}
        onLeaveRoom={() => {
          setCurrentRoom(null)
          setRoomData(null)
        }}
        socket={socket}
      />
    )
  }

  return (
    <GlobalGameLobby
      onJoinRoom={(roomId) => {
        setCurrentRoom(roomId)
      }}
    />
  )
}
