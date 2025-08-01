import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { useInstance } from "../Components/Instances";
import { rtdb } from "../../lib/firebase";
import { ref, set, push, remove, get } from "firebase/database";
import {
  updateTask,
  setActiveTask,
} from "../store/taskSlice";
import { unlockInput } from "../store/taskInputSlice";

interface QuitButtonOptions {
  timerSeconds: number;
  task: string;
  localVolume: number;
  setTimerRunning: (running: boolean) => void;
  setTask: (task: string) => void;
  setInputLocked: (locked: boolean) => void;
  setHasStarted: (started: boolean) => void;
  setShowQuitModal: (show: boolean) => void;
  heartbeatIntervalRef?: React.MutableRefObject<NodeJS.Timeout | null>;
}

const MIN_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function useQuitButton() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, currentInstance } = useInstance();
  const reduxTasks = useSelector((state: RootState) => state.tasks.tasks);
  const activeTaskId = useSelector((state: RootState) => state.tasks.activeTaskId);

  const notifyEvent = useCallback(
    async (type: "quit", duration: number) => {
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
          console.error('[QuitButton] Failed to fetch user data from Firebase:', error);
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

  const handleQuitConfirm = useCallback(
    async (options: QuitButtonOptions) => {
      const {
        timerSeconds,
        task,
        localVolume,
        setTimerRunning,
        setTask,
        setInputLocked,
        setHasStarted,
        setShowQuitModal,
        heartbeatIntervalRef,
      } = options;

      // Get the task name from Redux if not provided (happens when task is paused)
      let taskName = task.trim();
      if (!taskName && activeTaskId) {
        const activeTask = reduxTasks.find(t => t.id === activeTaskId);
        taskName = activeTask?.name || "";
      }
      
      // STEP 1: Global Effects - Flying message, sound, history
      if (timerSeconds > 0 && currentInstance && user && taskName) {
        const hours = Math.floor(timerSeconds / 3600)
          .toString()
          .padStart(2, "0");
        const minutes = Math.floor((timerSeconds % 3600) / 60)
          .toString()
          .padStart(2, "0");
        const secs = (timerSeconds % 60).toString().padStart(2, "0");
        const historyRef = ref(rtdb, `rooms/${currentInstance.id}/history`);
        const quitData = {
          userId: user.id,
          displayName: user.displayName,
          task: taskName + " (Quit Early)",
          duration: `${hours}:${minutes}:${secs}`,
          timestamp: Date.now(),
          completed: false,
        };
        push(historyRef, quitData);

        // Also add to global completed tasks (will be filtered out from stats due to "Quit Early")
        if (typeof window !== "undefined") {
          const windowWithTask = window as Window & { addCompletedTask?: (task: typeof quitData) => void };
          if (windowWithTask.addCompletedTask) {
            windowWithTask.addCompletedTask(quitData);
          }
        }

        // Always play quit sound locally
        const quitAudio = new Audio("/quit.mp3");
        quitAudio.volume = localVolume;
        quitAudio.play();

        // Only notify quit to RTDB if minimum duration is met
        if (user?.id && currentInstance && timerSeconds >= MIN_DURATION_MS / 1000) {
          notifyEvent("quit", timerSeconds);
        }

        // Always add flying message for quit to GlobalEffects
        const flyingMessageId = `${user.id}-quit-${Date.now()}`;
        const flyingMessageRef = ref(rtdb, `GlobalEffects/${currentInstance.id}/flyingMessages/${flyingMessageId}`);
        set(flyingMessageRef, {
          text: `💀 ${user.displayName} folded faster than a lawn chair.`,
          color: "text-red-500",
          userId: user.id,
          timestamp: Date.now(),
        });

        // Auto-remove the message after 7 seconds
        setTimeout(() => {
          remove(flyingMessageRef);
        }, 7000);

        // Remove ActiveWorker immediately when quitting
        const activeWorkerRef = ref(rtdb, `ActiveWorker/${user.id}`);
        remove(activeWorkerRef);
      }

      // STEP 2: KILL THE HEARTBEAT FIRST
      if (heartbeatIntervalRef?.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      if (user?.id) {
        await remove(ref(rtdb, `TaskBuffer/${user.id}/heartbeat`));
      }

      // STEP 3: NUKE THE TASK FROM TASKBUFFER - SIMPLE AND DIRECT
      const taskIdToClean = activeTaskId;
      if (taskIdToClean && user?.id) {
        
        // Direct Firebase removal - no Redux thunks, no bullshit
        const taskRef = ref(rtdb, `TaskBuffer/${user.id}/${taskIdToClean}`);
        await remove(taskRef);
        
        // Remove timer_state if it matches this task
        const timerStateRef = ref(rtdb, `TaskBuffer/${user.id}/timer_state`);
        const timerSnapshot = await get(timerStateRef);
        if (timerSnapshot.exists() && timerSnapshot.val().taskId === taskIdToClean) {
          await remove(timerStateRef);
        }
        
        // Heartbeat already killed in STEP 2
        
        // Remove LastTask if it matches this task
        const lastTaskRef = ref(rtdb, `TaskBuffer/${user.id}/LastTask`);
        const lastTaskSnapshot = await get(lastTaskRef);
        if (lastTaskSnapshot.exists() && lastTaskSnapshot.val().taskId === taskIdToClean) {
          await remove(lastTaskRef);
        }
        
      }

      // Clean up room presence
      if (currentInstance && user?.id) {
        const activeRef = ref(rtdb, `rooms/${currentInstance.id}/activeUsers/${user.id}`);
        remove(activeRef);
      }
      
      // Reset all UI state
      setTimerRunning(false);
      setTask("");  // Clear the task
      setInputLocked(false);
      setHasStarted(false);
      setShowQuitModal(false);

      // STEP 4: Clear Redux state LAST after everything else is done
      if (taskIdToClean) {
        // Reset task in Redux
        dispatch(
          updateTask({
            id: taskIdToClean,
            updates: {
              status: "not_started" as const,
              timeSpent: 0,
              lastActive: undefined,
            },
          })
        );
        
        // Clear active task
        dispatch(setActiveTask(null));
      } else {
        // Even if no taskIdToClean, still clear active task
        dispatch(setActiveTask(null));
      }
      
      // Ensure input is unlocked (in case something re-locked it)
      dispatch(unlockInput());
    },
    [dispatch, user, currentInstance, reduxTasks, activeTaskId, notifyEvent]
  );

  const handlePushOn = useCallback((setShowQuitModal: (show: boolean) => void) => {
    setShowQuitModal(false);
  }, []);

  return { handleQuitConfirm, handlePushOn };
}