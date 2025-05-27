"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Plus, LogOut, Gamepad2, Crown, Star, Zap, Heart, Copy, Check, MessageSquare } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

interface Room {
  id: string
  name: string
  players: string[]
  maxPlayers: number
  status: "waiting" | "playing"
  gameMode: "classic" | "speed" | "family"
  difficulty: "easy" | "medium" | "hard"
  createdBy: string
}

interface EnhancedMultiplayerLobbyProps {
  onJoinRoom: (roomId: string) => void
}

export default function EnhancedMultiplayerLobby({ onJoinRoom }: EnhancedMultiplayerLobbyProps) {
  const { user, logout } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomName, setRoomName] = useState("")
  const [gameMode, setGameMode] = useState<"classic" | "speed" | "family">("family")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [isCreating, setIsCreating] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [copied, setCopied] = useState(false)
  const socket = useSocket()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [createdRoomId, setCreatedRoomId] = useState("")
  const [inviteLink, setInviteLink] = useState("")

  useEffect(() => {
    if (!socket) return

    socket.emit("get-rooms")

    socket.on("rooms-list", (roomsList: Room[]) => {
      setRooms(roomsList)
    })

    // Update the room creation success handler
    socket.on("room-created", (room: Room) => {
      setRooms((prev) => [...prev, room])
      setCreatedRoomId(room.id)
      setInviteLink(`${window.location.origin}?join=${room.id}`)
      setShowInviteModal(true)
      // Don't auto-join, let user invite cousins first
    })

    socket.on("room-joined", (roomId: string) => {
      onJoinRoom(roomId)
    })

    return () => {
      socket.off("rooms-list")
      socket.off("room-created")
      socket.off("room-joined")
    }
  }, [socket, onJoinRoom])

  const createRoom = () => {
    if (!socket || !roomName.trim()) return

    setIsCreating(true)
    socket.emit("create-room", {
      name: roomName.trim(),
      playerName: user?.name,
      gameMode,
      difficulty,
      maxPlayers: 4,
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

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(`Join my Ludo game! Room ID: ${inviteCode}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-orange-500"
      case "hard":
        return "bg-red-500"
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
            <div>
              <h1 className="text-3xl font-bold text-white">Ludo Multiplayer</h1>
              <p className="text-white/70">Perfect for family gaming sessions!</p>
            </div>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Create Room */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Game Room
                </CardTitle>
                <CardDescription className="text-white/70">Start a new game for your cousins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Room name (e.g., 'Cousins Game Night')"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  maxLength={30}
                />

                <Tabs value={gameMode} onValueChange={(value) => setGameMode(value as any)}>
                  <TabsList className="grid w-full grid-cols-3 bg-white/10">
                    <TabsTrigger value="family" className="text-xs">
                      <Heart className="h-3 w-3 mr-1" />
                      Family
                    </TabsTrigger>
                    <TabsTrigger value="classic" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Classic
                    </TabsTrigger>
                    <TabsTrigger value="speed" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Speed
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <label className="text-white text-sm">AI Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["easy", "medium", "hard"].map((diff) => (
                      <Button
                        key={diff}
                        variant={difficulty === diff ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDifficulty(diff as any)}
                        className={`${
                          difficulty === diff
                            ? getDifficultyColor(diff)
                            : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        }`}
                      >
                        {diff}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={createRoom}
                  disabled={!roomName.trim() || isCreating}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {isCreating ? "Creating..." : "Create Room"}
                </Button>

                {showInviteModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md bg-white">
                      <CardHeader>
                        <CardTitle className="text-center">🎉 Room Created!</CardTitle>
                        <CardDescription className="text-center">Invite your cousins to join the game</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <p className="text-sm font-medium">Room ID:</p>
                          <p className="text-lg font-bold text-blue-600">{createdRoomId}</p>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(inviteLink)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                            }}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                          >
                            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                            Copy Invite Link
                          </Button>

                          <Button
                            onClick={() => {
                              const message = `Hey! Join my Ludo game! 🎲\n\nRoom: ${roomName}\nRoom ID: ${createdRoomId}\n\nClick here: ${inviteLink}`
                              navigator.clipboard.writeText(message)
                              setCopied(true)
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Copy WhatsApp Message
                          </Button>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => {
                              setShowInviteModal(false)
                              onJoinRoom(createdRoomId)
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-600"
                          >
                            Join Room
                          </Button>
                          <Button onClick={() => setShowInviteModal(false)} variant="outline" className="flex-1">
                            Wait for Cousins
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {inviteCode && (
                  <div className="bg-white/10 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm font-medium">Room Created!</p>
                        <p className="text-white/70 text-xs">Share with cousins:</p>
                      </div>
                      <Button size="sm" onClick={copyInviteCode} className="bg-white/20 hover:bg-white/30">
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Available Rooms */}
          <div className="lg:col-span-2">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Available Game Rooms
                </CardTitle>
                <CardDescription className="text-white/70">
                  Join existing games or wait for cousins to join yours
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <Gamepad2 className="h-12 w-12 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">No rooms available. Create one to get started!</p>
                    <p className="text-white/50 text-sm mt-2">Perfect time to start a family game session</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {rooms.map((room) => (
                      <Card key={room.id} className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="font-semibold text-white truncate">{room.name}</h3>
                                <p className="text-white/60 text-sm">Created by {room.createdBy}</p>
                              </div>
                              <div className="flex space-x-2">
                                <Badge
                                  variant="outline"
                                  className={`${getGameModeColor(room.gameMode)} text-white border-0`}
                                >
                                  {getGameModeIcon(room.gameMode)}
                                  <span className="ml-1 capitalize">{room.gameMode}</span>
                                </Badge>
                                <Badge
                                  variant={room.status === "waiting" ? "default" : "secondary"}
                                  className={room.status === "waiting" ? "bg-green-500" : "bg-yellow-500"}
                                >
                                  {room.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <span className="text-white/70 text-sm flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {room.players.length}/{room.maxPlayers}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`${getDifficultyColor(room.difficulty)} text-white border-0 text-xs`}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  {room.difficulty}
                                </Badge>
                              </div>

                              <Button
                                size="sm"
                                onClick={() => joinRoom(room.id)}
                                disabled={room.players.length >= room.maxPlayers || room.status === "playing"}
                                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                              >
                                {room.status === "playing" ? "In Progress" : "Join Game"}
                              </Button>
                            </div>

                            {room.players.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {room.players.map((player, index) => (
                                  <Badge key={index} variant="outline" className="text-xs bg-white/10 text-white">
                                    {player}
                                  </Badge>
                                ))}
                              </div>
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

        {/* Game Modes Info */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Game Modes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-pink-500/20 p-4 rounded-lg border border-pink-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Heart className="h-5 w-5 text-pink-400" />
                  <h3 className="font-semibold text-white">Family Mode</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Perfect for cousins! Relaxed gameplay with helpful hints and no time pressure.
                </p>
              </div>

              <div className="bg-yellow-500/20 p-4 rounded-lg border border-yellow-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-semibold text-white">Classic Mode</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Traditional Ludo rules with strategic AI opponents and standard gameplay.
                </p>
              </div>

              <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500/30">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-white">Speed Mode</h3>
                </div>
                <p className="text-white/70 text-sm">
                  Fast-paced games with turn timers. Quick decisions and exciting gameplay!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
