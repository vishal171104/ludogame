"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { LudoGameLogic, type GameState } from "@/lib/ludo-game-logic"

interface Room {
  id: string
  name: string
  players: string[]
  maxPlayers: number
  status: "waiting" | "playing"
  gameMode: "classic" | "speed" | "family"
  createdBy: string
}

interface MockSocket {
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
  connected: boolean
}

export function useSocket(): MockSocket | null {
  const [socket, setSocket] = useState<MockSocket | null>(null)
  const listenersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map())
  const gameStateRef = useRef<GameState | null>(null)
  const roomsRef = useRef<Map<string, Room>>(new Map())

  const createMockSocket = useCallback(() => {
    const mockSocket: MockSocket & { trigger: (event: string, data: any) => void } = {
      connected: true,
      emit: (event: string, data?: any) => {
        console.log("🔌 Socket emit:", event, data)

        setTimeout(() => {
          try {
            switch (event) {
              case "get-rooms":
                const rooms = Array.from(roomsRef.current.values())
                mockSocket.trigger("rooms-list", rooms)
                break

              case "create-room":
                if (data?.name && data?.playerName) {
                  const newRoom: Room = {
                    id: `room_${Date.now()}`,
                    name: data.name,
                    players: [data.playerName],
                    maxPlayers: 4,
                    status: "waiting",
                    gameMode: data.gameMode || "family",
                    createdBy: data.playerName,
                  }
                  roomsRef.current.set(newRoom.id, newRoom)
                  mockSocket.trigger("room-created", newRoom)
                }
                break

              case "join-room":
                if (data?.roomId && data?.playerName) {
                  const room = roomsRef.current.get(data.roomId)
                  if (room) {
                    if (room.players.length < room.maxPlayers && !room.players.includes(data.playerName)) {
                      room.players.push(data.playerName)
                      roomsRef.current.set(room.id, room)
                      mockSocket.trigger("room-joined", data.roomId)
                      mockSocket.trigger("room-updated", room)
                      console.log(`✅ Player ${data.playerName} joined room ${data.roomId}`)
                    } else if (room.players.includes(data.playerName)) {
                      // Player already in room, just join
                      mockSocket.trigger("room-joined", data.roomId)
                      console.log(`✅ Player ${data.playerName} rejoined room ${data.roomId}`)
                    } else {
                      mockSocket.trigger("room-join-failed", { message: "Room is full!" })
                      console.log(`❌ Room ${data.roomId} is full`)
                    }
                  } else {
                    mockSocket.trigger("room-join-failed", { message: "Room not found!" })
                    console.log(`❌ Room ${data.roomId} not found`)
                  }
                }
                break

              case "start-game":
                if (data?.roomId) {
                  const room = roomsRef.current.get(data.roomId)
                  if (room && room.players.length >= 2) {
                    room.status = "playing"
                    const newGameState = LudoGameLogic.createInitialGameState(room.players)
                    gameStateRef.current = newGameState
                    mockSocket.trigger("game-started", newGameState)
                  }
                }
                break

              case "roll-dice":
                if (gameStateRef.current) {
                  const currentPlayer = gameStateRef.current.currentPlayer

                  if (!LudoGameLogic.canPlayerRoll(gameStateRef.current, currentPlayer)) {
                    console.log("❌ Player cannot roll dice right now")
                    mockSocket.trigger("invalid-action", { message: "Cannot roll dice right now!" })
                    return
                  }

                  const diceValue = LudoGameLogic.rollDice()
                  gameStateRef.current.diceValue = diceValue
                  gameStateRef.current.lastRoll = diceValue
                  gameStateRef.current.moveCompleted = false
                  gameStateRef.current.canRollAgain = false

                  console.log("🎲 Dice rolled:", diceValue)
                  mockSocket.trigger("dice-rolled", diceValue)
                  mockSocket.trigger("game-state", gameStateRef.current)

                  const validMoves = LudoGameLogic.getValidMoves(gameStateRef.current, currentPlayer)
                  console.log("🎯 Valid moves after dice roll:", validMoves)

                  if (validMoves.length === 0) {
                    console.log("❌ No valid moves available")
                    setTimeout(() => {
                      if (gameStateRef.current) {
                        if (diceValue === 6) {
                          gameStateRef.current.canRollAgain = true
                          gameStateRef.current.moveCompleted = true
                          gameStateRef.current.diceValue = 0
                          console.log("🎲 No moves with 6, player can roll again")
                          mockSocket.trigger("no-valid-moves", {
                            message: "No valid moves with 6! You can roll again.",
                          })
                        } else {
                          gameStateRef.current.currentPlayer =
                            (gameStateRef.current.currentPlayer + 1) % gameStateRef.current.players.length
                          gameStateRef.current.diceValue = 0
                          gameStateRef.current.moveCompleted = true
                          gameStateRef.current.canRollAgain = false
                          mockSocket.trigger("no-valid-moves", {
                            message: "No valid moves available! Turn skipped.",
                          })
                        }
                        mockSocket.trigger("game-state", gameStateRef.current)
                      }
                    }, 2000)
                  }
                }
                break

              case "move-piece":
                if (gameStateRef.current && data?.pieceIndex !== undefined) {
                  const currentPlayer = gameStateRef.current.currentPlayer
                  console.log("🚀 Attempting to move piece:", data.pieceIndex, "for player:", currentPlayer)

                  if (
                    LudoGameLogic.canMovePiece(
                      gameStateRef.current,
                      currentPlayer,
                      data.pieceIndex,
                      gameStateRef.current.diceValue,
                    )
                  ) {
                    const wasRolledSix = gameStateRef.current.diceValue === 6
                    console.log("🎲 Was rolled six:", wasRolledSix)

                    gameStateRef.current = LudoGameLogic.movePiece(gameStateRef.current, currentPlayer, data.pieceIndex)

                    console.log("✅ Piece moved successfully")
                    mockSocket.trigger("piece-moved", gameStateRef.current)

                    if (gameStateRef.current.gameStatus === "finished") {
                      mockSocket.trigger("game-finished", gameStateRef.current.winner)
                    } else {
                      mockSocket.trigger("game-state", gameStateRef.current)

                      if (wasRolledSix) {
                        console.log("🎲 Player rolled 6 and moved, can roll again!")
                        setTimeout(() => {
                          if (gameStateRef.current) {
                            gameStateRef.current.canRollAgain = true
                            gameStateRef.current.moveCompleted = true
                            gameStateRef.current.diceValue = 0
                            mockSocket.trigger("game-state", gameStateRef.current)
                            mockSocket.trigger("roll-again", {
                              message: "Great! You rolled a 6, so you can roll again!",
                            })
                          }
                        }, 1000)
                      }
                    }
                  } else {
                    console.log("❌ Invalid move attempted")
                    mockSocket.trigger("invalid-move", { message: "Invalid move!" })
                  }
                }
                break

              case "leave-room":
                if (data?.roomId && data?.playerName) {
                  const room = roomsRef.current.get(data.roomId)
                  if (room) {
                    room.players = room.players.filter((p) => p !== data.playerName)
                    if (room.players.length === 0) {
                      roomsRef.current.delete(data.roomId)
                    }
                    mockSocket.trigger("player-left", { roomId: data.roomId, playerName: data.playerName })
                  }
                }
                break
            }
          } catch (error) {
            console.error("❌ Socket event error:", error)
          }
        }, 100)
      },

      on: (event: string, callback: (data: any) => void) => {
        try {
          const listeners = listenersRef.current.get(event) || []
          listeners.push(callback)
          listenersRef.current.set(event, listeners)
        } catch (error) {
          console.error("❌ Socket on error:", error)
        }
      },

      off: (event: string, callback?: (data: any) => void) => {
        try {
          if (callback) {
            const listeners = listenersRef.current.get(event) || []
            const index = listeners.indexOf(callback)
            if (index > -1) {
              listeners.splice(index, 1)
            }
          } else {
            listenersRef.current.delete(event)
          }
        } catch (error) {
          console.error("❌ Socket off error:", error)
        }
      },

      trigger: (event: string, data: any) => {
        try {
          const listeners = listenersRef.current.get(event) || []
          listeners.forEach((callback) => {
            try {
              callback(data)
            } catch (error) {
              console.error("❌ Socket callback error:", error)
            }
          })
        } catch (error) {
          console.error("❌ Socket trigger error:", error)
        }
      },
    }

    // Initialize with some default rooms for testing
    setTimeout(() => {
      const defaultRooms = [
        {
          id: "room_demo_1",
          name: "Beginner's Room",
          players: ["AI Player"],
          maxPlayers: 4,
          status: "waiting" as const,
          gameMode: "family" as const,
          createdBy: "System",
        },
        {
          id: "room_demo_2",
          name: "Quick Game",
          players: [],
          maxPlayers: 4,
          status: "waiting" as const,
          gameMode: "speed" as const,
          createdBy: "System",
        },
        {
          id: "room_demo_3",
          name: "Classic Ludo",
          players: ["Player 1"],
          maxPlayers: 4,
          status: "waiting" as const,
          gameMode: "classic" as const,
          createdBy: "System",
        },
      ]

      defaultRooms.forEach((room) => {
        roomsRef.current.set(room.id, room)
      })

      // Trigger rooms list update
      mockSocket.trigger("rooms-list", Array.from(roomsRef.current.values()))
    }, 500)

    mockSocket.on("room-join-failed", (data: { message: string }) => {
      console.log("❌ Failed to join room:", data.message)
      alert(data.message) // Show error to user
    })

    return mockSocket
  }, [])

  useEffect(() => {
    try {
      const socketInstance = createMockSocket()
      setSocket(socketInstance)

      return () => {
        try {
          listenersRef.current.clear()
          gameStateRef.current = null
          roomsRef.current.clear()
        } catch (error) {
          console.error("❌ Socket cleanup error:", error)
        }
      }
    } catch (error) {
      console.error("❌ Socket creation error:", error)
      return () => {}
    }
  }, [createMockSocket])

  return socket
}
