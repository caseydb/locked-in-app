import { useState, useEffect, useRef } from "react";
import { useInstance } from "../../Instances";
import { rtdb } from "../../../../lib/firebase";
import { ref, onValue, off } from "firebase/database";

export function useRoomState(roomUrl: string) {
  const { instances, currentInstance, joinInstance, user, userReady } = useInstance();
  const [loading, setLoading] = useState(true);
  const [roomFound, setRoomFound] = useState(false);
  const [task, setTask] = useState("");
  const [inputLocked, setInputLocked] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [timerResetKey, setTimerResetKey] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [hasActiveTimer, setHasActiveTimer] = useState(false);
  const [currentTimerSeconds, setCurrentTimerSeconds] = useState(0);
  const [realTimeUserCount, setRealTimeUserCount] = useState(0);

  const timerStartRef = useRef<() => void>(null!);
  const timerPauseRef = useRef<() => void>(null!);
  const timerSecondsRef = useRef<number>(0);

  // Find room and join instance
  useEffect(() => {
    if (instances.length === 0) return;
    const targetRoom = instances.find((instance) => instance.url === roomUrl);
    if (targetRoom) {
      setRoomFound(true);
      if (!currentInstance || currentInstance.id !== targetRoom.id) {
        joinInstance(targetRoom.id);
      }
    } else {
      setRoomFound(false);
    }
    setLoading(false);
  }, [instances, roomUrl, currentInstance, joinInstance]);

  // Find taskId for current task
  useEffect(() => {
    if (!user?.id || !task.trim()) {
      setCurrentTaskId(null);
      return;
    }

    const tasksRef = ref(rtdb, `users/${user.id}/tasks`);
    const handle = onValue(tasksRef, (snapshot) => {
      const tasksData = snapshot.val();
      if (tasksData) {
        const taskId = Object.keys(tasksData).find((id) => {
          const taskItem = tasksData[id];
          return taskItem.text === task.trim() && !taskItem.completed;
        });
        setCurrentTaskId(taskId || null);
      } else {
        setCurrentTaskId(null);
      }
    });

    return () => off(tasksRef, "value", handle);
  }, [user?.id, task]);

  // Listen for timer state to determine if input should be locked
  useEffect(() => {
    if (!currentInstance || !user?.id) {
      setHasActiveTimer(false);
      setCurrentTimerSeconds(0);
      return;
    }

    const timerStateRef = ref(rtdb, `instances/${currentInstance.id}/userTimers/${user.id}`);
    const handle = onValue(timerStateRef, (snapshot) => {
      const timerState = snapshot.val();

      if (timerState) {
        let currentSeconds = 0;
        if (timerState.running && timerState.startTime) {
          const elapsedMs = Date.now() - timerState.startTime;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          currentSeconds = (timerState.baseSeconds || 0) + elapsedSeconds;
        } else {
          currentSeconds = timerState.totalSeconds || 0;
        }
        setHasActiveTimer(currentSeconds > 0);
        setCurrentTimerSeconds(currentSeconds);

        if (currentSeconds > 0 && timerState.task && !task.trim()) {
          setTask(timerState.task);
        }
      } else {
        setHasActiveTimer(false);
        setCurrentTimerSeconds(0);
      }
    });

    return () => off(timerStateRef, "value", handle);
  }, [currentInstance, user?.id, task]);

  // Update timer seconds in real-time when timer is running
  useEffect(() => {
    if (!currentInstance || !user?.id || !timerRunning) return;

    const interval = setInterval(() => {
      const timerStateRef = ref(rtdb, `instances/${currentInstance.id}/userTimers/${user.id}`);
      const unsubscribe = onValue(
        timerStateRef,
        (snapshot) => {
          const timerState = snapshot.val();
          if (timerState && timerState.running && timerState.startTime) {
            const elapsedMs = Date.now() - timerState.startTime;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            const currentSeconds = (timerState.baseSeconds || 0) + elapsedSeconds;
            setCurrentTimerSeconds(currentSeconds);
          }
        },
        { onlyOnce: true }
      );

      return () => unsubscribe();
    }, 1000);

    return () => clearInterval(interval);
  }, [currentInstance, user?.id, timerRunning]);

  // Listen to real-time user count
  useEffect(() => {
    if (!currentInstance) return;
    const usersRef = ref(rtdb, `instances/${currentInstance.id}/users`);
    const handle = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRealTimeUserCount(Object.keys(data).length);
      } else {
        setRealTimeUserCount(0);
      }
    });
    return () => off(usersRef, "value", handle);
  }, [currentInstance]);

  return {
    // Instance state
    instances,
    currentInstance,
    user,
    userReady,
    loading,
    roomFound,
    
    // Task state
    task,
    setTask,
    inputLocked,
    setInputLocked,
    hasStarted,
    setHasStarted,
    currentTaskId,
    
    // Timer state
    timerResetKey,
    setTimerResetKey,
    timerRunning,
    setTimerRunning,
    hasActiveTimer,
    currentTimerSeconds,
    timerStartRef,
    timerPauseRef,
    timerSecondsRef,
    
    // Room state
    realTimeUserCount,
  };
}