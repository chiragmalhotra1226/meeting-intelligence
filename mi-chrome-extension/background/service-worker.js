// ── State ────────────────────────────────────────────────────────────────────
let isRecording = false;
let sessionId = null;
let token = null;
let offscreenReady = false;

const API_BASE = "http://localhost:8000";
const APP_URL = "http://localhost:3000";

// ── Meeting Detection ────────────────────────────────────────────────────────
const MEETING_PATTERNS = [
  { pattern: /meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i, name: "Google Meet" },
  { pattern: /zoom\.us\/j\/|zoom\.us\/wc\//i, name: "Zoom" },
  { pattern: /teams\.microsoft\.com\/.*meeting/i, name: "Microsoft Teams" },
  { pattern: /teams\.live\.com/i, name: "Microsoft Teams" },
];

function detectMeeting(url) {
  for (const { pattern, name } of MEETING_PATTERNS) {
    if (pattern.test(url)) return name;
  }
  return null;
}

// ── Tab Capture ──────────────────────────────────────────────────────────────
async function startCapture(tabId) {
  try {
    // Get auth token from storage
    const stored = await chrome.storage.local.get(["mi_token"]);
    token = stored.mi_token;

    if (!token) {
      chrome.runtime.sendMessage({ type: "ERROR", message: "Not logged in. Open Meeting Intelligence first and sign in." });
      return;
    }

    // Create meeting session
    const createRes = await fetch(`${API_BASE}/api/meetings/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: `Meeting Capture ${new Date().toLocaleString()}`,
        capture_source: "chrome_extension",
      }),
    });

    if (!createRes.ok) throw new Error("Failed to create meeting session");
    const { session_id } = await createRes.json();
    sessionId = session_id;

    // Capture the tab's audio
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });

    // Create offscreen document for audio processing
    if (!offscreenReady) {
      try {
        await chrome.offscreen.createDocument({
          url: "background/offscreen.html",
          reasons: ["USER_MEDIA"],
          justification: "Tab audio capture and speech recognition",
        });
        offscreenReady = true;
      } catch (e) {
        // Already exists
        offscreenReady = true;
      }
    }

    // Send stream ID to offscreen document
    chrome.runtime.sendMessage({
      type: "START_CAPTURE",
      streamId,
      sessionId,
      token,
      apiBase: API_BASE,
    });

    isRecording = true;

    // Update badge
    chrome.action.setBadgeText({ text: "REC" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });

    // Store session info
    await chrome.storage.local.set({
      mi_recording: true,
      mi_session_id: sessionId,
      mi_start_time: Date.now(),
    });

    chrome.runtime.sendMessage({ type: "STATUS", recording: true, sessionId });
  } catch (err) {
    chrome.runtime.sendMessage({ type: "ERROR", message: err.message });
  }
}

async function stopCapture() {
  chrome.runtime.sendMessage({ type: "STOP_CAPTURE", sessionId, token, apiBase: API_BASE });
  isRecording = false;
  sessionId = null;

  chrome.action.setBadgeText({ text: "" });
  await chrome.storage.local.set({ mi_recording: false, mi_session_id: null });
  chrome.runtime.sendMessage({ type: "STATUS", recording: false });
}

// ── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "START") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) startCapture(tabs[0].id);
    });
  }

  if (msg.type === "STOP") {
    stopCapture();
  }

  if (msg.type === "GET_STATUS") {
    chrome.storage.local.get(["mi_recording", "mi_session_id", "mi_start_time", "mi_token"], (data) => {
      sendResponse({
        recording: data.mi_recording || false,
        sessionId: data.mi_session_id,
        startTime: data.mi_start_time,
        loggedIn: !!data.mi_token,
      });
    });
    return true; // async response
  }

  if (msg.type === "SAVE_TOKEN") {
    chrome.storage.local.set({ mi_token: msg.token });
  }

  if (msg.type === "TRANSCRIPT_UPDATE") {
    // Forward to popup
    chrome.runtime.sendMessage({
      type: "LIVE_TRANSCRIPT",
      text: msg.text,
      wordCount: msg.wordCount,
      chunkCount: msg.chunkCount,
    });
  }

  if (msg.type === "CAPTURE_COMPLETE") {
    isRecording = false;
    chrome.action.setBadgeText({ text: "" });
    chrome.storage.local.set({ mi_recording: false });
  }
});

// ── Auto-detect meetings ─────────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const meeting = detectMeeting(tab.url);
    if (meeting && !isRecording) {
      // Show notification badge
      chrome.action.setBadgeText({ text: "●" });
      chrome.action.setBadgeBackgroundColor({ color: "#00f0ff" });
    }
  }
});