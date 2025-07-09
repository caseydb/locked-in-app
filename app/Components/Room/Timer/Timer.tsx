"use client";
import React, { useEffect } from "react";
import { useInstance } from "../../Instances";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import { useTimerState } from "./hooks/useTimerState";
import { useTimerAutoPause } from "./hooks/useTimerAutoPause";
import { useTaskIntegration } from "./hooks/useTaskIntegration";
import { useTimerEvents } from "./hooks/useTimerEvents";
import { formatTime } from "./utils";

export default function Timer({
  onActiveChange,
  disabled,
  startRef,
  pauseRef,
  onComplete,
  secondsRef,
  requiredTask = true,
  task,
}: {
  onActiveChange?: (isActive: boolean) => void;
  disabled?: boolean;
  startRef?: React.RefObject<() => void>;
  pauseRef?: React.RefObject<() => void>;
  onComplete?: (duration: string) => void;
  secondsRef?: React.RefObject<number>;
  requiredTask?: boolean;
  task?: string;
}) {
  const { currentInstance, user } = useInstance();
  
  // Custom hooks
  const { seconds, running, setRunning, saveTimerState, clearTimerState } = useTimerState(
    currentInstance,
    user?.id,
    task
  );
  
  const { moveTaskToTop, completeTaskInList } = useTaskIntegration(user?.id);
  const { notifyEvent } = useTimerEvents(currentInstance, user?.displayName);

  // Auto-pause functionality
  useTimerAutoPause(currentInstance, user?.id, running, seconds, task, saveTimerState);

  // Notify parent of running state
  useEffect(() => {
    if (onActiveChange) onActiveChange(running);
  }, [running, onActiveChange]);

  async function handleStart() {
    // Move task to position #1 in task list BEFORE starting timer
    if (task && task.trim() && user?.id) {
      await moveTaskToTop(task.trim());
      // Small delay to ensure TaskList component receives the update
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setRunning(true);
    saveTimerState(true, seconds); // Save start state to Firebase
    notifyEvent("start");
  }

  function handleStop() {
    setRunning(false);
    saveTimerState(false, seconds); // Save paused state to Firebase
  }

  function handleComplete() {
    const completionTime = formatTime(seconds);

    // Mark matching task as completed in task list
    if (task && task.trim()) {
      completeTaskInList(task.trim());
    }

    // Mark today as completed for streak tracking
    if (typeof window !== "undefined") {
      const windowWithStreak = window as Window & { markStreakComplete?: () => Promise<void> };
      if (windowWithStreak.markStreakComplete) {
        windowWithStreak.markStreakComplete();
      }
    }

    clearTimerState(); // Clear Firebase state when completing - this will trigger the listener to reset local state
    notifyEvent("complete");
    if (onComplete) {
      onComplete(completionTime);
    }
  }

  // Expose handleStart to parent via ref
  React.useEffect(() => {
    if (startRef) {
      startRef.current = handleStart;
    }
  });

  // Expose handleStop to parent via pauseRef
  React.useEffect(() => {
    if (pauseRef) {
      pauseRef.current = handleStop;
    }
  });

  // Update secondsRef with the current seconds value
  React.useEffect(() => {
    if (secondsRef) secondsRef.current = seconds;
  }, [seconds, secondsRef]);

  return (
    <div className="flex flex-col items-center gap-4 px-4 sm:px-0">
      <TimerDisplay seconds={seconds} />
      <TimerControls
        running={running}
        seconds={seconds}
        disabled={disabled}
        requiredTask={requiredTask}
        onStart={handleStart}
        onStop={handleStop}
        onComplete={handleComplete}
      />
    </div>
  );
}