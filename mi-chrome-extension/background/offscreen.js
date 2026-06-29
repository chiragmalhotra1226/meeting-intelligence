let recognition = null;
let mediaStream = null;
let isCapturing = false;
let sessionId = null;
let token = null;
let apiBase = "";
let buffer = [];
let wordCount = 0;
let chunkCount = 0;
let startTime = 0;
let flushTimer = null;

// ── Flush buffer to backend ─────────────────────────────────────────────────
function flushBuffer() {
  if (!buffer.length || !sessionId) return;
  const chunks = buffer.splice(0);

  fetch(`${apiBase}/api/meetings/save-chunks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, chunks }),
  }).catch((err) => console.error("Flush failed:", err));
}

// ── Start speech recognition on captured audio ──────────────────────────────
async function startCapture(streamId, sid, tk, api) {
  sessionId = sid;
  token = tk;
  apiBase = api;
  startTime = Date.now();
  wordCount = 0;
  chunkCount = 0;
  buffer = [];

  try {
    // Get the tab's audio stream using the stream ID
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
    });

    // Create audio context to process the stream
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(mediaStream);

    // Connect to destination so we can hear the audio too
    // (without this, the tab audio would be muted)
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);

    // Also route to analyser for volume detection
    const analyser = audioCtx.createAnalyser();
    source.connect(analyser);

    // Start Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      chrome.runtime.sendMessage({ type: "ERROR", message: "Speech recognition not supported" });
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && result[0].transcript.trim()) {
          const text = result[0].transcript.trim();
          const chunk = {
            text,
            speaker: "EXTENSION_CAPTURE",
            time_offset: (Date.now() - startTime) / 1000,
            confidence: result[0].confidence || 0.9,
          };

          buffer.push(chunk);
          chunkCount++;
          wordCount += text.split(/\s+/).length;

          // Notify popup
          chrome.runtime.sendMessage({
            type: "TRANSCRIPT_UPDATE",
            text,
            wordCount,
            chunkCount,
          });
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      console.error("Speech error:", event.error);
    };

    // Auto-restart when Chrome kills it (~60s)
    recognition.onend = () => {
      if (isCapturing) {
        setTimeout(() => {
          if (isCapturing) {
            try {
              recognition.start();
            } catch {}
          }
        }, 200);
      }
    };

    recognition.start();
    isCapturing = true;

    // Periodic flush every 10 seconds
    flushTimer = setInterval(flushBuffer, 10000);
  } catch (err) {
    chrome.runtime.sendMessage({ type: "ERROR", message: `Capture failed: ${err.message}` });
  }
}

// ── Stop capture and trigger analysis ────────────────────────────────────────
async function stopCapture(sid, tk, api) {
  isCapturing = false;

  if (recognition) {
    recognition.onend = null;
    try { recognition.stop(); } catch {}
    recognition = null;
  }

  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }

  // Final flush
  flushBuffer();

  // Stop media stream
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }

  // Build full transcript from any remaining local knowledge
  const fullText = buffer.map((c) => c.text).join(" ");

  // Trigger analysis
  if (sid && tk && fullText.length > 50) {
    try {
      await fetch(`${api || apiBase}/api/meetings/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tk || token}`,
        },
        body: JSON.stringify({
          session_id: sid || sessionId,
          transcript: fullText,
        }),
      });
    } catch (err) {
      console.error("Analysis trigger failed:", err);
    }
  }

  chrome.runtime.sendMessage({ type: "CAPTURE_COMPLETE" });
}

// ── Message listener ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "START_CAPTURE") {
    startCapture(msg.streamId, msg.sessionId, msg.token, msg.apiBase);
  }
  if (msg.type === "STOP_CAPTURE") {
    stopCapture(msg.sessionId, msg.token, msg.apiBase);
  }
});