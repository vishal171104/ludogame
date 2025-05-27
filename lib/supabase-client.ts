"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Types for our database
export interface Room {
  id: string
  name: string
  players: string[]
  max_players: number
  status: "waiting" | "playing" | "finished"
  game_mode: "classic" | "speed" | "family"
  created_by: string
  created_at: string
  updated_at: string
}

export interface GameState {
  room_id: string
  players: Array<{
    id: string
    name: string
    color: "red" | "blue" | "green" | "yellow"
    pieces: number[]
    isActive: boolean
  }>
  current_player: number
  dice_value: number
  game_status: "waiting" | "playing" | "finished"
  winner?: string
  can_roll_again: boolean
  move_completed: boolean
  last_move?: any
  created_at: string
  updated_at: string
}
