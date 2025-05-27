export interface Player {
  id: string
  name: string
  color: "red" | "blue" | "green" | "yellow"
  pieces: number[] // -1 = home, 0-51 = main path, 52-56 = home path, 57 = finished
  isActive: boolean
}

export interface GameState {
  players: Player[]
  currentPlayer: number
  diceValue: number
  gameStatus: "waiting" | "playing" | "finished"
  winner?: string
  lastRoll?: number
  canRollAgain?: boolean
  moveCompleted?: boolean
}

// Starting positions for each color on the main path
const START_POSITIONS = {
  red: 0,
  blue: 13,
  green: 26,
  yellow: 39,
}

// Safe positions where pieces can't be captured
const SAFE_POSITIONS = [8, 13, 21, 26, 34, 39, 47]

export class LudoGameLogic {
  static createInitialGameState(players: string[]): GameState {
    const gameState: GameState = {
      players: players.map((name, index) => ({
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

    return gameState
  }

  static rollDice(): number {
    return Math.floor(Math.random() * 6) + 1
  }

  static getValidMoves(gameState: GameState, playerIndex: number): number[] {
    const player = gameState.players[playerIndex]
    const diceValue = gameState.diceValue
    const validMoves: number[] = []

    if (diceValue === 0) return validMoves

    player.pieces.forEach((piecePosition, pieceIndex) => {
      if (this.canMovePiece(gameState, playerIndex, pieceIndex, diceValue)) {
        validMoves.push(pieceIndex)
      }
    })

    return validMoves
  }

  static canMovePiece(gameState: GameState, playerIndex: number, pieceIndex: number, diceValue: number): boolean {
    const player = gameState.players[playerIndex]
    const piecePosition = player.pieces[pieceIndex]

    // Piece is at home - can only move with a 6
    if (piecePosition === -1) {
      return diceValue === 6
    }

    // Piece is finished
    if (piecePosition === 57) {
      return false
    }

    // Piece is on home path (52-56)
    if (piecePosition >= 52 && piecePosition <= 56) {
      const newPosition = piecePosition + diceValue
      return newPosition <= 57 // Can't overshoot the finish
    }

    // Piece is on main path
    if (piecePosition >= 0 && piecePosition <= 51) {
      const homeEntryPosition = this.getHomeEntryPosition(player.color)

      // Check if piece would enter home path
      if (piecePosition < homeEntryPosition && piecePosition + diceValue >= homeEntryPosition) {
        const stepsIntoHomePath = piecePosition + diceValue - homeEntryPosition
        return 52 + stepsIntoHomePath <= 57
      }

      return true
    }

    return false
  }

  static movePiece(gameState: GameState, playerIndex: number, pieceIndex: number): GameState {
    const newGameState = JSON.parse(JSON.stringify(gameState)) as GameState
    const player = newGameState.players[playerIndex]
    const diceValue = newGameState.diceValue
    const currentPosition = player.pieces[pieceIndex]

    console.log(`Moving piece ${pieceIndex} from position ${currentPosition} with dice ${diceValue}`)

    // Move piece from home
    if (currentPosition === -1) {
      const startPosition = START_POSITIONS[player.color as keyof typeof START_POSITIONS]
      player.pieces[pieceIndex] = startPosition
      this.checkForCaptures(newGameState, playerIndex, startPosition)
      console.log(`Piece moved from home to position ${startPosition}`)
    }
    // Move piece on home path
    else if (currentPosition >= 52 && currentPosition <= 56) {
      const newPosition = Math.min(currentPosition + diceValue, 57)
      player.pieces[pieceIndex] = newPosition
      console.log(`Piece moved on home path to position ${newPosition}`)
    }
    // Move piece on main path
    else if (currentPosition >= 0 && currentPosition <= 51) {
      const homeEntryPosition = this.getHomeEntryPosition(player.color)
      const newPosition = currentPosition + diceValue

      // Check if entering home path
      if (newPosition >= homeEntryPosition) {
        const stepsIntoHomePath = newPosition - homeEntryPosition
        const homePathPosition = 52 + stepsIntoHomePath
        player.pieces[pieceIndex] = Math.min(homePathPosition, 57)
        console.log(`Piece entered home path at position ${player.pieces[pieceIndex]}`)
      } else {
        const finalPosition = newPosition % 52
        player.pieces[pieceIndex] = finalPosition
        this.checkForCaptures(newGameState, playerIndex, finalPosition)
        console.log(`Piece moved on main path to position ${finalPosition}`)
      }
    }

    // Check for win condition
    if (player.pieces.every((pos) => pos === 57)) {
      newGameState.gameStatus = "finished"
      newGameState.winner = player.name
      console.log(`Player ${player.name} wins!`)
    }

    // Determine next turn based on dice value
    if (diceValue === 6) {
      newGameState.canRollAgain = true
      newGameState.moveCompleted = true
      console.log(`Player rolled 6, gets another turn`)
    } else {
      newGameState.currentPlayer = (newGameState.currentPlayer + 1) % newGameState.players.length
      newGameState.canRollAgain = false
      newGameState.moveCompleted = true
      console.log(`Turn switches to player ${newGameState.currentPlayer}`)
    }

    // Reset dice after move
    newGameState.diceValue = 0

    return newGameState
  }

  static checkForCaptures(gameState: GameState, movingPlayerIndex: number, position: number): void {
    // Can't capture on safe positions
    if (SAFE_POSITIONS.includes(position)) return

    gameState.players.forEach((player, playerIndex) => {
      if (playerIndex === movingPlayerIndex) return

      player.pieces.forEach((piecePosition, pieceIndex) => {
        if (piecePosition === position) {
          // Send captured piece back home
          player.pieces[pieceIndex] = -1
          console.log(`Captured piece of player ${playerIndex} at position ${position}`)
        }
      })
    })
  }

  static getHomeEntryPosition(color: string): number {
    switch (color) {
      case "red":
        return 50
      case "blue":
        return 11
      case "green":
        return 24
      case "yellow":
        return 37
      default:
        return 0
    }
  }

  static hasValidMoves(gameState: GameState, playerIndex: number): boolean {
    return this.getValidMoves(gameState, playerIndex).length > 0
  }

  static canPlayerRoll(gameState: GameState, playerIndex: number): boolean {
    return (
      gameState.currentPlayer === playerIndex &&
      gameState.diceValue === 0 &&
      gameState.moveCompleted === true &&
      gameState.gameStatus === "playing"
    )
  }
}
