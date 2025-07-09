import { useState, useEffect, useRef, useCallback } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, set, onValue, off, remove, DataSnapshot } from "firebase/database";

export function useTimerState(currentInstance: { id: string } | null, userId: string | undefined, task?: string) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const isInitializedRef = useRef(false);

  // Helper to save timer state to Firebase (only on state changes, not every second)
  const saveTimerState = useCallback(
    (isRunning: boolean, baseSeconds: number = 0) => {
      if (currentInstance && userId) {
        const timerStateRef = ref(rtdb, `instances/${currentInstance.id}/userTimers/${userId}`);
        const now = Date.now();

        if (isRunning) {
          // Store when timer started and base seconds
          set(timerStateRef, {
            running: true,
            startTime: now,
            baseSeconds: baseSeconds, // seconds accumulated before this start
            task: task || "",
            lastUpdate: now,
          });
        } else {
          // Store paused state with total accumulated seconds
          set(timerStateRef, {
            running: false,
            totalSeconds: baseSeconds,
            task: task || "",
            lastUpdate: now,
          });
        }
      }
    },
    [currentInstance, userId, task]
  );

  // Helper to clear timer state from Firebase
  const clearTimerState = useCallback(() => {
    if (currentInstance && userId) {
      const timerStateRef = ref(rtdb, `instances/${currentInstance.id}/userTimers/${userId}`);
      remove(timerStateRef);
    }
  }, [currentInstance, userId]);

  // Listen for timer state changes from Firebase (for cross-tab sync)
  useEffect(() => {
    if (!currentInstance || !userId) {
      isInitializedRef.current = false;
      return;
    }

    const timerStateRef = ref(rtdb, `instances/${currentInstance.id}/userTimers/${userId}`);

    const handleTimerState = (snapshot: DataSnapshot) => {
      const timerState = snapshot.val();

      if (timerState) {
        const isRunning = timerState.running || false;
        let currentSeconds = 0;

        if (isRunning && timerState.startTime) {
          // Calculate current seconds: base + elapsed time since start
          const elapsedMs = Date.now() - timerState.startTime;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          currentSeconds = (timerState.baseSeconds || 0) + elapsedSeconds;
        } else {
          // Use stored total seconds when paused
          currentSeconds = timerState.totalSeconds || 0;
        }

        // Normal restoration - don't check user count here
        setSeconds(currentSeconds);
        setRunning(isRunning);
      } else if (isInitializedRef.current) {
        // Only reset if we were already initialized (not on first load)
        setSeconds(0);
        setRunning(false);
      }

      isInitializedRef.current = true;
    };

    const handle = onValue(timerStateRef, handleTimerState);

    return () => {
      off(timerStateRef, "value", handle);
    };
  }, [currentInstance, userId]);

  // Update display every second when running (local only, no Firebase writes)
  useEffect(() => {
    if (running) {
      const interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [running]);

  return {
    seconds,
    running,
    setRunning,
    saveTimerState,
    clearTimerState,
  };
}