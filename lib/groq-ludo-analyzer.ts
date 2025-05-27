import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export interface LudoAnalysis {
  basicRules: string[]
  advancedStrategies: string[]
  multiplayerTips: string[]
  gameVariations: string[]
  winningStrategies: string[]
}

export class GroqLudoAnalyzer {
  static async analyzeLudoGame(): Promise<LudoAnalysis> {
    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `
        Analyze the board game Ludo comprehensively. Provide detailed information about:

        1. BASIC RULES: Core gameplay mechanics, how pieces move, dice rules, starting positions
        2. ADVANCED STRATEGIES: Expert-level tactics, positioning, timing, risk management
        3. MULTIPLAYER DYNAMICS: How to play with 2-4 players, team strategies, social aspects
        4. GAME VARIATIONS: Different versions of Ludo played worldwide
        5. WINNING STRATEGIES: Proven methods to increase win rate, psychological tactics

        Format your response as a detailed analysis that covers everything from beginner to master level.
        Include specific tips for family/cousin gameplay sessions.
        `,
        maxTokens: 2000,
      })

      return this.parseLudoAnalysis(text)
    } catch (error) {
      console.error("Error analyzing Ludo with Groq:", error)
      return this.getFallbackAnalysis()
    }
  }

  static async getGameCommentary(gameState: any, lastMove: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `
        You are a Ludo game commentator. Analyze this game situation and provide engaging commentary:

        Game State: ${JSON.stringify(gameState, null, 2)}
        Last Move: ${lastMove}

        Provide a brief, exciting commentary (1-2 sentences) about:
        - The strategic significance of the move
        - Current game dynamics
        - What players should watch for next

        Keep it fun and family-friendly for cousins playing together.
        `,
        maxTokens: 150,
      })

      return text.trim()
    } catch (error) {
      console.error("Error generating commentary:", error)
      return "Great move! The game is heating up!"
    }
  }

  static async suggestMove(gameState: any, playerIndex: number): Promise<string> {
    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt: `
        You are a Ludo strategy advisor. Analyze this game state and suggest the best move:

        Game State: ${JSON.stringify(gameState, null, 2)}
        Player Index: ${playerIndex}

        Provide a strategic suggestion explaining:
        - Which piece to move and why
        - The strategic reasoning
        - Potential risks and benefits

        Keep advice concise and actionable.
        `,
        maxTokens: 200,
      })

      return text.trim()
    } catch (error) {
      console.error("Error generating move suggestion:", error)
      return "Consider your options carefully and make the move that advances your position!"
    }
  }

  private static parseLudoAnalysis(text: string): LudoAnalysis {
    // Parse the AI response into structured data
    const sections = text.split(/\d+\.\s*/).filter((section) => section.trim())

    return {
      basicRules: this.extractRules(text, "BASIC RULES", "ADVANCED STRATEGIES"),
      advancedStrategies: this.extractRules(text, "ADVANCED STRATEGIES", "MULTIPLAYER DYNAMICS"),
      multiplayerTips: this.extractRules(text, "MULTIPLAYER DYNAMICS", "GAME VARIATIONS"),
      gameVariations: this.extractRules(text, "GAME VARIATIONS", "WINNING STRATEGIES"),
      winningStrategies: this.extractRules(text, "WINNING STRATEGIES", ""),
    }
  }

  private static extractRules(text: string, startMarker: string, endMarker: string): string[] {
    const startIndex = text.indexOf(startMarker)
    if (startIndex === -1) return []

    const endIndex = endMarker ? text.indexOf(endMarker, startIndex) : text.length
    const section = text.substring(startIndex, endIndex === -1 ? text.length : endIndex)

    // Extract bullet points or numbered items
    const rules = section
      .split(/[-•*]\s*/)
      .filter((rule) => rule.trim().length > 10)
      .map((rule) => rule.trim().replace(/^\d+\.\s*/, ""))
      .slice(0, 8) // Limit to 8 items per section

    return rules.length > 0 ? rules : ["Strategic gameplay information available"]
  }

  private static getFallbackAnalysis(): LudoAnalysis {
    return {
      basicRules: [
        "Roll dice to move pieces around the board",
        "Roll 6 to get pieces out of home",
        "Move all 4 pieces to center to win",
        "Capture opponents by landing on them",
        "Safe squares protect from capture",
        "Roll again when you get a 6",
      ],
      advancedStrategies: [
        "Spread pieces to avoid clustering",
        "Block opponents when possible",
        "Prioritize getting pieces out early",
        "Use safe squares strategically",
        "Time your moves for maximum impact",
        "Balance offense and defense",
      ],
      multiplayerTips: [
        "Form temporary alliances",
        "Watch for revenge moves",
        "Communicate and have fun",
        "Celebrate good moves",
        "Learn from each game",
        "Adapt to different play styles",
      ],
      gameVariations: [
        "Classic 4-player Ludo",
        "Team-based variants",
        "Speed Ludo with timers",
        "Custom house rules",
        "Tournament formats",
        "Online multiplayer versions",
      ],
      winningStrategies: [
        "Get all pieces out quickly",
        "Control the center lanes",
        "Capture strategically",
        "Protect leading pieces",
        "Force opponent mistakes",
        "Stay calm under pressure",
      ],
    }
  }
}
