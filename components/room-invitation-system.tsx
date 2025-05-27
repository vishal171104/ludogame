"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Copy, Check, MessageSquare, Mail, Users, Clock, Crown, Heart, Zap } from "lucide-react"

interface RoomInvitationProps {
  roomId: string
  roomName: string
  gameMode: "classic" | "speed" | "family"
  onJoinRoom: () => void
  onClose: () => void
}

export default function RoomInvitationSystem({ roomId, roomName, gameMode, onJoinRoom, onClose }: RoomInvitationProps) {
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [waitingPlayers, setWaitingPlayers] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteLink(`${window.location.origin}?join=${roomId}`)
    }
  }, [roomId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getGameModeEmoji = (mode: string) => {
    switch (mode) {
      case "family":
        return "👨‍👩‍👧‍👦"
      case "classic":
        return "👑"
      case "speed":
        return "⚡"
      default:
        return "🎲"
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
        return Users
    }
  }

  const whatsappMessage = `🎲 *Ludo Game Invitation* 🎲

Hey cousin! Join my Ludo game! 

🎮 *Room:* ${roomName}
${getGameModeEmoji(gameMode)} *Mode:* ${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}
🆔 *Room ID:* ${roomId}

Click to join: ${inviteLink}

Let's have some fun! 🎯`

  const emailSubject = `Join my Ludo game - ${roomName}`
  const emailBody = `Hi!

You're invited to join my Ludo game!

Room: ${roomName}
Mode: ${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}
Room ID: ${roomId}

Click here to join: ${inviteLink}

See you in the game!`

  const GameModeIcon = getGameModeIcon(gameMode)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex justify-center mb-2">
            <div className="bg-white/20 rounded-full p-3">
              <GameModeIcon className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">🎉 Room Created!</CardTitle>
          <p className="text-white/90">Invite your cousins to join the fun</p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Room Details */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-2">Room Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Room Name:</span>
                <span className="font-medium">{roomName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Game Mode:</span>
                <Badge className="bg-blue-500">
                  <GameModeIcon className="h-3 w-3 mr-1" />
                  {gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Room ID:</span>
                <span className="font-bold text-blue-600 text-lg">{roomId}</span>
              </div>
            </div>
          </div>

          {/* Quick Share Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Share with Cousins</h3>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => copyToClipboard(inviteLink)} className="bg-blue-500 hover:bg-blue-600 text-white">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy Link
              </Button>

              <Button
                onClick={() => copyToClipboard(whatsappMessage)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>

              <Button
                onClick={() => {
                  window.open(
                    `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
                  )
                }}
                variant="outline"
                className="col-span-2"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email Invitation
              </Button>
            </div>
          </div>

          {/* Manual Share */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Or Share Manually</h3>
            <div className="bg-gray-50 p-3 rounded-lg">
              <Input value={inviteLink} readOnly className="bg-white" onClick={(e) => e.currentTarget.select()} />
            </div>
          </div>

          {/* Waiting Status */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Waiting for Players</span>
            </div>
            <p className="text-yellow-700 text-sm">
              Share the room details above with your cousins. The game will start when everyone joins!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={onJoinRoom}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Join Room Now
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Wait for Cousins
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-1">💡 Pro Tips:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Share the WhatsApp message for easiest joining</li>
              <li>• Family mode is perfect for mixed skill levels</li>
              <li>• Enable voice chat for more fun!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
