import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export class GroqGameFixer {
  static async fixLudoGame(): Promise<string> {
    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `
        I need to fix a Ludo multiplayer game with these critical issues:

        1. ROOM ID SYSTEM NOT WORKING:
        - Players can't join rooms by ID
        - Room creation doesn't generate proper IDs
        - Room management is broken

        2. DICE ROLLING BROKEN:
        - Dice doesn't roll properly
        - Turn management is incorrect
        - Players can't take turns

        3. BOARD RENDERING ISSUES:
        - Game board not displaying correctly
        - Pieces not showing on board
        - Board layout is wrong

        4. PIECE MOVEMENT BROKEN:
        - Pieces don't move when clicked
        - Game logic is faulty
        - No valid moves detection

        Please provide a complete solution with:
        - Working room system with proper IDs
        - Functional dice rolling mechanism
        - Correct board rendering
        - Proper piece movement logic
        - Turn-based gameplay
        - Error handling

        Focus on making it work for multiplayer family gaming.
        `,
        maxTokens: 2000,
      })

      return text
    } catch (error) {
      console.error("Error getting Groq help:", error)
      return "Using fallback fixes for the game issues."
    }
  }

  static async getDiceRollingFix(): Promise<string> {
    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `
        Fix the dice rolling system for a Ludo game. The dice should:
        - Roll 1-6 randomly
        - Show visual feedback
        - Allow only current player to roll
        - Handle turn switching
        - Support "roll again" on 6
        
        Provide the exact code structure needed.
        `,
        maxTokens: 500,
      })

      return text
    } catch (error) {
      return "Implementing standard dice rolling mechanism."
    }
  }

  static async getBoardRenderingFix(): Promise<string> {
    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `
        Fix the Ludo board rendering. The board should:
        - Show 15x15 grid properly
        - Display colored home areas
        - Show the main path
        - Render pieces correctly
        - Handle piece positioning
        
        Provide the exact implementation.
        `,
        maxTokens: 500,
      })

      return text
    } catch (error) {
      return "Implementing standard board rendering."
    }
  }
}
