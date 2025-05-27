"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  SkipForward,
  RotateCcw,
  Bot,
  Brain,
  Zap,
  Crown,
  Heart,
  Timer,
  MessageSquare,
} from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import { useVoiceChat } from "@/hooks/use-voice-chat"
import LudoBoard from "./ludo-board"
import GroqGameAssistant from "./groq-game-assistant"
import type { GameState } from "@/lib/ludo-game-logic"
import { LudoGameLogic } from "@/lib/ludo-game-logic"

interface EnhancedLudoGameProps {
  roomId: string
  gameMode: "classic" | "speed" | "family"
  onLeaveGame: () => void
}

const diceIcons = {
  1: Dice1,
  2: Dice2,
  3: Dice3,
  4: Dice4,
  5: Dice5,
  6: Dice6,
}

const aiIcons = {
  easy: Bot,
  medium: Brain,
  hard: Zap,
}

const gameModeIcons = {
  classic: Crown,
  speed: Timer,
  family: Heart,
}

export default function EnhancedLudoGame({ roomId, gameMode, onLeaveGame }: EnhancedLudoGameProps) {
  const { user } = useAuth()
  const socket = useSocket()
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayer: 0,
    diceValue: 0,
    gameStatus: "waiting",
    moveCompleted: true,
    canRollAgain: false,
  })
  const [isRolling, setIsRolling] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null)
  const [message, setMessage] = useState<string>("")
  const [validMoves, setValidMoves] = useState<number[]>([])
  const [aiThinking, setAiThinking] = useState<string>("")
  const [showAssistant, setShowAssistant] = useState(false)
  const [gameHistory, setGameHistory] = useState<string[]>([])
  const [turnTimer, setTurnTimer] = useState<number>(0)

  const {
    isConnected: voiceConnected,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    connectToRoom,
    disconnectFromRoom,
  } = useVoiceChat(roomId)

  // Turn timer for speed mode
  useEffect(() => {
    if (gameMode === "speed" && gameState.gameStatus === "playing") {
      const currentPlayerData = gameState.players[gameState.currentPlayer]
      const isMyTurn = currentPlayerData?.name === user?.name

      if (isMyTurn && LudoGameLogic.canPlayerRoll(gameState, gameState.currentPlayer)) {
        setTurnTimer(30) // 30 seconds per turn in speed mode

        const timer = setInterval(() => {
          setTurnTimer((prev) => {
            if (prev <= 1) {
              // Auto-skip turn when timer runs out
              if (socket) {
                socket.emit("skip-turn", { roomId })
              }
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(timer)
      }
    }
  }, [gameState.currentPlayer, gameState.gameStatus, gameMode, user?.name, socket, roomId])

  useEffect(() => {
    if (!socket) return

    console.log("🎮 Setting up enhanced game socket listeners")

    // Join the game room
    socket.emit("join-game", { roomId, playerName: user?.name, gameMode })

    // Connect to voice chat
    connectToRoom()

    socket.on("game-state", (state: GameState) => {
      console.log("📊 Received game state:", state)
      setGameState(state)

      const currentPlayerData = state.players[state.currentPlayer]
      const isMyTurn = currentPlayerData?.name === user?.name

      console.log("🎯 Is my turn:", isMyTurn, "Can roll:", LudoGameLogic.canPlayerRoll(state, state.currentPlayer))

      // Calculate valid moves if it's my turn and I've rolled
      if (isMyTurn && state.diceValue > 0) {
        const moves = LudoGameLogic.getValidMoves(state, state.currentPlayer)
        setValidMoves(moves)
        console.log("🎯 Valid moves for current player:", moves)

        if (moves.length > 0) {
          setMessage(`You rolled ${state.diceValue}! Click a glowing piece to move.`)
        }
      } else {
        setValidMoves([])
      }

      // Clear AI thinking when game state updates
      setAiThinking("")
    })

    socket.on("dice-rolled", (value: number) => {
      console.log("🎲 Dice rolled event:", value)
      setIsRolling(false)

      const currentPlayerData = gameState.players[gameState.currentPlayer]
      const isAI = currentPlayerData && !currentPlayerData.name.includes(user?.name || "")

      if (value === 6) {
        if (isAI) {
          setMessage(`${currentPlayerData.name} rolled a ${value}!`)
          addToHistory(`${currentPlayerData.name} rolled a 6!`)
        } else {
          setMessage(`You rolled a ${value}! Move a piece, then you can roll again!`)
          addToHistory(`You rolled a 6!`)
        }
      } else {
        if (isAI) {
          setMessage(`${currentPlayerData.name} rolled a ${value}`)
          addToHistory(`${currentPlayerData.name} rolled ${value}`)
        } else {
          setMessage(`You rolled a ${value}!`)
          addToHistory(`You rolled ${value}`)
        }
      }

      setTimeout(() => {
        if (validMoves.length === 0) {
          setMessage("")
        }
      }, 4000)
    })

    socket.on("ai-thinking", (data: { player: string; action: string }) => {
      console.log("🤖 AI thinking:", data)
      setAiThinking(`${data.player} is ${data.action}...`)
    })

    socket.on("ai-move", (data: { player: string; piece: number; reason: string }) => {
      console.log("🤖 AI move:", data)
      setMessage(`${data.player} moved piece ${data.piece + 1}: ${data.reason}`)
      addToHistory(`${data.player}: ${data.reason}`)
      setAiThinking("")
      setTimeout(() => setMessage(""), 3000)
    })

    socket.on("piece-captured", (data: { capturer: string; captured: string }) => {
      setMessage(`${data.capturer} captured ${data.captured}'s piece!`)
      addToHistory(`${data.capturer} captured ${data.captured}!`)
      setTimeout(() => setMessage(""), 3000)
    })

    socket.on("dice-six-rolled", (data: { message: string }) => {
      console.log("🎲 Six rolled event:", data)
      setMessage(data.message)
      setTimeout(() => setMessage(""), 4000)
    })

    socket.on("piece-moved", (newState: GameState) => {
      console.log("🚀 Piece moved event, new state:", newState)
      setGameState(newState)
      setSelectedPiece(null)
      setValidMoves([])
      setTurnTimer(0) // Reset timer after move

      const currentPlayerData = newState.players[newState.currentPlayer]
      const isMyMove = currentPlayerData?.name === user?.name

      if (isMyMove) {
        setMessage("Piece moved successfully!")
        setTimeout(() => setMessage(""), 2000)
      }
    })

    socket.on("roll-again", (data: { message: string }) => {
      console.log("🎲 Roll again event:", data)
      setMessage(data.message)
      setTimeout(() => setMessage(""), 4000)
    })

    socket.on("game-finished", (winner: string) => {
      console.log("🏆 Game finished:", winner)
      setGameState((prev) => ({ ...prev, gameStatus: "finished", winner }))
      setMessage(`🎉 ${winner} wins the game! 🎉`)
      addToHistory(`🏆 ${winner} wins the game!`)
      setAiThinking("")
      setTurnTimer(0)
    })

    socket.on("no-valid-moves", (data: { message: string }) => {
      console.log("❌ No valid moves:", data)
      setMessage(data.message)
      setTimeout(() => setMessage(""), 4000)
    })

    socket.on("invalid-move", (data: { message: string }) => {
      console.log("❌ Invalid move:", data)
      setMessage(data.message)
      setTimeout(() => setMessage(""), 2000)
    })

    socket.on("invalid-action", (data: { message: string }) => {
      console.log("❌ Invalid action:", data)
      setMessage(data.message)
      setTimeout(() => setMessage(""), 2000)
    })

    return () => {
      console.log("🧹 Cleaning up enhanced game socket listeners")
      socket.off("game-state")
      socket.off("dice-rolled")
      socket.off("ai-thinking")
      socket.off("ai-move")
      socket.off("piece-captured")
      socket.off("dice-six-rolled")
      socket.off("piece-moved")
      socket.off("roll-again")
      socket.off("game-finished")
      socket.off("no-valid-moves")
      socket.off("invalid-move")
      socket.off("invalid-action")
      disconnectFromRoom()
    }
  }, [
    socket,
    roomId,
    user?.name,
    gameMode,
    connectToRoom,
    disconnectFromRoom,
    validMoves,
    gameState.currentPlayer,
    gameState.players,
    gameState.gameStatus,
  ])

  const addToHistory = (event: string) => {
    setGameHistory((prev) => [...prev.slice(-9), event]) // Keep last 10 events
  }

  const rollDice = useCallback(() => {
    if (!socket || isRolling) return

    const currentPlayerData = gameState.players[gameState.currentPlayer]
    const isMyTurn = currentPlayerData?.name === user?.name
    const canRoll = LudoGameLogic.canPlayerRoll(gameState, gameState.currentPlayer)

    console.log("🎲 Attempting to roll dice:", { isMyTurn, canRoll, gameState })

    if (!isMyTurn || !canRoll) {
      setMessage("It's not your turn to roll!")
      setTimeout(() => setMessage(""), 2000)
      return
    }

    setIsRolling(true)
    setMessage("")
    setTurnTimer(0) // Reset timer when rolling
    console.log("🎲 Emitting roll-dice event")
    socket.emit("roll-dice", { roomId })
  }, [socket, isRolling, gameState, user?.name, roomId])

  const movePiece = useCallback(
    (pieceIndex: number) => {
      if (!socket || gameState.diceValue === 0) {
        console.log("❌ Cannot move piece: no dice rolled")
        return
      }

      const currentPlayerData = gameState.players[gameState.currentPlayer]
      const isMyTurn = currentPlayerData?.name === user?.name

      if (!isMyTurn) {
        setMessage("It's not your turn!")
        setTimeout(() => setMessage(""), 2000)
        return
      }

      console.log("🚀 Moving piece:", pieceIndex)
      setSelectedPiece(pieceIndex)
      socket.emit("move-piece", { roomId, pieceIndex })
    },
    [socket, gameState.diceValue, gameState.currentPlayer, gameState.players, user?.name, roomId],
  )

  const skipTurn = useCallback(() => {
    if (!socket) return

    console.log("⏭️ Skipping turn")
    setMessage("Turn skipped")
    addToHistory("Turn skipped")
    setTurnTimer(0)
    socket.emit("skip-turn", { roomId })
    setTimeout(() => setMessage(""), 2000)
  }, [socket, roomId])

  const handleLeaveGame = () => {
    console.log("👋 Leaving game")
    if (socket) {
      socket.emit("leave-game", { roomId })
    }
    disconnectFromRoom()
    onLeaveGame()
  }

  const DiceIcon = diceIcons[gameState.diceValue as keyof typeof diceIcons] || Dice1
  const GameModeIcon = gameModeIcons[gameMode]
  const currentPlayer = gameState.players[gameState.currentPlayer]
  const isMyTurn = currentPlayer?.name === user?.name
  const canRoll = LudoGameLogic.canPlayerRoll(gameState, gameState.currentPlayer)

  const getPlayerType = (playerName: string) => {
    if (playerName === user?.name) return "human"
    if (playerName.includes("Easy")) return "easy"
    if (playerName.includes("Medium")) return "medium"
    if (playerName.includes("Hard")) return "hard"
    return "ai"
  }

  const getAIIcon = (playerName: string) => {
    const type = getPlayerType(playerName)
    return aiIcons[type as keyof typeof aiIcons] || Bot
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleLeaveGame}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Game
            </Button>

            <div className="flex items-center space-x-2">
              <GameModeIcon className="h-5 w-5 text-white" />
              <span className="text-white font-medium capitalize">{gameMode} Mode</span>
              {gameMode === "speed" && turnTimer > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {turnTimer}s
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Message Display */}
            {(message || aiThinking) && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg max-w-md">
                <span className="text-white font-medium text-sm">
                  {aiThinking && (
                    <span className="flex items-center">
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      {aiThinking}
                    </span>
                  )}
                  {!aiThinking && message}
                </span>
              </div>
            )}

            {/* Voice Chat Controls */}
            <div className="flex items-center space-x-2">
              <Badge variant={voiceConnected ? "default" : "secondary"} className="bg-green-500">
                Voice Chat {voiceConnected ? "Connected" : "Disconnected"}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleMute}
                className={`${isMuted ? "bg-red-500/20 border-red-500" : "bg-white/10 border-white/20"} text-white`}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleDeafen}
                className={`${isDeafened ? "bg-red-500/20 border-red-500" : "bg-white/10 border-white/20"} text-white`}
              >
                {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-3">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <LudoBoard
                  gameState={gameState}
                  onPieceClick={movePiece}
                  selectedPiece={selectedPiece}
                  canMove={isMyTurn && gameState.diceValue > 0}
                  validMoves={validMoves}
                />
              </CardContent>
            </Card>
          </div>

          {/* Game Controls & Info */}
          <div className="space-y-4">
            {/* Current Turn */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <h3 className="text-white font-semibold mb-2">Current Turn</h3>
                {currentPlayer && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <Badge
                        className={`bg-${currentPlayer.color}-500 text-white`}
                        style={{ backgroundColor: currentPlayer.color }}
                      >
                        {currentPlayer.name}
                      </Badge>
                      {getPlayerType(currentPlayer.name) !== "human" && (
                        <div className="text-white/70">
                          {React.createElement(getAIIcon(currentPlayer.name), { className: "h-4 w-4" })}
                        </div>
                      )}
                    </div>
                    {isMyTurn && (
                      <div className="space-y-1">
                        <p className="text-green-400 text-sm">Your turn!</p>
                        {canRoll && <p className="text-yellow-400 text-xs">Click "Roll Dice" to start</p>}
                        {gameState.diceValue > 0 && validMoves.length > 0 && (
                          <p className="text-blue-400 text-xs">Click a glowing piece to move</p>
                        )}
                        {gameState.diceValue === 6 && validMoves.length > 0 && (
                          <p className="text-orange-400 text-xs animate-pulse">You rolled 6! Move then roll again!</p>
                        )}
                        {gameMode === "speed" && turnTimer > 0 && (
                          <p className="text-red-400 text-xs animate-pulse">⏰ {turnTimer} seconds left!</p>
                        )}
                      </div>
                    )}
                    {!isMyTurn && (
                      <p className="text-white/70 text-sm">
                        {getPlayerType(currentPlayer.name) !== "human" ? "AI is thinking..." : "Waiting for player..."}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dice */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4 text-center">
                <h3 className="text-white font-semibold mb-4">Dice</h3>
                <div className="space-y-4">
                  <div
                    className={`mx-auto w-16 h-16 bg-white rounded-lg flex items-center justify-center ${
                      isRolling ? "animate-spin" : ""
                    } ${gameState.diceValue === 6 ? "ring-2 ring-yellow-400 animate-pulse" : ""}`}
                  >
                    <DiceIcon className="h-10 w-10 text-gray-800" />
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={rollDice}
                      disabled={!canRoll || isRolling || !isMyTurn}
                      className={`w-full ${
                        gameState.canRollAgain
                          ? "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 animate-pulse"
                          : "bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                      } disabled:opacity-50`}
                    >
                      {isRolling ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                          Rolling...
                        </>
                      ) : gameState.canRollAgain ? (
                        "Roll Again! (You got 6)"
                      ) : (
                        "Roll Dice"
                      )}
                    </Button>

                    {/* Skip Turn Button */}
                    {isMyTurn && gameState.diceValue > 0 && validMoves.length === 0 && (
                      <Button
                        onClick={skipTurn}
                        variant="outline"
                        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <SkipForward className="h-4 w-4 mr-2" />
                        Skip Turn
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game History */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-2 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Game History
                </h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {gameHistory.length === 0 ? (
                    <p className="text-white/50 text-sm">Game events will appear here...</p>
                  ) : (
                    gameHistory.map((event, index) => (
                      <div key={index} className="text-white/70 text-xs bg-white/5 p-1 rounded">
                        {event}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Players */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-4">Players</h3>
                <div className="space-y-2">
                  {gameState.players.map((player, index) => {
                    const playerType = getPlayerType(player.name)
                    const AIIcon = getAIIcon(player.name)

                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-2 rounded ${
                          index === gameState.currentPlayer ? "bg-white/20" : "bg-white/5"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
                          <span className="text-white text-sm">{player.name}</span>
                          {playerType !== "human" && <AIIcon className="h-3 w-3 text-white/70" />}
                          {index === gameState.currentPlayer && (
                            <Badge variant="outline" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="text-white/70 text-xs">
                          {player.pieces.filter((p) => p === 57).length}/4 finished
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Game Status */}
            {gameState.gameStatus === "finished" && gameState.winner && (
              <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <h3 className="text-yellow-400 font-bold text-lg mb-2">Game Over!</h3>
                  <p className="text-white">🎉 {gameState.winner} wins! 🎉</p>
                  <p className="text-white/70 text-sm mt-2">Great game everyone!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Groq AI Assistant */}
        <GroqGameAssistant
          gameState={gameState}
          isVisible={showAssistant}
          onToggle={() => setShowAssistant(!showAssistant)}
        />
      </div>
    </div>
  )
}
