import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface SessionInfo {
  sessionId: string;
  meetingUrl: string;
  started: string;
  updated: string;
  recordCount: number;
}

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

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<SessionInfo | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [view, setView] = useState<"main" | "sessions" | "details">("main");

  const sendMessage = useCallback(async (action: string, data?: Record<string, unknown>) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return null;
    
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id!, { action, ...data }, resolve);
    });
  }, []);

  const loadStatus = useCallback(async () => {
    const status = await sendMessage("getStatus") as { isRecording: boolean; session: SessionInfo | null } | null;
    if (status) {
      setIsRecording(status.isRecording);
      setCurrentSession(status.session);
    }
  }, [sendMessage]);

  const loadSessions = useCallback(async () => {
    const sessionList = await sendMessage("listSessions") as SessionInfo[];
    if (sessionList) {
      setSessions(sessionList.sort((a, b) => 
        new Date(b.updated).getTime() - new Date(a.updated).getTime()
      ));
    }
  }, [sendMessage]);

  useEffect(() => {
    const doLoad = async () => {
      await loadStatus();
      await loadSessions();
    };
    doLoad();
    const interval = setInterval(loadStatus, 2000);
    return () => clearInterval(interval);
  }, [loadStatus, loadSessions]);

  const handleStart = async () => {
    const result = await sendMessage("start") as { success: boolean; message: string } | null;
    if (result?.success) {
      loadStatus();
    } else {
      alert(result?.message || "Failed to start recording");
    }
  };

  const handleStop = async () => {
    await sendMessage("stop");
    loadStatus();
    loadSessions();
  };

  const handleDownloadSession = async (sessionId: string) => {
    await sendMessage("downloadSession", { sessionId });
  };

  const handleViewSession = async (sessionId: string) => {
    const session = await sendMessage("getSession", { sessionId }) as SessionData;
    if (session) {
      setSelectedSession(session);
      setView("details");
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (view === "details" && selectedSession) {
    return (
      <div className="w-[400px] h-[500px] flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setView("sessions")}
            className="mb-2"
          >
            ← Back
          </Button>
          <h2 className="font-semibold text-sm truncate">{selectedSession.sessionId}</h2>
          <p className="text-xs text-gray-500">{selectedSession.recordCount} captions</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {selectedSession.records.map((record) => (
            <div key={record.id} className="border rounded-lg p-3 bg-white">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm text-blue-600">{record.speaker}</span>
                <span className="text-xs text-gray-400">{formatDate(record.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-700">{record.text}</p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <Button 
            className="w-full" 
            onClick={() => handleDownloadSession(selectedSession.sessionId)}
          >
            📥 Download JSON
          </Button>
        </div>
      </div>
    );
  }

  if (view === "sessions") {
    return (
      <div className="w-[400px] h-[500px] flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setView("main")}
            className="mb-2"
          >
            ← Back
          </Button>
          <h2 className="text-lg font-semibold">📚 All Sessions</h2>
          <p className="text-xs text-gray-500">{sessions.length} total</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-sm">No sessions recorded yet</p>
              <p className="text-xs mt-1">Start recording to create a session</p>
            </div>
          ) : (
            sessions.map((session) => (
              <Card key={session.sessionId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{session.sessionId}</h3>
                      <p className="text-xs text-gray-500">
                        {formatDate(session.started)}
                      </p>
                    </div>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {session.recordCount}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs"
                      onClick={() => handleViewSession(session.sessionId)}
                    >
                      👁 View
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => handleDownloadSession(session.sessionId)}
                    >
                      📥 Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 w-[340px]">
      <Card>
        <CardHeader>
          <h1 className="text-lg font-semibold">🎙 Meet Captions Recorder</h1>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500">
              Status: <span className={`font-medium ${isRecording ? 'text-green-600' : 'text-gray-600'}`}>
                {isRecording ? "🔴 Recording" : "⚫ Idle"}
              </span>
            </p>
            {currentSession && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {currentSession.recordCount} captions
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleStart}
              disabled={isRecording}
            >
              ▶ Start
            </Button>

            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleStop}
              disabled={!isRecording}
            >
              ⏹ Stop
            </Button>
          </div>

          {currentSession && (
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <p className="font-medium truncate">{currentSession.sessionId}</p>
              <p className="text-gray-500">Started: {formatDate(currentSession.started)}</p>
              <p className="text-gray-500">Updated: {formatDate(currentSession.updated)}</p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              loadSessions();
              setView("sessions");
            }}
          >
            📚 View All Sessions ({sessions.length})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
