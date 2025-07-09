export function formatTime(totalSeconds: number): string {
  // Handle invalid input
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    return "0m";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  // Format based on duration length
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Get the "streak date" - which day a timestamp belongs to in the 4am UTC system
export function getStreakDate(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  const utcHour = date.getUTCHours();

  // If it's before 4am UTC, this counts as the previous day
  if (utcHour < 4) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  // Use UTC date for consistency across all users
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Calculate streak from daily completions using 4am UTC windows
export function calculateStreak(dailyCompletions: Record<string, boolean>): number {
  if (!dailyCompletions) return 0;

  let currentStreak = 0;
  const currentStreakDate = getStreakDate(); // Today's streak date in UTC

  // Start from current streak date and count backwards
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date();
    checkDate.setUTCDate(checkDate.getUTCDate() - i);

    // Adjust for 4am UTC boundary
    if (new Date().getUTCHours() < 4) {
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }

    const streakDateStr = checkDate.toISOString().split("T")[0];

    if (dailyCompletions[streakDateStr]) {
      currentStreak++;
    } else {
      // If we haven't reached today yet and there's no completion, break
      // But if it's today and no completion yet, that's ok for the streak
      if (streakDateStr !== currentStreakDate) {
        break;
      }
    }
  }

  return currentStreak;
}

// Calculate time remaining until 4am UTC tomorrow
export function calculateTimeRemaining(): string {
  const now = new Date();
  const tomorrow4amUTC = new Date();

  // Set to 4am UTC tomorrow
  if (now.getUTCHours() >= 4) {
    // After 4am UTC today, so 4am UTC tomorrow
    tomorrow4amUTC.setUTCDate(tomorrow4amUTC.getUTCDate() + 1);
  }
  // Before 4am UTC today, so 4am UTC today
  tomorrow4amUTC.setUTCHours(4, 0, 0, 0);

  const msRemaining = tomorrow4amUTC.getTime() - now.getTime();
  const hours = Math.floor(msRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}