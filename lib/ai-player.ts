import { LudoGameLogic, type GameState } from "./ludo-game-logic"

export interface AIMove {
  pieceIndex: number
  priority: number
  reason: string
}

export class AIPlayer {
  private playerId: string
  private difficulty: "easy" | "medium" | "hard"

  constructor(playerId: string, difficulty: "easy" | "medium" | "hard" = "medium") {
    this.playerId = playerId
    this.difficulty = difficulty
  }

  // Main AI decision making function
  decideBestMove(gameState: GameState, playerIndex: number): AIMove | null {
    const validMoves = LudoGameLogic.getValidMoves(gameState, playerIndex)

    if (validMoves.length === 0) {
      return null
    }

    if (validMoves.length === 1) {
      return {
        pieceIndex: validMoves[0],
        priority: 1,
        reason: "Only valid move",
      }
    }

    // Analyze all possible moves
    const moveAnalysis = validMoves.map((pieceIndex) => this.analyzePieceMove(gameState, playerIndex, pieceIndex))

    // Sort by priority (highest first)
    moveAnalysis.sort((a, b) => b.priority - a.priority)

    console.log(`🤖 AI analyzing moves for player ${playerIndex}:`, moveAnalysis)

    // Add some randomness based on difficulty
    const selectedMove = this.selectMoveByDifficulty(moveAnalysis)

    console.log(`🤖 AI selected move:`, selectedMove)
    return selectedMove
  }

  private analyzePieceMove(gameState: GameState, playerIndex: number, pieceIndex: number): AIMove {
    const player = gameState.players[playerIndex]
    const piece = player.pieces[pieceIndex]
    const diceValue = gameState.diceValue
    let priority = 0
    let reason = ""

    // Strategy 1: Get pieces out of home (highest priority)
    if (piece === -1 && diceValue === 6) {
      priority += 100
      reason = "Getting piece out of home"
    }

    // Strategy 2: Move pieces close to finishing
    else if (piece >= 52) {
      const distanceToFinish = 57 - piece
      if (distanceToFinish === diceValue) {
        priority += 90
        reason = "Finishing a piece"
      } else if (distanceToFinish > diceValue) {
        priority += 70
        reason = "Moving closer to finish"
      }
    }

    // Strategy 3: Capture opponent pieces
    else if (piece >= 0 && piece < 52) {
      const newPosition = (piece + diceValue) % 52
      const captureInfo = this.checkForCapture(gameState, playerIndex, newPosition)

      if (captureInfo.canCapture) {
        priority += 80
        reason = `Capturing ${captureInfo.opponentColor} piece`
      }

      // Strategy 4: Move to safe positions
      const safePositions = [8, 13, 21, 26, 34, 39, 47]
      if (safePositions.includes(newPosition)) {
        priority += 30
        reason = "Moving to safe position"
      }

      // Strategy 5: Avoid being captured
      const dangerLevel = this.assessDanger(gameState, playerIndex, piece)
      if (dangerLevel > 0) {
        priority += 40
        reason = "Escaping danger"
      }

      // Strategy 6: Spread pieces (don't bunch up)
      const spreadBonus = this.calculateSpreadBonus(gameState, playerIndex, pieceIndex)
      priority += spreadBonus
      if (spreadBonus > 0) {
        reason += " (spreading pieces)"
      }
    }

    // Strategy 7: Block opponents
    if (piece >= 0 && piece < 52) {
      const blockValue = this.calculateBlockValue(gameState, playerIndex, piece + diceValue)
      priority += blockValue
      if (blockValue > 0) {
        reason += " (blocking opponent)"
      }
    }

    return {
      pieceIndex,
      priority,
      reason: reason || "Standard move",
    }
  }

  private checkForCapture(gameState: GameState, playerIndex: number, newPosition: number) {
    const safePositions = [8, 13, 21, 26, 34, 39, 47]

    // Can't capture on safe positions
    if (safePositions.includes(newPosition)) {
      return { canCapture: false, opponentColor: null }
    }

    // Check if any opponent piece is at this position
    for (let i = 0; i < gameState.players.length; i++) {
      if (i === playerIndex) continue

      const opponent = gameState.players[i]
      for (const piecePos of opponent.pieces) {
        if (piecePos === newPosition) {
          return { canCapture: true, opponentColor: opponent.color }
        }
      }
    }

    return { canCapture: false, opponentColor: null }
  }

  private assessDanger(gameState: GameState, playerIndex: number, piecePosition: number): number {
    if (piecePosition < 0 || piecePosition >= 52) return 0

    let dangerLevel = 0
    const safePositions = [8, 13, 21, 26, 34, 39, 47]

    // Already safe
    if (safePositions.includes(piecePosition)) return 0

    // Check if opponents can reach this position
    for (let i = 0; i < gameState.players.length; i++) {
      if (i === playerIndex) continue

      const opponent = gameState.players[i]
      for (const opponentPiecePos of opponent.pieces) {
        if (opponentPiecePos >= 0 && opponentPiecePos < 52) {
          // Check if opponent can reach our piece with dice 1-6
          for (let dice = 1; dice <= 6; dice++) {
            const opponentNewPos = (opponentPiecePos + dice) % 52
            if (opponentNewPos === piecePosition) {
              dangerLevel += (7 - dice) * 5 // Closer threats are more dangerous
            }
          }
        }
      }
    }

    return Math.min(dangerLevel, 50) // Cap danger level
  }

  private calculateSpreadBonus(gameState: GameState, playerIndex: number, pieceIndex: number): number {
    const player = gameState.players[playerIndex]
    const piece = player.pieces[pieceIndex]

    if (piece < 0) return 0

    // Count pieces in home area
    const piecesAtHome = player.pieces.filter((p) => p === -1).length

    // Encourage getting more pieces out if many are still home
    if (piecesAtHome >= 2) {
      return 10
    }

    return 0
  }

  private calculateBlockValue(gameState: GameState, playerIndex: number, newPosition: number): number {
    if (newPosition < 0 || newPosition >= 52) return 0

    let blockValue = 0

    // Check if this position would block opponents
    for (let i = 0; i < gameState.players.length; i++) {
      if (i === playerIndex) continue

      const opponent = gameState.players[i]
      for (const opponentPiecePos of opponent.pieces) {
        if (opponentPiecePos >= 0 && opponentPiecePos < 52) {
          // Check if opponent wants to move to this position
          for (let dice = 1; dice <= 6; dice++) {
            const opponentTargetPos = (opponentPiecePos + dice) % 52
            if (opponentTargetPos === newPosition) {
              blockValue += 5
            }
          }
        }
      }
    }

    return Math.min(blockValue, 20) // Cap block value
  }

  private selectMoveByDifficulty(moveAnalysis: AIMove[]): AIMove {
    switch (this.difficulty) {
      case "easy":
        // Easy AI: 70% random, 30% best move
        if (Math.random() < 0.3) {
          return moveAnalysis[0] // Best move
        } else {
          return moveAnalysis[Math.floor(Math.random() * moveAnalysis.length)] // Random
        }

      case "medium":
        // Medium AI: 80% best moves, 20% random from top 3
        if (Math.random() < 0.8) {
          return moveAnalysis[0] // Best move
        } else {
          const topMoves = moveAnalysis.slice(0, Math.min(3, moveAnalysis.length))
          return topMoves[Math.floor(Math.random() * topMoves.length)]
        }

      case "hard":
        // Hard AI: Always best move with slight randomness for top moves
        const topPriority = moveAnalysis[0].priority
        const topMoves = moveAnalysis.filter((move) => move.priority >= topPriority - 5)
        return topMoves[Math.floor(Math.random() * topMoves.length)]

      default:
        return moveAnalysis[0]
    }
  }

  // Calculate thinking time based on difficulty
  getThinkingTime(): number {
    switch (this.difficulty) {
      case "easy":
        return 1000 + Math.random() * 1000 // 1-2 seconds
      case "medium":
        return 1500 + Math.random() * 1500 // 1.5-3 seconds
      case "hard":
        return 2000 + Math.random() * 2000 // 2-4 seconds
      default:
        return 2000
    }
  }
}
