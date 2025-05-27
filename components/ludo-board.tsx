"use client"

import type { GameState } from "@/lib/ludo-game-logic"

interface LudoBoardProps {
  gameState: GameState
  onPieceClick: (pieceIndex: number) => void
  selectedPiece: number | null
  canMove: boolean
  validMoves?: number[]
}

// Ludo board path positions (0-51 for main track)
const BOARD_PATH = [
  // Bottom row (Red start area)
  { row: 14, col: 6 },
  { row: 13, col: 6 },
  { row: 12, col: 6 },
  { row: 11, col: 6 },
  { row: 10, col: 6 },
  { row: 9, col: 6 },
  // Left column going up
  { row: 8, col: 5 },
  { row: 8, col: 4 },
  { row: 8, col: 3 },
  { row: 8, col: 2 },
  { row: 8, col: 1 },
  { row: 8, col: 0 },
  // Top row (Yellow start area)
  { row: 7, col: 0 },
  { row: 6, col: 0 },
  { row: 6, col: 1 },
  { row: 6, col: 2 },
  { row: 6, col: 3 },
  { row: 6, col: 4 },
  { row: 6, col: 5 },
  // Top middle
  { row: 5, col: 6 },
  { row: 4, col: 6 },
  { row: 3, col: 6 },
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  // Top row going right (Blue start area)
  { row: 0, col: 7 },
  { row: 0, col: 8 },
  { row: 1, col: 8 },
  { row: 2, col: 8 },
  { row: 3, col: 8 },
  { row: 4, col: 8 },
  { row: 5, col: 8 },
  // Right column
  { row: 6, col: 9 },
  { row: 6, col: 10 },
  { row: 6, col: 11 },
  { row: 6, col: 12 },
  { row: 6, col: 13 },
  { row: 6, col: 14 },
  // Right column going down (Green start area)
  { row: 7, col: 14 },
  { row: 8, col: 14 },
  { row: 8, col: 13 },
  { row: 8, col: 12 },
  { row: 8, col: 11 },
  { row: 8, col: 10 },
  { row: 8, col: 9 },
  // Bottom middle
  { row: 9, col: 8 },
  { row: 10, col: 8 },
  { row: 11, col: 8 },
  { row: 12, col: 8 },
  { row: 13, col: 8 },
  { row: 14, col: 8 },
  // Bottom row going left
  { row: 14, col: 7 },
]

// Home areas for each color
const HOME_AREAS = {
  red: [
    { row: 11, col: 1 },
    { row: 11, col: 2 },
    { row: 12, col: 1 },
    { row: 12, col: 2 },
  ],
  blue: [
    { row: 1, col: 11 },
    { row: 1, col: 12 },
    { row: 2, col: 11 },
    { row: 2, col: 12 },
  ],
  green: [
    { row: 11, col: 11 },
    { row: 11, col: 12 },
    { row: 12, col: 11 },
    { row: 12, col: 12 },
  ],
  yellow: [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
  ],
}

// Home paths (final 5 squares before center)
const HOME_PATHS = {
  red: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
  blue: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
}

// Safe positions (star squares)
const SAFE_POSITIONS = [8, 13, 21, 26, 34, 39, 47]

export default function LudoBoard({
  gameState,
  onPieceClick,
  selectedPiece,
  canMove,
  validMoves = [],
}: LudoBoardProps) {
  const currentPlayer = gameState.players.find((p) => p.name === gameState.players[gameState.currentPlayer]?.name)

  const getPieceAtPosition = (row: number, col: number) => {
    const pieces: Array<{ playerIndex: number; pieceIndex: number; color: string; player: any; canMove: boolean }> = []

    gameState.players.forEach((player, playerIndex) => {
      player.pieces.forEach((piecePosition, pieceIndex) => {
        let isAtPosition = false

        // Check main board path
        if (piecePosition >= 0 && piecePosition < BOARD_PATH.length) {
          const pathPos = BOARD_PATH[piecePosition]
          if (pathPos.row === row && pathPos.col === col) {
            isAtPosition = true
          }
        }

        // Check home areas
        if (piecePosition === -1) {
          const homeArea = HOME_AREAS[player.color as keyof typeof HOME_AREAS]
          if (homeArea.some((pos) => pos.row === row && pos.col === col)) {
            isAtPosition = true
          }
        }

        // Check home paths (52-56 for each color)
        if (piecePosition >= 52 && piecePosition <= 56) {
          const homePathIndex = piecePosition - 52
          const homePath = HOME_PATHS[player.color as keyof typeof HOME_PATHS]
          if (homePath[homePathIndex] && homePath[homePathIndex].row === row && homePath[homePathIndex].col === col) {
            isAtPosition = true
          }
        }

        if (isAtPosition) {
          const canMovePiece = validMoves.includes(pieceIndex) && currentPlayer?.color === player.color
          pieces.push({ playerIndex, pieceIndex, color: player.color, player, canMove: canMovePiece })
        }
      })
    })

    return pieces
  }

  const isPathCell = (row: number, col: number) => {
    // Check if it's part of the main path
    if (BOARD_PATH.some((pos) => pos.row === row && pos.col === col)) return true

    // Check if it's part of any home path
    return Object.values(HOME_PATHS).some((path) => path.some((pos) => pos.row === row && pos.col === col))
  }

  const isHomeArea = (row: number, col: number) => {
    return Object.values(HOME_AREAS).some((area) => area.some((pos) => pos.row === row && pos.col === col))
  }

  const isCenterCell = (row: number, col: number) => {
    return row >= 6 && row <= 8 && col >= 6 && col <= 8
  }

  const getCellColor = (row: number, col: number) => {
    // Red area
    if (row >= 9 && col <= 5) return "red"
    // Blue area
    if (row <= 5 && col >= 9) return "blue"
    // Green area
    if (row >= 9 && col >= 9) return "green"
    // Yellow area
    if (row <= 5 && col <= 5) return "yellow"
    return null
  }

  const isSafePosition = (row: number, col: number) => {
    const pathIndex = BOARD_PATH.findIndex((pos) => pos.row === row && pos.col === col)
    return pathIndex !== -1 && SAFE_POSITIONS.includes(pathIndex)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-15 gap-1 bg-white/20 p-4 rounded-lg aspect-square">
        {Array.from({ length: 15 }, (_, row) =>
          Array.from({ length: 15 }, (_, col) => {
            const pieces = getPieceAtPosition(row, col)
            const isPath = isPathCell(row, col)
            const isHome = isHomeArea(row, col)
            const isCenter = isCenterCell(row, col)
            const cellColor = getCellColor(row, col)
            const isSafe = isSafePosition(row, col)

            return (
              <div
                key={`${row}-${col}`}
                className={`
                  aspect-square relative border border-white/20 rounded-sm flex items-center justify-center
                  ${isPath ? "bg-white/90" : ""}
                  ${isHome ? `bg-${cellColor}-200` : ""}
                  ${isCenter ? "bg-yellow-300" : ""}
                  ${isSafe ? "bg-yellow-400" : ""}
                  ${!isPath && !isHome && !isCenter ? "bg-white/10" : ""}
                `}
              >
                {/* Render pieces */}
                {pieces.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {pieces.length === 1 ? (
                      <button
                        onClick={() => pieces[0].canMove && onPieceClick(pieces[0].pieceIndex)}
                        disabled={!pieces[0].canMove}
                        className={`
                          w-6 h-6 rounded-full border-2 border-white shadow-lg
                          ${selectedPiece === pieces[0].pieceIndex ? "ring-2 ring-yellow-400" : ""}
                          ${pieces[0].canMove ? "ring-2 ring-green-400 hover:scale-110 cursor-pointer animate-pulse" : "cursor-not-allowed"}
                          transition-transform
                        `}
                        style={{ backgroundColor: pieces[0].color }}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-0.5 w-full h-full p-0.5">
                        {pieces.slice(0, 4).map((piece, i) => (
                          <button
                            key={i}
                            onClick={() => piece.canMove && onPieceClick(piece.pieceIndex)}
                            disabled={!piece.canMove}
                            className={`
                              rounded-full border border-white shadow-sm
                              ${selectedPiece === piece.pieceIndex ? "ring-1 ring-yellow-400" : ""}
                              ${piece.canMove ? "ring-1 ring-green-400 hover:scale-110 cursor-pointer animate-pulse" : "cursor-not-allowed"}
                              transition-transform
                            `}
                            style={{ backgroundColor: piece.color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cell markers */}
                {isSafe && pieces.length === 0 && <div className="w-2 h-2 bg-yellow-600 rounded-full" />}

                {isCenter && pieces.length === 0 && <div className="text-xs font-bold text-gray-800">🏠</div>}
              </div>
            )
          }),
        )}
      </div>

      {/* Game instructions */}
      <div className="mt-4 text-center text-white/70 text-sm space-y-1">
        <p>🎯 Move all 4 pieces from home to center to win!</p>
        <p>🎲 Roll 6 to get pieces out of home area</p>
        <p>⭐ Star squares are safe positions</p>
        {validMoves.length > 0 && (
          <p className="text-green-400 font-medium animate-pulse">✨ Click the glowing pieces to move them!</p>
        )}
      </div>
    </div>
  )
}
