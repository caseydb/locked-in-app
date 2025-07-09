import { useEffect, useState } from "react";
import { rtdb } from "../../../../lib/firebase";
import { ref, set, remove, push, onValue, off } from "firebase/database";

export function useTimerCoordination(
  currentInstance: any,
  user: any,
  timerRunning: boolean,
  timerSecondsRef: React.RefObject<number>,
  task: string
) {
  const [localVolume, setLocalVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("lockedin_volume");
      if (stored !== null) return Number(stored);
    }
    return 0.2;
  });

  const [previousVolume, setPreviousVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("lockedin_previous_volume");
      if (stored !== null && Number(stored) > 0) return Number(stored);
    }
    return 0.2; // Default to 0.2 if no valid previous volume
  });

  // Persist volume to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lockedin_volume", String(localVolume));
      if (localVolume > 0) {
        setPreviousVolume(localVolume);
        window.localStorage.setItem("lockedin_previous_volume", String(localVolume));
      }
    }
  }, [localVolume]);

  // Toggle mute function
  const toggleMute = () => {
    setLocalVolume((currentVolume) => {
      if (currentVolume === 0) {
        // Unmute: restore previous volume, ensuring it's not 0
        const volumeToRestore = previousVolume > 0 ? previousVolume : 0.2;
        return volumeToRestore;
      } else {
        // Mute: save current volume and set to 0
        setPreviousVolume(currentVolume);
        return 0;
      }
    });
  };

  // Helper to format time
  function formatTime(s: number) {
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (s % 60).toString().padStart(2, "0");

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes}:${secs}`;
    } else {
      return `${minutes}:${secs}`;
    }
  }

  // Tab title management
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerRunning) {
      const updateTitle = () => {
        document.title = formatTime(timerSecondsRef.current || 0);
      };
      interval = setInterval(updateTitle, 1000);
      updateTitle();
    } else {
      document.title = "Locked In";
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSecondsRef]);

  // Listen for event notifications
  useEffect(() => {
    if (!currentInstance) return;
    const lastEventRef = ref(rtdb, `instances/${currentInstance.id}/lastEvent`);
    let timeout: NodeJS.Timeout | null = null;
    let firstRun = true;

    const handle = onValue(lastEventRef, (snap) => {
      if (firstRun) {
        firstRun = false;
        return;
      }
      const val = snap.val();
      if (val && val.displayName && val.type) {
        let emoji = "";
        if (val.type === "start") emoji = "🥊";
        if (val.type === "complete") emoji = "🏆";
        if (val.type === "quit") emoji = "💀";
        document.title = `${emoji} ${val.displayName}`;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (timerRunning) {
            document.title = formatTime(timerSecondsRef.current || 0);
          } else {
            document.title = "Locked In";
          }
        }, 5000);
      }
    });

    return () => {
      off(lastEventRef, "value", handle);
      if (timeout) clearTimeout(timeout);
    };
  }, [currentInstance, timerRunning, timerSecondsRef]);

  // Track active user status in Firebase
  const handleActiveChange = (isActive: boolean) => {
    if (!currentInstance || !user) return;
    const activeRef = ref(rtdb, `instances/${currentInstance.id}/activeUsers/${user.id}`);
    
    if (isActive) {
      set(activeRef, { id: user.id, displayName: user.displayName });
    } else {
      remove(activeRef);
    }
  };

  // Add event notification
  function notifyEvent(type: "complete" | "quit" | "start") {
    if (currentInstance) {
      const lastEventRef = ref(rtdb, `instances/${currentInstance.id}/lastEvent`);
      set(lastEventRef, { displayName: user.displayName, type, timestamp: Date.now() });
    }
  }

  // Add flying message to Firebase
  const addFlyingMessage = (text: string, color: string) => {
    if (!currentInstance || !user) return;
    
    const flyingMessageId = `${user.id}-${Date.now()}`;
    const flyingMessageRef = ref(rtdb, `instances/${currentInstance.id}/flyingMessages/${flyingMessageId}`);
    
    set(flyingMessageRef, {
      text,
      color,
      userId: user.id,
      timestamp: Date.now(),
    });

    // Auto-remove after 7 seconds
    setTimeout(() => {
      remove(flyingMessageRef);
    }, 7000);
  };

  // Save completion to history
  const saveToHistory = (data: any) => {
    if (!currentInstance || !user) return;
    
    const historyRef = ref(rtdb, `instances/${currentInstance.id}/history`);
    const userHistoryRef = ref(rtdb, `users/${user.id}/completionHistory`);
    
    push(historyRef, data);
    push(userHistoryRef, data);
  };

  // Clear Firebase timer state
  const clearTimerState = () => {
    if (currentInstance && user?.id) {
      const timerStateRef = ref(rtdb, `instances/${currentInstance.id}/userTimers/${user.id}`);
      remove(timerStateRef);
    }
  };

  return {
    localVolume,
    setLocalVolume,
    toggleMute,
    formatTime,
    handleActiveChange,
    notifyEvent,
    addFlyingMessage,
    saveToHistory,
    clearTimerState,
  };
}