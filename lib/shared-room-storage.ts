"use client"

interface Room {
  id: string
  name: string
  players: string[]
  maxPlayers: number
  status: "waiting" | "playing"
  gameMode: "classic" | "speed" | "family"
  createdBy: string
  createdAt: number
}

interface GameState {
  players: Array<{
    id: string
    name: string
    color: "red" | "blue" | "green" | "yellow"
    pieces: number[]
    isActive: boolean
  }>
  currentPlayer: number
  diceValue: number
  gameStatus: "waiting" | "playing" | "finished"
  winner?: string
  canRollAgain: boolean
  moveCompleted: boolean
}

class SharedRoomStorage {
  private static readonly ROOMS_KEY = "ludo_shared_rooms"
  private static readonly GAME_STATES_KEY = "ludo_game_states"
  private static readonly CLEANUP_INTERVAL = 30 * 60 * 1000 // 30 minutes

  static saveRoom(room: Room): void {
    try {
      const rooms = this.getAllRooms()
      rooms[room.id] = { ...room, createdAt: Date.now() }
      localStorage.setItem(this.ROOMS_KEY, JSON.stringify(rooms))
      console.log("💾 Room saved to shared storage:", room.id)
    } catch (error) {
      console.error("❌ Failed to save room:", error)
    }
  }

  static getRoom(roomId: string): Room | null {
    try {
      const rooms = this.getAllRooms()
      const room = rooms[roomId.toUpperCase()]
      if (room) {
        console.log("📖 Room found in shared storage:", room)
        return room
      }
      console.log("❌ Room not found in shared storage:", roomId)
      return null
    } catch (error) {
      console.error("❌ Failed to get room:", error)
      return null
    }
  }

  static getAllRooms(): Record<string, Room> {
    try {
      const stored = localStorage.getItem(this.ROOMS_KEY)
      if (!stored) return {}

      const rooms = JSON.parse(stored)

      // Clean up old rooms (older than 30 minutes)
      const now = Date.now()
      const cleanedRooms: Record<string, Room> = {}

      Object.entries(rooms).forEach(([id, room]: [string, any]) => {
        if (now - room.createdAt < this.CLEANUP_INTERVAL) {
          cleanedRooms[id] = room
        }
      })

      // Save cleaned rooms back
      if (Object.keys(cleanedRooms).length !== Object.keys(rooms).length) {
        localStorage.setItem(this.ROOMS_KEY, JSON.stringify(cleanedRooms))
      }

      return cleanedRooms
    } catch (error) {
      console.error("❌ Failed to get all rooms:", error)
      return {}
    }
  }

  static updateRoom(roomId: string, updates: Partial<Room>): void {
    try {
      const rooms = this.getAllRooms()
      if (rooms[roomId]) {
        rooms[roomId] = { ...rooms[roomId], ...updates }
        localStorage.setItem(this.ROOMS_KEY, JSON.stringify(rooms))
        console.log("🔄 Room updated in shared storage:", roomId)
      }
    } catch (error) {
      console.error("❌ Failed to update room:", error)
    }
  }

  static deleteRoom(roomId: string): void {
    try {
      const rooms = this.getAllRooms()
      delete rooms[roomId]
      localStorage.setItem(this.ROOMS_KEY, JSON.stringify(rooms))
      console.log("🗑️ Room deleted from shared storage:", roomId)
    } catch (error) {
      console.error("❌ Failed to delete room:", error)
    }
  }

  static saveGameState(roomId: string, gameState: GameState): void {
    try {
      const gameStates = this.getAllGameStates()
      gameStates[roomId] = gameState
      localStorage.setItem(this.GAME_STATES_KEY, JSON.stringify(gameStates))
      console.log("💾 Game state saved:", roomId)
    } catch (error) {
      console.error("❌ Failed to save game state:", error)
    }
  }

  static getGameState(roomId: string): GameState | null {
    try {
      const gameStates = this.getAllGameStates()
      return gameStates[roomId] || null
    } catch (error) {
      console.error("❌ Failed to get game state:", error)
      return null
    }
  }

  static getAllGameStates(): Record<string, GameState> {
    try {
      const stored = localStorage.getItem(this.GAME_STATES_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.error("❌ Failed to get all game states:", error)
      return {}
    }
  }

  static initializeDemoRooms(): void {
    const demoRooms = [
      {
        id: "DEMO01",
        name: "Family Game Room",
        players: [],
        maxPlayers: 4,
        status: "waiting" as const,
        gameMode: "family" as const,
        createdBy: "System",
        createdAt: Date.now(),
      },
      {
        id: "DEMO02",
        name: "Quick Match",
        players: ["AI Bot"],
        maxPlayers: 4,
        status: "waiting" as const,
        gameMode: "speed" as const,
        createdBy: "System",
        createdAt: Date.now(),
      },
    ]

    const existingRooms = this.getAllRooms()
    demoRooms.forEach((room) => {
      if (!existingRooms[room.id]) {
        this.saveRoom(room)
      }
    })
  }

  static addPlayerToRoom(roomId: string, playerName: string): boolean {
    try {
      const room = this.getRoom(roomId)
      if (!room) return false

      if (room.players.length >= room.maxPlayers) return false
      if (room.players.includes(playerName)) return true // Already in room

      room.players.push(playerName)
      this.saveRoom(room)
      return true
    } catch (error) {
      console.error("❌ Failed to add player to room:", error)
      return false
    }
  }

  static removePlayerFromRoom(roomId: string, playerName: string): void {
    try {
      const room = this.getRoom(roomId)
      if (!room) return

      room.players = room.players.filter((p) => p !== playerName)

      if (room.players.length === 0) {
        this.deleteRoom(roomId)
      } else {
        this.saveRoom(room)
      }
    } catch (error) {
      console.error("❌ Failed to remove player from room:", error)
    }
  }
}

export { SharedRoomStorage, type Room, type GameState }
