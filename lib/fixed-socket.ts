"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { SharedRoomStorage, type Room, type GameState } from "./shared-room-storage"

interface MockSocket {
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
  connected: boolean
}

export function useFixedSocket(): MockSocket | null {
  const [socket, setSocket] = useState<MockSocket | null>(null)
  const listenersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map())

  const createSocket = useCallback(() => {
    const mockSocket: MockSocket & { trigger: (event: string, data: any) => void } = {
      connected: true,

      emit: (event: string, data?: any) => {
        console.log("🔌 Socket emit:", event, data)

        setTimeout(() => {
          try {
            switch (event) {
              case "get-rooms":
                const rooms = Object.values(SharedRoomStorage.getAllRooms())
                console.log("📋 Sending rooms list:", rooms)
                mockSocket.trigger("rooms-list", rooms)
                break

              case "create-room":
                if (data?.name && data?.playerName) {
                  const roomId = `ROOM${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                  const newRoom: Room = {
                    id: roomId,
                    name: data.name,
                    players: [data.playerName],
                    maxPlayers: 4,
                    status: "waiting",
                    gameMode: data.gameMode || "family",
                    createdBy: data.playerName,
                    createdAt: Date.now(),
                  }

                  SharedRoomStorage.saveRoom(newRoom)
                  console.log("✅ Room created and saved to shared storage:", newRoom)

                  mockSocket.trigger("room-created", newRoom)
                  mockSocket.trigger("room-joined", roomId)
                  mockSocket.trigger("room-updated", newRoom)

                  // Refresh rooms list
                  const updatedRooms = Object.values(SharedRoomStorage.getAllRooms())
                  mockSocket.trigger("rooms-list", updatedRooms)
                }
                break

              case "join-room":
                if (data?.roomId && data?.playerName) {
                  const roomId = data.roomId.toUpperCase()
                  const room = SharedRoomStorage.getRoom(roomId)

                  console.log("🔍 Looking for room:", roomId)
                  console.log("🔍 Available rooms:", Object.keys(SharedRoomStorage.getAllRooms()))
                  console.log("🔍 Found room:", room)

                  if (room) {
                    const success = SharedRoomStorage.addPlayerToRoom(roomId, data.playerName)
                    if (success) {
                      const updatedRoom = SharedRoomStorage.getRoom(roomId)
                      console.log("✅ Player joined room:", updatedRoom)
                      mockSocket.trigger("room-joined", roomId)
                      mockSocket.trigger("room-updated", updatedRoom)

                      // Refresh rooms list for all clients
                      const updatedRooms = Object.values(SharedRoomStorage.getAllRooms())
                      mockSocket.trigger("rooms-list", updatedRooms)
                    } else {
                      console.log("❌ Room is full")
                      mockSocket.trigger("room-join-failed", { message: "Room is full!" })
                    }
                  } else {
                    const availableRooms = Object.keys(SharedRoomStorage.getAllRooms())
                    console.log("❌ Room not found. Available rooms:", availableRooms)
                    mockSocket.trigger("room-join-failed", {
                      message: `Room ${roomId} not found! Available rooms: ${availableRooms.join(", ")}`,
                    })
                  }
                }
                break

              case "start-game":
                if (data?.roomId) {
                  const room = SharedRoomStorage.getRoom(data.roomId)
                  if (room && room.players.length >= 2) {
                    room.status = "playing"
                    SharedRoomStorage.saveRoom(room)

                    // Create proper game state
                    const gameState: GameState = {
                      players: room.players.map((name, index) => ({
                        id: `player_${index}`,
                        name,
                        color: ["red", "blue", "green", "yellow"][index] as any,
                        pieces: [-1, -1, -1, -1], // All pieces start at home
                        isActive: true,
                      })),
                      currentPlayer: 0,
                      diceValue: 0,
                      gameStatus: "playing",
                      canRollAgain: false,
                      moveCompleted: true,
                    }

                    SharedRoomStorage.saveGameState(data.roomId, gameState)
                    console.log("🎮 Game started:", gameState)
                    mockSocket.trigger("game-started", gameState)
                    mockSocket.trigger("game-state", gameState)
                  }
                }
                break

              case "join-game":
                if (data?.roomId) {
                  const gameState = SharedRoomStorage.getGameState(data.roomId)
                  if (gameState) {
                    console.log("🎮 Player joined existing game:", gameState)
                    mockSocket.trigger("game-state", gameState)
                  }
                }
                break

              case "roll-dice":
                if (data?.roomId) {
                  const gameState = SharedRoomStorage.getGameState(data.roomId)
                  if (gameState && gameState.moveCompleted) {
                    const diceValue = Math.floor(Math.random() * 6) + 1
                    gameState.diceValue = diceValue
                    gameState.moveCompleted = false
                    gameState.canRollAgain = false

                    SharedRoomStorage.saveGameState(data.roomId, gameState)
                    console.log("🎲 Dice rolled:", diceValue)
                    mockSocket.trigger("dice-rolled", diceValue)
                    mockSocket.trigger("game-state", gameState)

                    // Check for valid moves
                    const validMoves = getValidMoves(gameState, gameState.currentPlayer)

                    if (validMoves.length === 0) {
                      setTimeout(() => {
                        const currentGameState = SharedRoomStorage.getGameState(data.roomId)
                        if (currentGameState) {
                          if (diceValue === 6) {
                            currentGameState.canRollAgain = true
                            currentGameState.moveCompleted = true
                            currentGameState.diceValue = 0
                            mockSocket.trigger("no-valid-moves", { message: "No moves with 6! Roll again." })
                          } else {
                            currentGameState.currentPlayer =
                              (currentGameState.currentPlayer + 1) % currentGameState.players.length
                            currentGameState.moveCompleted = true
                            currentGameState.diceValue = 0
                            mockSocket.trigger("no-valid-moves", { message: "No valid moves! Turn skipped." })
                          }
                          SharedRoomStorage.saveGameState(data.roomId, currentGameState)
                          mockSocket.trigger("game-state", currentGameState)
                        }
                      }, 2000)
                    }
                  }
                }
                break

              case "move-piece":
                if (data?.roomId && data?.pieceIndex !== undefined) {
                  const gameState = SharedRoomStorage.getGameState(data.roomId)
                  if (gameState && gameState.diceValue > 0) {
                    const currentPlayer = gameState.currentPlayer
                    const player = gameState.players[currentPlayer]
                    const pieceIndex = data.pieceIndex

                    if (canMovePiece(gameState, currentPlayer, pieceIndex)) {
                      const wasRolledSix = gameState.diceValue === 6

                      // Move the piece
                      movePiece(gameState, currentPlayer, pieceIndex)
                      SharedRoomStorage.saveGameState(data.roomId, gameState)

                      console.log("✅ Piece moved")
                      mockSocket.trigger("piece-moved", gameState)

                      // Check win condition
                      if (player.pieces.every((p) => p === 57)) {
                        gameState.gameStatus = "finished"
                        gameState.winner = player.name
                        SharedRoomStorage.saveGameState(data.roomId, gameState)
                        mockSocket.trigger("game-finished", player.name)
                      } else {
                        // Handle turn switching
                        if (wasRolledSix) {
                          gameState.canRollAgain = true
                          gameState.moveCompleted = true
                          gameState.diceValue = 0
                          mockSocket.trigger("roll-again", { message: "You rolled 6! Roll again!" })
                        } else {
                          gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length
                          gameState.moveCompleted = true
                          gameState.diceValue = 0
                        }
                        SharedRoomStorage.saveGameState(data.roomId, gameState)
                        mockSocket.trigger("game-state", gameState)
                      }
                    } else {
                      mockSocket.trigger("invalid-move", { message: "Invalid move!" })
                    }
                  }
                }
                break

              case "leave-room":
                if (data?.roomId && data?.playerName) {
                  SharedRoomStorage.removePlayerFromRoom(data.roomId, data.playerName)
                  mockSocket.trigger("player-left", { roomId: data.roomId, playerName: data.playerName })

                  // Refresh rooms list
                  const updatedRooms = Object.values(SharedRoomStorage.getAllRooms())
                  mockSocket.trigger("rooms-list", updatedRooms)
                }
                break
            }
          } catch (error) {
            console.error("❌ Socket error:", error)
          }
        }, 100)
      },

      on: (event: string, callback: (data: any) => void) => {
        const listeners = listenersRef.current.get(event) || []
        listeners.push(callback)
        listenersRef.current.set(event, listeners)
      },

      off: (event: string, callback?: (data: any) => void) => {
        if (callback) {
          const listeners = listenersRef.current.get(event) || []
          const index = listeners.indexOf(callback)
          if (index > -1) listeners.splice(index, 1)
        } else {
          listenersRef.current.delete(event)
        }
      },

      trigger: (event: string, data: any) => {
        const listeners = listenersRef.current.get(event) || []
        listeners.forEach((callback) => {
          try {
            callback(data)
          } catch (error) {
            console.error("❌ Callback error:", error)
          }
        })
      },
    }

    // Initialize demo rooms
    setTimeout(() => {
      SharedRoomStorage.initializeDemoRooms()
      const rooms = Object.values(SharedRoomStorage.getAllRooms())
      mockSocket.trigger("rooms-list", rooms)
    }, 500)

    return mockSocket
  }, [])

  useEffect(() => {
    const socketInstance = createSocket()
    setSocket(socketInstance)

    return () => {
      listenersRef.current.clear()
    }
  }, [createSocket])

  return socket
}

// Game logic helper functions
function getValidMoves(gameState: GameState, playerIndex: number): number[] {
  const player = gameState.players[playerIndex]
  const diceValue = gameState.diceValue
  const validMoves: number[] = []

  if (diceValue === 0) return validMoves

  player.pieces.forEach((piecePosition, pieceIndex) => {
    if (canMovePiece(gameState, playerIndex, pieceIndex)) {
      validMoves.push(pieceIndex)
    }
  })

  return validMoves
}

function canMovePiece(gameState: GameState, playerIndex: number, pieceIndex: number): boolean {
  const player = gameState.players[playerIndex]
  const piecePosition = player.pieces[pieceIndex]
  const diceValue = gameState.diceValue

  // Piece at home - needs 6 to move out
  if (piecePosition === -1) {
    return diceValue === 6
  }

  // Piece finished
  if (piecePosition === 57) {
    return false
  }

  // Piece on home path (52-56)
  if (piecePosition >= 52 && piecePosition <= 56) {
    return piecePosition + diceValue <= 57
  }

  // Piece on main path (0-51)
  if (piecePosition >= 0 && piecePosition <= 51) {
    return true
  }

  return false
}

function movePiece(gameState: GameState, playerIndex: number, pieceIndex: number): void {
  const player = gameState.players[playerIndex]
  const diceValue = gameState.diceValue
  const currentPosition = player.pieces[pieceIndex]

  // Move from home
  if (currentPosition === -1) {
    const startPositions = { red: 0, blue: 13, green: 26, yellow: 39 }
    player.pieces[pieceIndex] = startPositions[player.color as keyof typeof startPositions]
  }
  // Move on home path
  else if (currentPosition >= 52 && currentPosition <= 56) {
    player.pieces[pieceIndex] = Math.min(currentPosition + diceValue, 57)
  }
  // Move on main path
  else if (currentPosition >= 0 && currentPosition <= 51) {
    const homeEntryPositions = { red: 50, blue: 11, green: 24, yellow: 37 }
    const homeEntry = homeEntryPositions[player.color as keyof typeof homeEntryPositions]
    const newPosition = currentPosition + diceValue

    if (newPosition >= homeEntry) {
      // Enter home path
      const stepsIntoHome = newPosition - homeEntry
      player.pieces[pieceIndex] = Math.min(52 + stepsIntoHome, 57)
    } else {
      player.pieces[pieceIndex] = newPosition % 52
    }
  }
}
