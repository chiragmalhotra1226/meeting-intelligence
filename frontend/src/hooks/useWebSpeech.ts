import { useState, useRef, useCallback, useEffect } from 'react'

interface TranscriptChunk {
  text: string
  speaker: string
  time_offset: number
  confidence: number
  pitch_delta?: number
  is_final: boolean
}

interface UseWebSpeechOptions {
  sessionId: string
  token: string
  wsUrl?: string
  flushInterval?: number
}

export function useWebSpeech({ sessionId, token, wsUrl, flushInterval = 12000 }: UseWebSpeechOptions) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptChunk[]>([])
  const [interimText, setInterimText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [speakerChanges, setSpeakerChanges] = useState(0)
  const [avgConfidence, setAvgConfidence] = useState(1.0)
  const [volumeLevel, setVolumeLevel] = useState(0)

  const recognitionRef = useRef<any>(null)
  const bufferRef = useRef<TranscriptChunk[]>([])
  const startTimeRef = useRef<number>(0)
  const flushTimerRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const lastPitchRef = useRef<number>(0)
  const isRecordingRef = useRef(false)  // Ref to avoid stale closure
  const restartCountRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const volumeTimerRef = useRef<number | null>(null)
  const confidencesRef = useRef<number[]>([])

  // ── Pitch analyzer ────────────────────────────────────────────
  const initPitchAnalyzer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser

      // Volume level polling for waveform visualization
      volumeTimerRef.current = window.setInterval(() => {
        if (!analyser) return
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b, 0) / data.length
        setVolumeLevel(Math.round(avg))
      }, 100)
    } catch {
      // Pitch analysis is optional
    }
  }, [])

  const getPitchDelta = useCallback((): number => {
    if (!analyserRef.current) return 0
    const data = new Float32Array(analyserRef.current.fftSize)
    analyserRef.current.getFloatTimeDomainData(data)
    let maxVal = 0
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i])
      if (v > maxVal) maxVal = v
    }
    const currentPitch = maxVal * 100
    const delta = Math.abs(currentPitch - lastPitchRef.current)
    lastPitchRef.current = currentPitch
    // Large pitch delta suggests speaker change
    if (delta > 15) {
      setSpeakerChanges(prev => prev + 1)
    }
    return Math.round(delta * 100) / 100
  }, [])

  // ── Flush buffer to backend ───────────────────────────────────
  const flushBuffer = useCallback(() => {
    if (!sessionId || sessionId.startsWith('demo') || !sessionId.trim()) return
    const chunks = bufferRef.current.splice(0)
    if (!chunks.length) return

    fetch('/api/meetings/save-chunks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ session_id: sessionId, chunks }),
    }).catch(() => {})
  }, [token, sessionId])

  // ── Core recognition setup ────────────────────────────────────
  const createRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Web Speech API not supported. Use Chrome or Edge.')
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        const confidence = result[0].confidence || 0.9

        if (result.isFinal && text.trim()) {
          const chunk: TranscriptChunk = {
            text: text.trim(),
            speaker: 'LIVE_USER',
            time_offset: (Date.now() - startTimeRef.current) / 1000,
            confidence,
            pitch_delta: getPitchDelta(),
            is_final: true,
          }
          bufferRef.current.push(chunk)
          setTranscript(prev => [...prev, chunk])

          // Update stats
          const words = text.trim().split(/\s+/).length
          setWordCount(prev => prev + words)
          confidencesRef.current.push(confidence)
          setAvgConfidence(
            confidencesRef.current.reduce((a, b) => a + b, 0) / confidencesRef.current.length
          )
        } else {
          interim += text
        }
      }
      setInterimText(interim)
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return // Normal — user is quiet
      if (event.error === 'aborted') return   // Normal — we stopped it

      setError(`Speech error: ${event.error}`)

      // Auto-restart on recoverable errors
      if (['network', 'audio-capture', 'not-allowed'].includes(event.error)) {
        setTimeout(() => {
          if (isRecordingRef.current) {
            try { recognition.start() } catch {}
          }
        }, 2000)
      }
    }

    // KEY FIX: Chrome stops recognition after ~60s. This auto-restarts it.
    recognition.onend = () => {
      if (isRecordingRef.current) {
        restartCountRef.current += 1
        // Small delay to prevent rapid restart loops
        setTimeout(() => {
          if (isRecordingRef.current) {
            try {
              recognition.start()
            } catch (e) {
              // If start fails, create a fresh instance
              const fresh = createRecognition()
              if (fresh) {
                recognitionRef.current = fresh
                try { fresh.start() } catch {}
              }
            }
          }
        }, 150)
      }
    }

    return recognition
  }, [getPitchDelta])

  // ── Start recording ───────────────────────────────────────────
  const start = useCallback(async () => {
    setError(null)
    setTranscript([])
    setInterimText('')
    setWordCount(0)
    setSpeakerChanges(0)
    setAvgConfidence(1.0)
    confidencesRef.current = []
    restartCountRef.current = 0

    await initPitchAnalyzer()

    const recognition = createRecognition()
    if (!recognition) return

    startTimeRef.current = Date.now()
    isRecordingRef.current = true
    setIsRecording(true)

    try {
      recognition.start()
      recognitionRef.current = recognition
    } catch (e) {
      setError('Failed to start speech recognition')
      isRecordingRef.current = false
      setIsRecording(false)
      return
    }

    // Periodic flush to backend
    flushTimerRef.current = window.setInterval(flushBuffer, flushInterval)
  }, [createRecognition, initPitchAnalyzer, flushBuffer, flushInterval])

  // ── Stop recording ────────────────────────────────────────────
  const stop = useCallback(() => {
    isRecordingRef.current = false
    setIsRecording(false)

    if (recognitionRef.current) {
      recognitionRef.current.onend = null  // Prevent auto-restart
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }

    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current)
      flushTimerRef.current = null
    }

    if (volumeTimerRef.current) {
      clearInterval(volumeTimerRef.current)
      volumeTimerRef.current = null
    }

    // Final flush
    flushBuffer()

    // Cleanup audio
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
    setVolumeLevel(0)
  }, [flushBuffer])

  // ── Beacon fallback on page unload ────────────────────────────
  useEffect(() => {
    const handleUnload = () => {
      if (bufferRef.current.length > 0 && sessionId && !sessionId.startsWith('pending') && !sessionId.startsWith('demo')) {
        const payload = JSON.stringify({
          session_id: sessionId,
          text: bufferRef.current.map(c => c.text).join(' '),
        })
        navigator.sendBeacon('/api/meetings/beacon', payload)
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [sessionId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        isRecordingRef.current = false
        recognitionRef.current?.stop()
        streamRef.current?.getTracks().forEach(t => t.stop())
        audioCtxRef.current?.close()
      }
    }
  }, [])

  return {
    isRecording,
    transcript,
    interimText,
    error,
    start,
    stop,
    wordCount,
    speakerChanges,
    avgConfidence,
    volumeLevel,
    restartCount: restartCountRef.current,
    fullText: transcript.map(c => c.text).join(' '),
  }
}