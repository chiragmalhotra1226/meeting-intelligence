const APP_URL = "http://localhost:3000";
let timerInterval = null;
let startTime = null;
let transcriptLines = [];

// ── DOM Elements ─────────────────────────────────────────────────────────────
const sections = {
  login: document.getElementById("login-section"),
  ready: document.getElementById("ready-section"),
  recording: document.getElementById("recording-section"),
  done: document.getElementById("done-section"),
};

function showSection(name) {
  Object.values(sections).forEach((s) => (s.style.display = "none"));
  sections[name].style.display = "flex";
}

// ── Timer ────────────────────────────────────────────────────────────────────
function startTimer(from) {
  startTime = from || Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    document.getElementById("rec-timer").textContent = `${m}:${s.toString().padStart(2, "0")}`;
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

// ── Meeting Detection ────────────────────────────────────────────────────────
function checkCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const url = tabs[0].url || "";
    const meetingDetected = document.getElementById("meeting-detected");
    const noMeeting = document.getElementById("no-meeting");
    const meetingName = document.getElementById("meeting-name");

    if (/meet\.google\.com/.test(url)) {
      meetingDetected.style.display = "flex";
      noMeeting.style.display = "none";
      meetingName.textContent = "Google Meet Detected";
    } else if (/zoom\.us/.test(url)) {
      meetingDetected.style.display = "flex";
      noMeeting.style.display = "none";
      meetingName.textContent = "Zoom Meeting Detected";
    } else if (/teams\.microsoft|teams\.live/.test(url)) {
      meetingDetected.style.display = "flex";
      noMeeting.style.display = "none";
      meetingName.textContent = "MS Teams Detected";
    } else {
      meetingDetected.style.display = "none";
      noMeeting.style.display = "flex";
    }
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
  if (!status) return;

  if (!status.loggedIn) {
    showSection("login");
  } else if (status.recording) {
    showSection("recording");
    startTimer(status.startTime);
  } else {
    showSection("ready");
    checkCurrentTab();
  }
});

// ── Button Handlers ──────────────────────────────────────────────────────────
document.getElementById("btn-open-app").addEventListener("click", () => {
  chrome.tabs.create({ url: APP_URL });
});

document.getElementById("btn-save-token").addEventListener("click", () => {
  const token = document.getElementById("token-input").value.trim();
  if (token) {
    chrome.runtime.sendMessage({ type: "SAVE_TOKEN", token });
    showSection("ready");
    checkCurrentTab();
  }
});

document.getElementById("btn-start").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "START" });
  showSection("recording");
  startTimer();
  transcriptLines = [];
});

document.getElementById("btn-stop").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STOP" });
  stopTimer();
  showSection("done");
});

document.getElementById("btn-open-dashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: `${APP_URL}/dashboard` });
});

document.getElementById("btn-new-session").addEventListener("click", () => {
  showSection("ready");
  checkCurrentTab();
  transcriptLines = [];
  document.getElementById("stat-words").textContent = "0";
  document.getElementById("stat-chunks").textContent = "0";
  document.getElementById("transcript-preview").innerHTML = '<p class="transcript-placeholder">Waiting for speech...</p>';
});

// ── Live transcript updates ──────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "LIVE_TRANSCRIPT") {
    document.getElementById("stat-words").textContent = msg.wordCount || 0;
    document.getElementById("stat-chunks").textContent = msg.chunkCount || 0;

    transcriptLines.push(msg.text);
    if (transcriptLines.length > 8) transcriptLines = transcriptLines.slice(-8);

    const preview = document.getElementById("transcript-preview");
    preview.innerHTML = transcriptLines
      .map((line, i) => `<p class="transcript-line" style="opacity:${0.4 + (i / transcriptLines.length) * 0.6}">${line}</p>`)
      .join("");
    preview.scrollTop = preview.scrollHeight;
  }

  if (msg.type === "STATUS") {
    if (msg.recording) {
      showSection("recording");
      if (!timerInterval) startTimer();
    }
  }

  if (msg.type === "ERROR") {
    alert(msg.message);
  }

  if (msg.type === "CAPTURE_COMPLETE") {
    stopTimer();
    showSection("done");
  }
});