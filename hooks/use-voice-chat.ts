"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export function useVoiceChat(roomId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map())

  const connectToRoom = useCallback(async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn("Voice chat not supported in this browser")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      setLocalStream(stream)
      setIsConnected(true)
      console.log("Voice chat connected to room:", roomId)
    } catch (error) {
      console.warn("Voice chat permission denied or not available:", error)
      // Continue without voice chat
      setIsConnected(false)
    }
  }, [roomId])

  const disconnectFromRoom = useCallback(() => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch (error) {
            console.error("Error stopping track:", error)
          }
        })
        setLocalStream(null)
      }

      // Close all peer connections
      peerConnections.current.forEach((pc) => {
        try {
          pc.close()
        } catch (error) {
          console.error("Error closing peer connection:", error)
        }
      })
      peerConnections.current.clear()

      // Remove all audio elements
      audioElements.current.forEach((audio) => {
        try {
          audio.pause()
          audio.remove()
        } catch (error) {
          console.error("Error removing audio element:", error)
        }
      })
      audioElements.current.clear()

      setIsConnected(false)
    } catch (error) {
      console.error("Error disconnecting from voice chat:", error)
    }
  }, [localStream])

  const toggleMute = useCallback(() => {
    try {
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled
          setIsMuted(!audioTrack.enabled)
        }
      }
    } catch (error) {
      console.error("Error toggling mute:", error)
    }
  }, [localStream])

  const toggleDeafen = useCallback(() => {
    try {
      const newDeafenState = !isDeafened
      setIsDeafened(newDeafenState)

      // Mute/unmute all remote audio elements
      audioElements.current.forEach((audio) => {
        try {
          audio.muted = newDeafenState
        } catch (error) {
          console.error("Error toggling audio mute:", error)
        }
      })
    } catch (error) {
      console.error("Error toggling deafen:", error)
    }
  }, [isDeafened])

  useEffect(() => {
    return () => {
      disconnectFromRoom()
    }
  }, [disconnectFromRoom])

  return {
    isConnected,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    connectToRoom,
    disconnectFromRoom,
  }
}
