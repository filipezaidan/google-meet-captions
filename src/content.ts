/** CONFIG **/
const CAPTIONS_SELECTORS = [
  'div[role="region"][aria-label="Captions"]',      // English
  'div[role="region"][aria-label="Legendas"]',      // Portuguese
  'div[role="region"][aria-label="Subtítulos"]',    // Spanish
  'div[role="region"][aria-label="Sous-titres"]'    // French
];
const DEBOUNCE_MS = 300;
const BACKUP_INTERVAL_MS = 5000;

/** TYPES **/
interface CaptionRecord {
  id: number;
  speaker: string;
  text: string;
  timestamp: string;
}

interface SessionData {
  sessionId: string;
  meetingUrl: string;
  started: string;
  updated: string;
  recordCount: number;
  records: CaptionRecord[];
}

/** HELPERS **/
const nowISO = () => new Date().toISOString();
const getText = (el: Element) => ((el as HTMLElement).innerText || "").trim();

function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  }) as T;
}

/** INDEXEDDB **/
const DB_NAME = "MeetCaptionsDB";
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("sessions")) {
        const store = db.createObjectStore("sessions", { keyPath: "sessionId" });
        store.createIndex("updated", "updated", { unique: false });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

async function saveSession(db: IDBDatabase, sessionData: SessionData): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("sessions", "readwrite");
    tx.objectStore("sessions").put(sessionData);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadSession(db: IDBDatabase, sessionId: string): Promise<SessionData | null> {
  return new Promise((resolve) => {
    const tx = db.transaction("sessions", "readonly");
    const store = tx.objectStore("sessions");
    const req = store.get(sessionId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

async function getAllSessions(db: IDBDatabase): Promise<SessionData[]> {
  return new Promise((resolve) => {
    const tx = db.transaction("sessions", "readonly");
    const store = tx.objectStore("sessions");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

/** STATE **/
let observer: MutationObserver | null = null;
let backupTimer: ReturnType<typeof setInterval> | null = null;
let dbInstance: IDBDatabase | null = null;
let currentSession: SessionData | null = null;
const activeNodes = new Map<Element, CaptionRecord>();
let nextId = 1;
let isRecording = false;

/** CORE LOGIC **/
function parseNode(node: Element): { speaker: string; text: string } | null {
  const text = getText(node);
  const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  return { speaker: lines[0], text: lines.slice(1).join(" ") };
}

function upsert(node: Element, parsed: { speaker: string; text: string }) {
  if (!currentSession) return;

  const existing = activeNodes.get(node);
  if (!existing) {
    const entry: CaptionRecord = {
      id: nextId++,
      speaker: parsed.speaker,
      text: parsed.text,
      timestamp: nowISO()
    };
    activeNodes.set(node, entry);
    currentSession.records.push(entry);
    currentSession.recordCount = currentSession.records.length;
    console.log("Captured caption:", entry);
    return;
  }
  if (existing.text !== parsed.text) {
    existing.text = parsed.text;
    const target = currentSession.records.find(r => r.id === existing.id);
    if (target) {
      target.text = parsed.text;
      target.timestamp = nowISO();
    }
  }
}

function pruneInvisible(visibleNodes: Set<Element>) {
  for (const node of activeNodes.keys()) {
    if (!visibleNodes.has(node)) activeNodes.delete(node);
  }
}

function findCaptionsContainer(): Element | null {
  for (const selector of CAPTIONS_SELECTORS) {
    const container = document.querySelector(selector);
    if (container) {
      console.log(`✅ Found captions container with selector: ${selector}`);
      return container;
    }
  }
  return null;
}

async function startRecording() {
  if (isRecording) {
    console.log("Already recording");
    return { success: true, message: "Already recording", sessionId: currentSession?.sessionId };
  }

  console.log("Starting caption recording...");
  
  // Find the captions container first
  const root = findCaptionsContainer();
  if (!root) {
    console.error("❌ Captions container not found. Make sure captions are enabled in Google Meet.");
    return { success: false, message: "Captions container not found. Enable captions first." };
  }

  // Open database
  try {
    dbInstance = await openDB();
  } catch (error) {
    console.error("Failed to open IndexedDB:", error);
    return { success: false, message: "Failed to open database" };
  }

  // Generate meeting ID from URL
  const meetingUrl = window.location.href;
  const meetingCode = meetingUrl.match(/meet\.google\.com\/([a-z-]+)/)?.[1] || "unknown";
  const sessionId = `${meetingCode}-${Date.now()}`;
  
  // Initialize or resume session
  currentSession = {
    sessionId,
    meetingUrl,
    started: nowISO(),
    updated: nowISO(),
    recordCount: 0,
    records: []
  };

  // Reset state
  activeNodes.clear();
  nextId = 1;

  console.log(`✅ Starting session: ${sessionId}`);

  // Process captions with debouncing
  const processCaptions = debounce(() => {
    const visible = new Set(root.querySelectorAll(":scope > div"));
    visible.forEach(node => {
      const parsed = parseNode(node);
      if (parsed) upsert(node, parsed);
    });
    pruneInvisible(visible);
  }, DEBOUNCE_MS);

  // Start observing
  observer = new MutationObserver(() => processCaptions());
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Start auto-backup
  backupTimer = setInterval(async () => {
    if (dbInstance && currentSession) {
      try {
        currentSession.updated = nowISO();
        await saveSession(dbInstance, currentSession);
        console.log(`📦 Auto-backup: ${currentSession.recordCount} records`);
      } catch (error) {
        console.error("Auto-backup failed:", error);
      }
    }
  }, BACKUP_INTERVAL_MS);

  isRecording = true;
  console.log("📡 Caption observer started");
  
  return { success: true, message: "Recording started", sessionId };
}

async function stopRecording() {
  console.log("Stopping caption recording...");
  
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  if (backupTimer) {
    clearInterval(backupTimer);
    backupTimer = null;
  }

  // Final backup
  if (dbInstance && currentSession) {
    try {
      currentSession.updated = nowISO();
      await saveSession(dbInstance, currentSession);
      console.log(`🛑 Stopped ${currentSession.sessionId} (${currentSession.recordCount} records saved).`);
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  }

  isRecording = false;
  return { success: true, message: "Recording stopped", recordCount: currentSession?.recordCount || 0 };
}

function downloadSession(sessionData: SessionData) {
  const blob = new Blob([JSON.stringify(sessionData.records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sessionData.sessionId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function getCurrentSessionInfo() {
  if (!currentSession) {
    return { isRecording: false, session: null };
  }
  return { 
    isRecording, 
    session: {
      sessionId: currentSession.sessionId,
      recordCount: currentSession.recordCount,
      started: currentSession.started,
      updated: currentSession.updated
    }
  };
}

async function listAllSessions() {
  try {
    if (!dbInstance) {
      dbInstance = await openDB();
    }
    const sessions = await getAllSessions(dbInstance);
    return sessions.map(s => ({
      sessionId: s.sessionId,
      meetingUrl: s.meetingUrl,
      started: s.started,
      updated: s.updated,
      recordCount: s.recordCount
    }));
  } catch (error) {
    console.error("Failed to list sessions:", error);
    return [];
  }
}

async function downloadSessionById(sessionId: string) {
  try {
    if (!dbInstance) {
      dbInstance = await openDB();
    }
    const session = await loadSession(dbInstance, sessionId);
    if (session) {
      downloadSession(session);
      return { success: true, message: "Download started" };
    }
    return { success: false, message: "Session not found" };
  } catch (error) {
    console.error("Failed to download session:", error);
    return { success: false, message: "Failed to download" };
  }
}

async function getSessionData(sessionId: string) {
  try {
    if (!dbInstance) {
      dbInstance = await openDB();
    }
    const session = await loadSession(dbInstance, sessionId);
    return session;
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Content script received:", message);

  if (message.action === "start") {
    startRecording().then(sendResponse);
  } else if (message.action === "stop") {
    stopRecording().then(sendResponse);
  } else if (message.action === "getStatus") {
    getCurrentSessionInfo().then(sendResponse);
  } else if (message.action === "listSessions") {
    listAllSessions().then(sendResponse);
  } else if (message.action === "downloadSession") {
    downloadSessionById(message.sessionId).then(sendResponse);
  } else if (message.action === "getSession") {
    getSessionData(message.sessionId).then(sendResponse);
  }

  return true; // Keep the message channel open for async response
});

console.log("📡 Google Meet Captions extension loaded");