"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Crown, Heart, Zap, Copy, Check, MessageSquare, Play, UserPlus, Clock, Gamepad2 } from "lucide-react"

interface WaitingRoomProps {
  roomId: string
  roomName: string
  gameMode: "classic" | "speed" | "family"
  players: string[]
  maxPlayers: number
  isHost: boolean
  onStartGame: () => void
  onLeaveRoom: () => void
  socket: any
}

export default function WaitingRoom({
  roomId,
  roomName,
  gameMode,
  players,
  maxPlayers,
  isHost,
  onStartGame,
  onLeaveRoom,
  socket,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteLink(`${window.location.origin}?join=${roomId}`)
    }
  }, [roomId])

  const copyInviteLink = () => {
    const message = `🎲 Join my Ludo game!

Room: ${roomName}
Mode: ${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}
Room ID: ${roomId}

Click here: ${inviteLink}`

    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startGame = () => {
    if (socket && players.length >= 2) {
      socket.emit("start-game", { roomId })
      onStartGame()
    }
  }

  const getGameModeIcon = (mode: string) => {
    switch (mode) {
      case "family":
        return Heart
      case "classic":
        return Crown
      case "speed":
        return Zap
      default:
        return Gamepad2
    }
  }

  const getPlayerColor = (index: number) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"]
    return colors[index] || "bg-gray-500"
  }

  const GameModeIcon = getGameModeIcon(gameMode)
  const canStartGame = players.length >= 2 && isHost

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Waiting Room</h1>
          <p className="text-white/70">Get ready for an epic Ludo battle!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Room Info */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <GameModeIcon className="h-6 w-6 mr-2" />
                {roomName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-white/70 text-sm">Room ID</p>
                  <p className="text-white font-bold text-lg">{roomId}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <p className="text-white/70 text-sm">Game Mode</p>
                  <Badge className="bg-blue-500 text-white">
                    <GameModeIcon className="h-3 w-3 mr-1" />
                    {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={copyInviteLink}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                >
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? "Copied!" : "Copy Invite Link"}
                </Button>

                <Button
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`🎲 Join my Ludo game!\n\nRoom: ${roomName}\nRoom ID: ${roomId}\n\nClick here: ${inviteLink}`)}`
                    window.open(whatsappUrl, "_blank")
                  }}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Share on WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-6 w-6 mr-2" />
                  Players ({players.length}/{maxPlayers})
                </span>
                {isHost && (
                  <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500 text-yellow-300">
                    <Crown className="h-3 w-3 mr-1" />
                    Host
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: maxPlayers }, (_, index) => {
                  const player = players[index]
                  const isEmpty = !player

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 border-dashed ${
                        isEmpty ? "border-white/30 bg-white/5" : "border-white/50 bg-white/10"
                      }`}
                    >
                      {isEmpty ? (
                        <div className="text-center">
                          <UserPlus className="h-8 w-8 text-white/50 mx-auto mb-2" />
                          <p className="text-white/50 text-sm">Waiting for player...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Avatar className="mx-auto mb-2">
                            <AvatarFallback className={`${getPlayerColor(index)} text-white`}>
                              {player.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-white font-medium">{player}</p>
                          {index === 0 && isHost && (
                            <Badge
                              variant="outline"
                              className="text-xs mt-1 bg-yellow-500/20 border-yellow-500 text-yellow-300"
                            >
                              Host
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {players.length < 2 && (
                <div className="bg-yellow-500/20 p-3 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-300" />
                    <span className="text-yellow-300 font-medium">Waiting for more players</span>
                  </div>
                  <p className="text-yellow-200 text-sm mt-1">
                    Need at least 2 players to start the game. Share the invite link!
                  </p>
                </div>
              )}

              {canStartGame && (
                <Button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg py-3"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Game!
                </Button>
              )}

              <Button
                onClick={onLeaveRoom}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Leave Room
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
