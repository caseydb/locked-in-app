"use client";
import React from "react";
import { useInstance } from "../../Instances";
import StreakCountdown from "./StreakCountdown";
import StatsDisplay from "./StatsDisplay";
import { useStreakData } from "./hooks/useStreakData";
import { useTaskStats } from "./hooks/useTaskStats";
import { useCountdownTimer } from "./hooks/useCountdownTimer";

export default function PersonalStats() {
  const { user } = useInstance();
  
  // Custom hooks
  const { streak, hasCompletedToday } = useStreakData(user?.id);
  const { tasksCompleted, totalSeconds, loading } = useTaskStats(user?.id);
  const { timeRemaining } = useCountdownTimer();

  if (loading || !user) return null;

  // Show countdown if they haven't completed today's task
  if (!hasCompletedToday) {
    return (
      <div className="hidden sm:block">
        <StreakCountdown
          streak={streak}
          timeRemaining={timeRemaining}
        />
      </div>
    );
  }

  // Show normal stats if they've completed today's task
  return (
    <div className="hidden sm:block">
      <StatsDisplay
        streak={streak}
        tasksCompleted={tasksCompleted}
        totalSeconds={totalSeconds}
        timeRemaining={timeRemaining}
      />
    </div>
  );
}