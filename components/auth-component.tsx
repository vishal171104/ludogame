"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gamepad2, Users, Mic, AlertCircle } from "lucide-react"

interface AuthComponentProps {
  onLogin: (name: string) => void
}

export default function AuthComponent({ onLogin }: AuthComponentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!name.trim()) {
      setError("Please enter your name")
      return
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Simulate a brief loading time for better UX
      await new Promise((resolve) => setTimeout(resolve, 500))
      onLogin(name.trim())
    } catch (error) {
      setError("Failed to join. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
              <Gamepad2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">Ludo Multiplayer</h1>
          <p className="text-white/80">Join the ultimate online Ludo experience</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white">Get Started</CardTitle>
            <CardDescription className="text-white/70">Enter your name to join the game</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                disabled={isLoading}
                maxLength={20}
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={!name.trim() || isLoading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
            >
              {isLoading ? "Joining..." : "Join Game"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Users className="h-6 w-6 text-white mx-auto" />
            </div>
            <p className="text-white/80 text-sm">Multiplayer</p>
          </div>
          <div className="space-y-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Mic className="h-6 w-6 text-white mx-auto" />
            </div>
            <p className="text-white/80 text-sm">Voice Chat</p>
          </div>
          <div className="space-y-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <Gamepad2 className="h-6 w-6 text-white mx-auto" />
            </div>
            <p className="text-white/80 text-sm">Real-time</p>
          </div>
        </div>
      </div>
    </div>
  )
}
