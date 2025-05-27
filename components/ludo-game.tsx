"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import LudoBoard from "./ludo-board"
import type { GameState } from "@/lib/ludo-game-logic"
import { LudoGameLogic } from "@/lib/ludo-game-logic"

interface LudoGameProps {
  roomId: string
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

export default function LudoGame({ roomId, onLeaveGame }: LudoGameProps) {
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

  useEffect(() => {
    if (!socket) return

    console.log("🎮 Setting up game socket listeners")

    socket.on("game-started", (state: GameState) => {
      console.log("🎮 Game started with state:", state)
      setGameState(state)
      setMessage("Game started! Roll the dice to begin!")
    })

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
    })

    socket.on("dice-rolled", (value: number) => {
      console.log("🎲 Dice rolled event:", value)
      setIsRolling(false)

      const currentPlayerData = gameState.players[gameState.currentPlayer]
      const isMyRoll = currentPlayerData?.name === user?.name

      if (value === 6) {
        if (isMyRoll) {
          setMessage(`You rolled a ${value}! Move a piece, then you can roll again!`)
        } else {
          setMessage(`${currentPlayerData?.name} rolled a ${value}!`)
        }
      } else {
        if (isMyRoll) {
          setMessage(`You rolled a ${value}!`)
        } else {
          setMessage(`${currentPlayerData?.name} rolled a ${value}`)
        }
      }

      setTimeout(() => {
        if (validMoves.length === 0) {
          setMessage("")
        }
      }, 4000)
    })

    socket.on("piece-moved", (newState: GameState) => {
      console.log("🚀 Piece moved event, new state:", newState)
      setGameState(newState)
      setSelectedPiece(null)
      setValidMoves([])

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
      console.log("🧹 Cleaning up game socket listeners")
      socket.off("game-started")
      socket.off("game-state")
      socket.off("dice-rolled")
      socket.off("piece-moved")
      socket.off("roll-again")
      socket.off("game-finished")
      socket.off("no-valid-moves")
      socket.off("invalid-move")
      socket.off("invalid-action")
    }
  }, [socket, user?.name, validMoves.length, gameState.currentPlayer, gameState.players])

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

  const handleLeaveGame = () => {
    console.log("👋 Leaving game")
    if (socket) {
      socket.emit("leave-room", { roomId, playerName: user?.name })
    }
    onLeaveGame()
  }

  const DiceIcon = diceIcons[gameState.diceValue as keyof typeof diceIcons] || Dice1
  const currentPlayer = gameState.players[gameState.currentPlayer]
  const isMyTurn = currentPlayer?.name === user?.name
  const canRoll = LudoGameLogic.canPlayerRoll(gameState, gameState.currentPlayer)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleLeaveGame}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Leave Game
          </Button>

          {/* Message Display */}
          {message && (
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg max-w-md">
              <span className="text-white font-medium text-sm">{message}</span>
            </div>
          )}
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

          {/* Game Controls & Players */}
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
                      </div>
                    )}
                    {!isMyTurn && <p className="text-white/70 text-sm">Waiting for player...</p>}
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Players */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-4">Players</h3>
                <div className="space-y-2">
                  {gameState.players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded ${
                        index === gameState.currentPlayer ? "bg-white/20" : "bg-white/5"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: player.color }} />
                        <span className="text-white text-sm">{player.name}</span>
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
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Game Status */}
            {gameState.gameStatus === "finished" && gameState.winner && (
              <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <h3 className="text-yellow-400 font-bold text-lg mb-2">Game Over!</h3>
                  <p className="text-white">🎉 {gameState.winner} wins! 🎉</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
