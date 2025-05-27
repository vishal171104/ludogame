// This file contains the socket server logic
// In production, you'd run this as a separate service

export interface Room {
  id: string
  name: string
  players: number
  maxPlayers: number
  status: "waiting" | "playing"
}

export interface Player {
  id: string
  name: string
  color: "red" | "blue" | "green" | "yellow"
  pieces: number[]
  isActive: boolean
}

export interface GameState {
  players: Player[]
  currentPlayer: number
  diceValue: number
  gameStatus: "waiting" | "playing" | "finished"
  winner?: string
}

// Mock data for development
export const mockRooms: Room[] = [
  {
    id: "room1",
    name: "Beginner's Room",
    players: 2,
    maxPlayers: 4,
    status: "waiting",
  },
  {
    id: "room2",
    name: "Pro Players",
    players: 3,
    maxPlayers: 4,
    status: "playing",
  },
]

export const mockGameState: GameState = {
  players: [
    {
      id: "player1",
      name: "Player 1",
      color: "red",
      pieces: [0, 0, 0, 0],
      isActive: true,
    },
    {
      id: "player2",
      name: "Player 2",
      color: "blue",
      pieces: [0, 0, 0, 0],
      isActive: true,
    },
  ],
  currentPlayer: 0,
  diceValue: 1,
  gameStatus: "playing",
}
