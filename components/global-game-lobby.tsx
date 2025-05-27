"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, LogOut, Gamepad2, Crown, Heart, Zap, Globe } from "lucide-react"
import { useGlobalSocket } from "@/lib/global-socket"
import type { Room } from "@/lib/supabase-client"

interface GlobalGameLobbyProps {
  onJoinRoom: (roomId: string) => void
}

export default function GlobalGameLobby({ onJoinRoom }: GlobalGameLobbyProps) {
  const { user, logout } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomName, setRoomName] = useState("")
  const [gameMode, setGameMode] = useState<"classic" | "speed" | "family">("family")
  const [isCreating, setIsCreating] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "error">("connecting")
  const socket = useGlobalSocket()

  useEffect(() => {
    if (!socket) return

    setConnectionStatus("connected")
    socket.emit("get-rooms")

    socket.on("rooms-list", (roomsList: Room[]) => {
      console.log("📋 Received global rooms:", roomsList)
      setRooms(roomsList)
    })

    socket.on("room-created", (room: Room) => {
      console.log("✅ Room created globally:", room)
      setRooms((prev) => [...prev, room])
      alert(`🌍 Room created globally! Room ID: ${room.id}\nShare this ID with players worldwide!`)
    })

    socket.on("room-joined", (roomId: string) => {
      console.log("✅ Joined global room:", roomId)
      onJoinRoom(roomId)
    })

    socket.on("room-updated", (updatedRoom: Room) => {
      setRooms((prev) => prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)))
    })

    socket.on("room-join-failed", (data: { message: string }) => {
      console.log("❌ Failed to join global room:", data.message)
      setIsJoining(false)

      // Show a more user-friendly error
      const errorDiv = document.createElement("div")
      errorDiv.className = "fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50"
      errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <span>❌</span>
          <div>
            <div class="font-semibold">Failed to Join Room</div>
            <div class="text-sm">${data.message}</div>
          </div>
        </div>
      `
      document.body.appendChild(errorDiv)

      setTimeout(() => {
        document.body.removeChild(errorDiv)
      }, 5000)
    })

    return () => {
      socket.off("rooms-list")
      socket.off("room-created")
      socket.off("room-joined")
      socket.off("room-updated")
      socket.off("room-join-failed")
    }
  }, [socket, onJoinRoom])

  const createRoom = () => {
    if (!socket || !roomName.trim()) return

    setIsCreating(true)
    console.log("🌍 Creating global room with name:", roomName.trim())
    socket.emit("create-room", {
      name: roomName.trim(),
      playerName: user?.name,
      gameMode,
    })

    setTimeout(() => setIsCreating(false), 2000)
  }

  const joinRoom = (roomId: string) => {
    if (!socket) return
    socket.emit("join-room", { roomId, playerName: user?.name })
  }

  const joinRoomById = () => {
    if (!socket || !joinRoomId.trim()) return

    setIsJoining(true)
    socket.emit("join-room", {
      roomId: joinRoomId.trim().toUpperCase(),
      playerName: user?.name,
    })

    setTimeout(() => setIsJoining(false), 2000)
  }

  const getGameModeIcon = (mode: string) => {
    switch (mode) {
      case "classic":
        return <Crown className="h-4 w-4" />
      case "speed":
        return <Zap className="h-4 w-4" />
      case "family":
        return <Heart className="h-4 w-4" />
      default:
        return <Gamepad2 className="h-4 w-4" />
    }
  }

  const getGameModeColor = (mode: string) => {
    switch (mode) {
      case "classic":
        return "bg-yellow-500"
      case "speed":
        return "bg-blue-500"
      case "family":
        return "bg-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Globe className="h-8 w-8 text-white animate-pulse" />
            <div>
              <h1 className="text-3xl font-bold text-white">Global Ludo Multiplayer</h1>
              <p className="text-white/70">Play with anyone, anywhere in the world! 🌍</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge
              variant={connectionStatus === "connected" ? "default" : "destructive"}
              className={connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"}
            >
              <Globe className="h-3 w-3 mr-1" />
              {connectionStatus === "connected" ? "Connected Globally" : "Connecting..."}
            </Badge>
            <span className="text-white">Welcome, {user?.name}</span>
            <Button
              variant="outline"
              onClick={logout}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Global Info Banner */}
        <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Globe className="h-6 w-6 text-green-400" />
              <div>
                <h3 className="text-white font-semibold">🌍 Worldwide Multiplayer Active!</h3>
                <p className="text-white/70 text-sm">
                  Rooms are now shared globally. Players from anywhere can join using Room IDs!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Room */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create Global Room
            </CardTitle>
            <CardDescription className="text-white/70">Create a room that players worldwide can join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Room name (e.g., 'Cousins Game Night')"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyPress={(e) => e.key === "Enter" && createRoom()}
                maxLength={30}
              />
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value as any)}
                className="bg-white/10 border border-white/20 text-white rounded px-3 py-2"
              >
                <option value="family" className="bg-gray-800">
                  Family Mode
                </option>
                <option value="classic" className="bg-gray-800">
                  Classic Mode
                </option>
                <option value="speed" className="bg-gray-800">
                  Speed Mode
                </option>
              </select>
              <Button
                onClick={createRoom}
                disabled={!roomName.trim() || isCreating}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {isCreating ? "Creating..." : "Create Global Room"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Join Room by ID */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Join Global Room by ID
            </CardTitle>
            <CardDescription className="text-white/70">
              Enter a Room ID shared by a player anywhere in the world
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter Room ID (e.g., ROOMABC123)"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyPress={(e) => e.key === "Enter" && joinRoomById()}
                maxLength={10}
              />
              <Button
                onClick={joinRoomById}
                disabled={!joinRoomId.trim() || isJoining}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {isJoining ? "Joining..." : "Join Global Room"}
              </Button>
            </div>
            <div className="text-white/60 text-sm">🌍 This works with Room IDs from players anywhere in the world!</div>
          </CardContent>
        </Card>

        {/* Available Global Rooms */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Global Rooms ({rooms.length})
            </CardTitle>
            <CardDescription className="text-white/70">Join rooms created by players worldwide</CardDescription>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-white/50 mx-auto mb-4 animate-pulse" />
                <p className="text-white/70">Loading global rooms...</p>
                <p className="text-white/50 text-sm mt-2">Connecting to worldwide players...</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room) => (
                  <Card key={room.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-white truncate">{room.name}</h3>
                            <p className="text-white/60 text-sm">🌍 ID: {room.id}</p>
                            <p className="text-white/50 text-xs">by {room.created_by}</p>
                          </div>
                          <Badge
                            variant={room.status === "waiting" ? "default" : "secondary"}
                            className={room.status === "waiting" ? "bg-green-500" : "bg-yellow-500"}
                          >
                            {room.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-white/70 text-sm flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {room.players.length}/{room.max_players}
                            </span>
                            <Badge
                              variant="outline"
                              className={`${getGameModeColor(room.game_mode)} text-white border-0 text-xs`}
                            >
                              {getGameModeIcon(room.game_mode)}
                              <span className="ml-1">{room.game_mode}</span>
                            </Badge>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => joinRoom(room.id)}
                            disabled={room.players.length >= room.max_players || room.status === "playing"}
                            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                          >
                            Join
                          </Button>
                        </div>

                        {room.players.length > 0 && (
                          <div className="text-white/60 text-xs">Players: {room.players.join(", ")}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
