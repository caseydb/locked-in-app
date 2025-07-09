import { useState, useEffect, useCallback } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, onValue, off, set, get } from "firebase/database";
import { calculateStreak, getStreakDate } from "../utils";

export function useStreakData(userId: string | undefined) {
  const [streak, setStreak] = useState(0);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  // Function to mark today as completed (called when a task is completed)
  const markTodayComplete = useCallback(async () => {
    if (!userId) return;

    const currentStreakDate = getStreakDate(); // Use 4am UTC window
    const dailyCompletionRef = ref(rtdb, `users/${userId}/dailyCompletions/${currentStreakDate}`);

    // Check if already marked for this streak day
    const snapshot = await get(dailyCompletionRef);
    if (!snapshot.exists()) {
      await set(dailyCompletionRef, true);
    }
  }, [userId]);

  // Load and track daily completions for streak
  useEffect(() => {
    if (!userId) {
      return;
    }

    const dailyCompletionsRef = ref(rtdb, `users/${userId}/dailyCompletions`);
    const handle = onValue(dailyCompletionsRef, (snapshot) => {
      const dailyCompletions = snapshot.val() || {};
      const currentStreak = calculateStreak(dailyCompletions);
      setStreak(currentStreak);

      // Check if completed today
      const todayStreakDate = getStreakDate();
      setHasCompletedToday(!!dailyCompletions[todayStreakDate]);
    });

    return () => {
      off(dailyCompletionsRef, "value", handle);
    };
  }, [userId]);

  // Expose the markTodayComplete function globally so other components can call it
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as Window & { markStreakComplete?: () => Promise<void> }).markStreakComplete = markTodayComplete;
    }
  }, [userId, markTodayComplete]);

  return {
    streak,
    hasCompletedToday,
    markTodayComplete,
  };
}