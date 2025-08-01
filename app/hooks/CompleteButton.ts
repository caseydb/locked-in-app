import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { useInstance } from "../Components/Instances";
import { rtdb } from "../../lib/firebase";
import { ref, set, remove, onDisconnect, get } from "firebase/database";
import {
  updateTask,
  transferTaskToPostgres,
} from "../store/taskSlice";
import { setIsActive } from "../store/realtimeSlice";
import { addHistoryEntry } from "../store/historySlice";
import { updateLeaderboardOptimistically, refreshLeaderboard } from "../store/leaderboardSlice";
import { resetInput } from "../store/taskInputSlice";

interface CompleteButtonOptions {
  task: string;
  seconds: number;
  localVolume: number;
  clearTimerState: () => void;
  onComplete?: (duration: string) => void;
  setIsCompleting: (completing: boolean) => void;
  heartbeatIntervalRef?: React.MutableRefObject<NodeJS.Timeout | null>;
}

const MIN_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function useCompleteButton() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, currentInstance } = useInstance();
  const reduxTasks = useSelector((state: RootState) => state.tasks.tasks);
  const reduxUser = useSelector((state: RootState) => state.user);
  const activeTaskId = useSelector((state: RootState) => state.tasks.activeTaskId);
  const { currentTaskId } = useSelector((state: RootState) => state.taskInput);
  const [showCompleteFeedback, setShowCompleteFeedback] = useState(false);

  const formatTime = (s: number) => {
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
  };

  const notifyEvent = useCallback(
    async (type: "complete", duration: number) => {
      if (currentInstance && user?.id) {
        // Try to get firstName/lastName from Firebase Users
        let firstName = "";
        let lastName = "";
        try {
          const userRef = ref(rtdb, `Users/${user.id}`);
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const userData = snapshot.val();
            firstName = userData.firstName || "";
            lastName = userData.lastName || "";
          }
        } catch (error) {
          console.error('[CompleteButton] Failed to fetch user data from Firebase:', error);
        }
        
        const eventId = `${user.id}-${type}-${Date.now()}`;
        const eventRef = ref(rtdb, `GlobalEffects/${currentInstance.id}/events/${eventId}`);
        const eventData = {
          displayName: user.displayName, // Keep for backward compatibility
          firstName,
          lastName,
          userId: user.id,
          type,
          timestamp: Date.now(),
          duration,
        };

        set(eventRef, eventData);

        // Auto-cleanup old events after 10 seconds
        setTimeout(() => {
          import("firebase/database").then(({ remove }) => {
            remove(eventRef);
          });
        }, 10000);
      }
    },
    [currentInstance, user]
  );

  const handleComplete = useCallback(
    async (options: CompleteButtonOptions) => {
      const { task, seconds, localVolume, clearTimerState, onComplete, setIsCompleting, heartbeatIntervalRef } =
        options;

      // Prevent multiple clicks
      if (showCompleteFeedback) {
        setShowCompleteFeedback(true);
        setTimeout(() => setShowCompleteFeedback(false), 300);
        return;
      }

      setIsCompleting(true);

      // PRIORITY 1: Clear heartbeat interval FIRST to prevent interference
      if (heartbeatIntervalRef?.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // PRIORITY 2: Play completion sound immediately for instant feedback
      const completeAudio = new Audio("/complete.mp3");
      completeAudio.volume = localVolume;
      completeAudio.play();

      const completionTime = formatTime(seconds);

      // PRIORITY 3: Send global effect immediately
      if (seconds >= MIN_DURATION_MS / 1000) {
        notifyEvent("complete", seconds);
      }

      // PRIORITY 4: Remove ActiveWorker to ensure clean state for global effects
      if (user?.id) {
        const activeWorkerRef = ref(rtdb, `ActiveWorker/${user.id}`);
        remove(activeWorkerRef);
        onDisconnect(activeWorkerRef).cancel();
      }

      // PRIORITY 5: Clear timer state
      clearTimerState();
      dispatch(setIsActive(false));
      dispatch(resetInput());

      // Mark today as completed for streak tracking
      if (typeof window !== "undefined") {
        const windowWithStreak = window as Window & { markStreakComplete?: () => Promise<void> };
        if (windowWithStreak.markStreakComplete) {
          windowWithStreak.markStreakComplete();
        }
      }

      // Optimistically update task status to completed
      const taskId = activeTaskId || currentTaskId;
      if (taskId) {
        dispatch(
          updateTask({
            id: taskId,
            updates: { status: "completed" as const, completed: true },
          })
        );
      }

      // Always call onComplete callback immediately for UI updates
      if (onComplete) {
        onComplete(completionTime);
      }

      // Reset completing state after 2 seconds
      setTimeout(() => {
        setIsCompleting(false);
      }, 2000);

      // Check milestones IMMEDIATELY after completion - independent of task transfer
      if (reduxUser?.user_id && typeof window !== "undefined") {
        // Fire and forget milestone check
        (async () => {
          try {
            const response = await fetch("/api/user/milestones/check", {
              headers: {
                "X-User-Id": reduxUser.user_id!,
              },
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data.shouldShowPopup) {
                // Dispatch event to show milestone popup
                window.dispatchEvent(new CustomEvent("showMilestoneInvite", {
                  detail: {
                    milestone: data.data.milestone,
                    stats: data.data.stats
                  }
                }));
              }
            }
          } catch {
            // Silently fail - milestones are not critical
          }
        })();
      }

      // Transfer task to Postgres - NON-BLOCKING (fire and forget)
      const taskIdForTransfer = activeTaskId || currentTaskId;

      if (taskIdForTransfer && user?.id) {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("firebase_token") || "";

          // Fire and forget - don't await, don't block UI
          dispatch(
            transferTaskToPostgres({
              taskId: taskIdForTransfer,
              firebaseUserId: user.id,
              status: "completed",
              token,
              duration: seconds,
            })
          )
            .unwrap()
            .then(async (result) => {
              // Handle success in background
              if (result && result.alreadyCompleted) {
                // Task was already completed - this is normal behavior
                return;
              }
              
              if (result && result.savedTask && reduxUser?.user_id) {
                // Get task name from the saved task or find it in Redux
                const taskFromRedux = reduxTasks.find(t => t.id === taskIdForTransfer);
                const taskName = result.savedTask.task_name || taskFromRedux?.name || task || "Unnamed Task";
                
                dispatch(
                  addHistoryEntry({
                    taskId: result.savedTask.id,
                    userId: reduxUser.user_id,
                    displayName: `${reduxUser.first_name || ""} ${reduxUser.last_name || ""}`.trim() || "Anonymous",
                    taskName: taskName,
                    duration: seconds,
                  })
                );

                // Update leaderboard optimistically and refresh from server
                dispatch(
                  updateLeaderboardOptimistically({
                    userId: reduxUser.user_id,
                    authId: reduxUser.auth_id || user.id, // Fallback to Firebase user.id if auth_id not available yet
                    firstName: reduxUser.first_name || "",
                    lastName: reduxUser.last_name || "",
                    profileImage: reduxUser.profile_image || null,
                    taskDuration: seconds,
                  })
                );

                // Refresh leaderboard from server to get accurate totals
                dispatch(refreshLeaderboard());

                // Write to RTDB to notify all room members about history update
                if (currentInstance?.id) {
                  const historyUpdateRef = ref(rtdb, `rooms/${currentInstance.id}/historyUpdate`);
                  set(historyUpdateRef, {
                    timestamp: Date.now(),
                    userId: reduxUser.user_id
                  });
                }
              }
            })
            .catch((error) => {
              // Log error but don't block UI
              console.error("[CompleteButton] Background task save failed:", error);
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              // Optional: Show a non-blocking notification instead of alert
              console.warn(`Failed to save task completion: ${errorMessage}`);
            });
        }
      }
    },
    [dispatch, user, reduxUser, reduxTasks, activeTaskId, currentTaskId, notifyEvent, showCompleteFeedback, currentInstance?.id]
  );

  return { handleComplete, showCompleteFeedback };
}