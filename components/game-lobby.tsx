"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, LogOut, Gamepad2, Crown, Heart, Zap } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface Room {
  id: string
  name: string
  players: string[]
  maxPlayers: number
  status: "waiting" | "playing"
  gameMode: "classic" | "speed" | "family"
  createdBy: string
}

interface GameLobbyProps {
  onJoinRoom: (roomId: string) => void
}

export default function GameLobby({ onJoinRoom }: GameLobbyProps) {
  const { user, logout } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomName, setRoomName] = useState("")
  const [gameMode, setGameMode] = useState<"classic" | "speed" | "family">("family")
  const [isCreating, setIsCreating] = useState(false)
  const [joinRoomId, setJoinRoomId] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.emit("get-rooms")

    socket.on("rooms-list", (roomsList: Room[]) => {
      setRooms(roomsList)
    })

    socket.on("room-created", (room: Room) => {
      setRooms((prev) => [...prev, room])
      onJoinRoom(room.id)
    })

    socket.on("room-joined", (roomId: string) => {
      onJoinRoom(roomId)
    })

    socket.on("room-updated", (updatedRoom: Room) => {
      setRooms((prev) => prev.map((room) => (room.id === updatedRoom.id ? updatedRoom : room)))
    })

    socket.on("room-join-failed", (data: { message: string }) => {
      console.log("❌ Failed to join room:", data.message)
      setIsJoining(false)
      alert(data.message)
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
    socket.emit("create-room", {
      name: roomName.trim(),
      playerName: user?.name,
      gameMode,
    })

    setTimeout(() => setIsCreating(false), 1000)
  }

  const joinRoom = (roomId: string) => {
    if (!socket) return

    socket.emit("join-room", {
      roomId,
      playerName: user?.name,
    })
  }

  const joinRoomById = () => {
    if (!socket || !joinRoomId.trim()) return

    setIsJoining(true)
    socket.emit("join-room", {
      roomId: joinRoomId.trim(),
      playerName: user?.name,
    })

    setTimeout(() => setIsJoining(false), 1000)
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
            <Gamepad2 className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Ludo Multiplayer</h1>
          </div>
          <div className="flex items-center space-x-4">
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

        {/* Create Room */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New Room
            </CardTitle>
            <CardDescription className="text-white/70">Start a new game and invite friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Room name"
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
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Join Room by ID */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Join Room by ID
            </CardTitle>
            <CardDescription className="text-white/70">Enter a room ID to join directly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyPress={(e) => e.key === "Enter" && joinRoomById()}
                maxLength={20}
              />
              <Button
                onClick={joinRoomById}
                disabled={!joinRoomId.trim() || isJoining}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {isJoining ? "Joining..." : "Join"}
              </Button>
            </div>
            <div className="text-white/60 text-sm">💡 Get the Room ID from your friend who created the room</div>
          </CardContent>
        </Card>

        {/* Available Rooms */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Available Rooms
            </CardTitle>
            <CardDescription className="text-white/70">Join an existing game room</CardDescription>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/70">No rooms available. Create one to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rooms.map((room) => (
                  <Card key={room.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-white truncate">{room.name}</h3>
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
                              {room.players.length}/{room.maxPlayers}
                            </span>
                            <Badge
                              variant="outline"
                              className={`${getGameModeColor(room.gameMode)} text-white border-0 text-xs`}
                            >
                              {getGameModeIcon(room.gameMode)}
                              <span className="ml-1">{room.gameMode}</span>
                            </Badge>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => joinRoom(room.id)}
                            disabled={room.players.length >= room.maxPlayers || room.status === "playing"}
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
