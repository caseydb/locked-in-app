import { useCallback } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, set } from "firebase/database";

export function useTimerEvents(currentInstance: any, userDisplayName: string | undefined) {
  // Add event notification for start, complete, and quit
  const notifyEvent = useCallback(
    (type: "start" | "complete" | "quit") => {
      if (currentInstance && userDisplayName) {
        const lastEventRef = ref(rtdb, `instances/${currentInstance.id}/lastEvent`);
        set(lastEventRef, { displayName: userDisplayName, type, timestamp: Date.now() });
      }
    },
    [currentInstance, userDisplayName]
  );

  return {
    notifyEvent,
  };
}