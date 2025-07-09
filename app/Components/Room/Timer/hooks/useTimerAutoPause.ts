import { useEffect } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, onValue, off, DataSnapshot } from "firebase/database";

export function useTimerAutoPause(
  currentInstance: any,
  userId: string | undefined,
  running: boolean,
  seconds: number,
  task: string | undefined,
  saveTimerState: (isRunning: boolean, baseSeconds: number) => void
) {
  // Listen for user count changes and pause timer when room becomes empty
  useEffect(() => {
    if (!currentInstance || !userId) return;

    const usersRef = ref(rtdb, `instances/${currentInstance.id}/users`);

    const handleUserCountChange = (snapshot: DataSnapshot) => {
      const usersData = snapshot.val();
      const userCount = usersData ? Object.keys(usersData).length : 0;

      // If room becomes empty and timer is running, pause it immediately
      if (userCount === 0 && running) {
        // Save paused state to Firebase
        saveTimerState(false, seconds);
      }
    };

    const handle = onValue(usersRef, handleUserCountChange);

    return () => {
      off(usersRef, "value", handle);
    };
  }, [currentInstance, userId, running, seconds, task, saveTimerState]);

  // Pause timer when user leaves the page (closes tab, refreshes, or navigates away)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (running) {
        // Pause the timer and save state to Firebase
        saveTimerState(false, seconds);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [running, seconds, task, saveTimerState]);
}