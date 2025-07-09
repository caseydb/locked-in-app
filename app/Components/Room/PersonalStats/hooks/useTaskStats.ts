import { useState, useEffect } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { InstanceData, HistoryEntry, CompletedTask } from "../types";
import { getStreakDate } from "../utils";

export function useTaskStats(userId: string | undefined) {
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Listen to all instances to find user's completions across all rooms
    const instancesRef = ref(rtdb, "instances");
    const handle = onValue(instancesRef, (snapshot) => {
      const instancesData = snapshot.val();
      let userTasksCompleted = 0;
      let userTotalSeconds = 0;
      const completedTasks: CompletedTask[] = [];
      const roomsWithUserData: string[] = [];

      if (instancesData) {
        const currentStreakDate = getStreakDate(); // Get today's streak date (4am UTC window)

        // Go through each instance/room
        Object.entries(instancesData).forEach(([instanceId, instanceData]) => {
          const typedInstanceData = instanceData as InstanceData;
          // Check if there's history data for this instance
          if (typedInstanceData.history) {
            let foundUserInRoom = false;

            // Go through each history entry in this room
            Object.entries(typedInstanceData.history).forEach(([, entry]) => {
              const typedEntry = entry as HistoryEntry;
              // Check if this entry belongs to our user
              if (typedEntry.userId === userId && !typedEntry.task.toLowerCase().includes("quit early")) {
                foundUserInRoom = true;

                // Check if it's within today's 4am UTC window
                if (typedEntry.timestamp) {
                  const entryStreakDate = getStreakDate(typedEntry.timestamp);

                  if (entryStreakDate === currentStreakDate) {
                    // Parse duration more robustly
                    let seconds = 0;
                    if (typedEntry.duration && typeof typedEntry.duration === "string") {
                      const parts = typedEntry.duration.split(":").map(Number);
                      if (parts.length === 3) {
                        // hh:mm:ss format
                        const [h, m, s] = parts;
                        if (!isNaN(h) && !isNaN(m) && !isNaN(s)) {
                          seconds = h * 3600 + m * 60 + s;
                        }
                      } else if (parts.length === 2) {
                        // mm:ss format
                        const [m, s] = parts;
                        if (!isNaN(m) && !isNaN(s)) {
                          seconds = m * 60 + s;
                        }
                      }
                    }

                    // Only process if we got valid seconds
                    if (seconds > 0) {
                      userTasksCompleted += 1;
                      userTotalSeconds += seconds;

                      // Add to completed tasks array for logging
                      completedTasks.push({
                        task: typedEntry.task,
                        duration: typedEntry.duration,
                        timestamp: typedEntry.timestamp,
                        seconds: seconds,
                        roomId: instanceId,
                      });
                    }
                  }
                }
              }
            });

            if (foundUserInRoom) {
              roomsWithUserData.push(instanceId);
            }
          }
        });
      }

      setTasksCompleted(userTasksCompleted);
      setTotalSeconds(userTotalSeconds);
      setLoading(false);
    });

    return () => off(instancesRef, "value", handle);
  }, [userId]);

  return {
    tasksCompleted,
    totalSeconds,
    loading,
  };
}