"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Lightbulb, MessageSquare, BookOpen, Trophy, Users, Gamepad2, Sparkles, ChevronDown } from "lucide-react"
import { GroqLudoAnalyzer, type LudoAnalysis } from "@/lib/groq-ludo-analyzer"
import type { GameState } from "@/lib/ludo-game-logic"

interface GroqGameAssistantProps {
  gameState: GameState
  isVisible: boolean
  onToggle: () => void
}

export default function GroqGameAssistant({ gameState, isVisible, onToggle }: GroqGameAssistantProps) {
  const [ludoAnalysis, setLudoAnalysis] = useState<LudoAnalysis | null>(null)
  const [commentary, setCommentary] = useState<string>("")
  const [moveSuggestion, setMoveSuggestion] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("rules")

  useEffect(() => {
    loadLudoAnalysis()
  }, [])

  const loadLudoAnalysis = async () => {
    setLoading(true)
    try {
      const analysis = await GroqLudoAnalyzer.analyzeLudoGame()
      setLudoAnalysis(analysis)
    } catch (error) {
      console.error("Failed to load Ludo analysis:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateCommentary = async () => {
    if (!gameState) return

    setLoading(true)
    try {
      const currentPlayer = gameState.players[gameState.currentPlayer]
      const lastMove = `${currentPlayer?.name} is playing with ${currentPlayer?.color} pieces`

      const newCommentary = await GroqLudoAnalyzer.getGameCommentary(gameState, lastMove)
      setCommentary(newCommentary)
    } catch (error) {
      console.error("Failed to generate commentary:", error)
      setCommentary("The game is getting exciting! Keep playing!")
    } finally {
      setLoading(false)
    }
  }

  const getSuggestion = async () => {
    if (!gameState) return

    setLoading(true)
    try {
      const suggestion = await GroqLudoAnalyzer.suggestMove(gameState, gameState.currentPlayer)
      setMoveSuggestion(suggestion)
    } catch (error) {
      console.error("Failed to get move suggestion:", error)
      setMoveSuggestion("Think strategically about your next move!")
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg z-50"
        size="lg"
      >
        <Brain className="h-5 w-5 mr-2" />
        AI Assistant
        <Sparkles className="h-4 w-4 ml-2" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-hidden bg-white/95 backdrop-blur-sm border-purple-200 shadow-2xl z-50">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-lg">
            <Brain className="h-5 w-5 mr-2" />
            Groq AI Ludo Assistant
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle} className="text-white hover:bg-white/20">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100">
            <TabsTrigger value="rules" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="strategy" className="text-xs">
              <Trophy className="h-3 w-3 mr-1" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Live
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Family
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-purple-700 flex items-center">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Basic Ludo Rules
              </h3>
              {loading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {ludoAnalysis?.basicRules.slice(0, 6).map((rule, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <Badge variant="outline" className="text-xs px-1 py-0 min-w-[20px] text-center">
                        {index + 1}
                      </Badge>
                      <span className="text-gray-700">{rule}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-green-700">Game Variations</h3>
              <div className="space-y-2">
                {ludoAnalysis?.gameVariations.slice(0, 4).map((variation, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    {variation}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-blue-700 flex items-center">
                <Trophy className="h-4 w-4 mr-2" />
                Advanced Strategies
              </h3>
              <div className="space-y-2">
                {ludoAnalysis?.advancedStrategies.slice(0, 5).map((strategy, index) => (
                  <div key={index} className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                    {strategy}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-orange-700">Winning Tactics</h3>
              <div className="space-y-2">
                {ludoAnalysis?.winningStrategies.slice(0, 4).map((strategy, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-orange-500 mr-2">🏆</span>
                    {strategy}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="live" className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-purple-700">Live Commentary</h3>
                <Button
                  size="sm"
                  onClick={generateCommentary}
                  disabled={loading}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  {loading ? "..." : "Get"}
                </Button>
              </div>
              {commentary && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">{commentary}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-green-700">Move Suggestion</h3>
                <Button
                  size="sm"
                  onClick={getSuggestion}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  {loading ? "..." : "Help"}
                </Button>
              </div>
              {moveSuggestion && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">{moveSuggestion}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Current Game Status</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <p>Players: {gameState.players.length}</p>
                <p>Current Turn: {gameState.players[gameState.currentPlayer]?.name}</p>
                <p>Game Status: {gameState.gameStatus}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-pink-700 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Family Gaming Tips
              </h3>
              <div className="space-y-2">
                {ludoAnalysis?.multiplayerTips.slice(0, 6).map((tip, index) => (
                  <div key={index} className="text-sm bg-pink-50 p-2 rounded border-l-2 border-pink-400">
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3 rounded-lg">
              <h4 className="font-medium text-purple-700 mb-2">Perfect for Cousins! 🎮</h4>
              <div className="space-y-1 text-xs text-purple-600">
                <p>• Create memorable gaming sessions</p>
                <p>• Build family bonds through play</p>
                <p>• Learn strategy together</p>
                <p>• Celebrate each other's wins</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
