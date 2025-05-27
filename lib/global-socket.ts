"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { supabase } from "./supabase-client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface GlobalSocket {
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
  connected: boolean
}

export function useGlobalSocket(): GlobalSocket | null {
  const [socket, setSocket] = useState<GlobalSocket | null>(null)
  const listenersRef = useRef<Map<string, ((data: any) => void)[]>>(new Map())
  const channelRef = useRef<RealtimeChannel | null>(null)

  const createGlobalSocket = useCallback(() => {
    const globalSocket: GlobalSocket & { trigger: (event: string, data: any) => void } = {
      connected: true,

      emit: async (event: string, data?: any) => {
        console.log("🌍 Global socket emit:", event, data)

        try {
          switch (event) {
            case "get-rooms":
              const { data: rooms, error } = await supabase
                .from("ludo_rooms")
                .select("*")
                .order("created_at", { ascending: false })

              if (error) {
                console.error("❌ Error fetching rooms:", error)
                globalSocket.trigger("rooms-list", [])
              } else {
                console.log("📋 Fetched rooms from database:", rooms)
                globalSocket.trigger("rooms-list", rooms || [])
              }
              break

            case "create-room":
              if (data?.name && data?.playerName) {
                const roomId = `ROOM${Math.random().toString(36).substring(2, 8).toUpperCase()}`

                const { data: newRoom, error } = await supabase
                  .from("ludo_rooms")
                  .insert({
                    id: roomId,
                    name: data.name,
                    players: [data.playerName],
                    max_players: 4,
                    status: "waiting",
                    game_mode: data.gameMode || "family",
                    created_by: data.playerName,
                  })
                  .select()
                  .single()

                if (error) {
                  console.error("❌ Error creating room:", error)
                } else {
                  console.log("✅ Room created in database:", newRoom)
                  globalSocket.trigger("room-created", newRoom)
                  globalSocket.trigger("room-joined", roomId)
                  globalSocket.trigger("room-updated", newRoom)

                  // Refresh rooms list
                  globalSocket.emit("get-rooms")
                }
              }
              break

            case "join-room":
              if (data?.roomId && data?.playerName) {
                const roomId = data.roomId.toUpperCase()
                console.log("🔍 Attempting to join room:", roomId, "with player:", data.playerName)

                try {
                  // Get current room
                  const { data: room, error: fetchError } = await supabase
                    .from("ludo_rooms")
                    .select("*")
                    .eq("id", roomId)
                    .single()

                  console.log("🔍 Room fetch result:", { room, fetchError })

                  if (fetchError || !room) {
                    console.log("❌ Room not found:", roomId)

                    // Get available rooms for error message
                    const { data: availableRooms } = await supabase.from("ludo_rooms").select("id")
                    const availableIds = availableRooms?.map((r) => r.id) || []

                    globalSocket.trigger("room-join-failed", {
                      message: `Room ${roomId} not found! Available rooms: ${availableIds.join(", ") || "None"}`,
                    })
                    return
                  }

                  // Check if room is full
                  if (room.players.length >= room.max_players) {
                    console.log("❌ Room is full:", room.players.length, "/", room.max_players)
                    globalSocket.trigger("room-join-failed", { message: "Room is full!" })
                    return
                  }

                  // Check if player already in room
                  if (room.players.includes(data.playerName)) {
                    console.log("✅ Player already in room, rejoining:", data.playerName)
                    globalSocket.trigger("room-joined", roomId)
                    globalSocket.trigger("room-updated", room)
                    return
                  }

                  // Add player to room
                  const updatedPlayers = [...room.players, data.playerName]
                  console.log("🔄 Updating room with players:", updatedPlayers)

                  const { data: updatedRoom, error: updateError } = await supabase
                    .from("ludo_rooms")
                    .update({
                      players: updatedPlayers,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", roomId)
                    .select()
                    .single()

                  if (updateError) {
                    console.error("❌ Error updating room:", updateError)
                    globalSocket.trigger("room-join-failed", { message: "Failed to join room! Database error." })
                  } else {
                    console.log("✅ Successfully joined room:", updatedRoom)
                    globalSocket.trigger("room-joined", roomId)
                    globalSocket.trigger("room-updated", updatedRoom)

                    // Refresh rooms list
                    setTimeout(() => {
                      globalSocket.emit("get-rooms")
                    }, 500)
                  }
                } catch (error) {
                  console.error("❌ Unexpected error joining room:", error)
                  globalSocket.trigger("room-join-failed", { message: "Unexpected error joining room!" })
                }
              }
              break

            case "start-game":
              if (data?.roomId) {
                // Update room status
                const { error: roomError } = await supabase
                  .from("ludo_rooms")
                  .update({ status: "playing" })
                  .eq("id", data.roomId)

                if (roomError) {
                  console.error("❌ Error updating room status:", roomError)
                  return
                }

                // Get room data
                const { data: room } = await supabase.from("ludo_rooms").select("*").eq("id", data.roomId).single()

                if (room && room.players.length >= 2) {
                  // Create initial game state
                  const gameState = {
                    room_id: data.roomId,
                    players: room.players.map((name: string, index: number) => ({
                      id: `player_${index}`,
                      name,
                      color: ["red", "blue", "green", "yellow"][index] as any,
                      pieces: [-1, -1, -1, -1],
                      isActive: true,
                    })),
                    current_player: 0,
                    dice_value: 0,
                    game_status: "playing" as const,
                    can_roll_again: false,
                    move_completed: true,
                  }

                  const { error: gameError } = await supabase.from("ludo_game_states").upsert(gameState)

                  if (gameError) {
                    console.error("❌ Error creating game state:", gameError)
                  } else {
                    console.log("🎮 Game started:", gameState)
                    globalSocket.trigger("game-started", gameState)
                    globalSocket.trigger("game-state", gameState)
                  }
                }
              }
              break

            case "join-game":
              if (data?.roomId) {
                const { data: gameState } = await supabase
                  .from("ludo_game_states")
                  .select("*")
                  .eq("room_id", data.roomId)
                  .single()

                if (gameState) {
                  console.log("🎮 Player joined existing game:", gameState)
                  globalSocket.trigger("game-state", gameState)
                }
              }
              break

            case "roll-dice":
              if (data?.roomId) {
                const { data: gameState } = await supabase
                  .from("ludo_game_states")
                  .select("*")
                  .eq("room_id", data.roomId)
                  .single()

                if (gameState && gameState.move_completed) {
                  const diceValue = Math.floor(Math.random() * 6) + 1

                  const { error } = await supabase
                    .from("ludo_game_states")
                    .update({
                      dice_value: diceValue,
                      move_completed: false,
                      can_roll_again: false,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("room_id", data.roomId)

                  if (!error) {
                    console.log("🎲 Dice rolled:", diceValue)
                    globalSocket.trigger("dice-rolled", diceValue)

                    // Get updated state and trigger
                    const { data: updatedState } = await supabase
                      .from("ludo_game_states")
                      .select("*")
                      .eq("room_id", data.roomId)
                      .single()

                    if (updatedState) {
                      globalSocket.trigger("game-state", updatedState)
                    }
                  }
                }
              }
              break

            case "move-piece":
              if (data?.roomId && data?.pieceIndex !== undefined) {
                const { data: gameState } = await supabase
                  .from("ludo_game_states")
                  .select("*")
                  .eq("room_id", data.roomId)
                  .single()

                if (gameState && gameState.dice_value > 0) {
                  // Implement move logic here
                  const updatedGameState = movePieceLogic(gameState, data.pieceIndex)

                  const { error } = await supabase
                    .from("ludo_game_states")
                    .update({
                      ...updatedGameState,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("room_id", data.roomId)

                  if (!error) {
                    console.log("✅ Piece moved")
                    globalSocket.trigger("piece-moved", updatedGameState)
                    globalSocket.trigger("game-state", updatedGameState)
                  }
                }
              }
              break

            case "leave-room":
              if (data?.roomId && data?.playerName) {
                const { data: room } = await supabase.from("ludo_rooms").select("*").eq("id", data.roomId).single()

                if (room) {
                  const updatedPlayers = room.players.filter((p: string) => p !== data.playerName)

                  if (updatedPlayers.length === 0) {
                    // Delete room if empty
                    await supabase.from("ludo_rooms").delete().eq("id", data.roomId)
                  } else {
                    // Update room
                    await supabase.from("ludo_rooms").update({ players: updatedPlayers }).eq("id", data.roomId)
                  }

                  globalSocket.trigger("player-left", { roomId: data.roomId, playerName: data.playerName })
                  globalSocket.emit("get-rooms")
                }
              }
              break
          }
        } catch (error) {
          console.error("❌ Global socket error:", error)
        }
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

    // Set up real-time subscriptions
    const setupRealtimeSubscriptions = () => {
      // Subscribe to room changes
      const roomsChannel = supabase
        .channel("ludo_rooms_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "ludo_rooms" }, (payload) => {
          console.log("🔄 Room change detected:", payload)
          globalSocket.emit("get-rooms")
        })
        .subscribe()

      // Subscribe to game state changes
      const gameStatesChannel = supabase
        .channel("ludo_game_states_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "ludo_game_states" }, (payload) => {
          console.log("🎮 Game state change detected:", payload)
          if (payload.new) {
            globalSocket.trigger("game-state", payload.new)
          }
        })
        .subscribe()

      channelRef.current = roomsChannel
    }

    setupRealtimeSubscriptions()
    return globalSocket
  }, [])

  useEffect(() => {
    const socketInstance = createGlobalSocket()
    setSocket(socketInstance)

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      listenersRef.current.clear()
    }
  }, [createGlobalSocket])

  return socket
}

// Helper function for move logic
function movePieceLogic(gameState: any, pieceIndex: number) {
  // Implement the piece movement logic here
  // This is a simplified version - you can expand it
  const currentPlayer = gameState.current_player
  const player = gameState.players[currentPlayer]
  const diceValue = gameState.dice_value

  // Basic move logic (expand as needed)
  if (player.pieces[pieceIndex] === -1 && diceValue === 6) {
    // Move from home
    const startPositions = { red: 0, blue: 13, green: 26, yellow: 39 }
    player.pieces[pieceIndex] = startPositions[player.color as keyof typeof startPositions]
  } else if (player.pieces[pieceIndex] >= 0) {
    // Move on board
    player.pieces[pieceIndex] += diceValue
  }

  // Update turn
  const wasRolledSix = diceValue === 6
  return {
    ...gameState,
    players: gameState.players,
    current_player: wasRolledSix ? currentPlayer : (currentPlayer + 1) % gameState.players.length,
    dice_value: 0,
    move_completed: true,
    can_roll_again: wasRolledSix,
  }
}
