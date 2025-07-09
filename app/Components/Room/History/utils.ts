import { HistoryEntry } from "./types";

export function formatDuration(duration: string): string {
  // Parse the duration string (could be HH:MM:SS or MM:SS)
  const parts = duration.split(":").map(Number);

  if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  } else if (parts.length === 2) {
    // MM:SS format - check if minutes >= 60
    const [minutes, seconds] = parts;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}:${remainingMinutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  // Fallback - return as is
  return duration;
}

// Truncate text to specified length
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Calculate dynamic width based on history content
export function calculateDynamicWidth(history: HistoryEntry[]): string {
  if (history.length === 0) return "w-[95%] min-[600px]:w-[90%] min-[1028px]:w-[60%]";

  const maxTaskLength = Math.max(...history.map((entry) => entry.task.length));

  // Base percentages for different screen sizes
  const basePercentage = 95; // < 600px
  const mediumPercentage = 90; // 600px - 1028px
  const largePercentage = 60; // >= 1028px

  // Calculate multiplier based on max task length - grow more aggressively
  let multiplier = 1;
  if (maxTaskLength > 20) {
    multiplier = Math.min(1 + (maxTaskLength - 20) / 100, 1.4); // More conservative growth for percentages
  }

  const smallWidth = Math.min(Math.round(basePercentage * multiplier), 95); // Cap at 95%
  const mediumWidth = Math.min(Math.round(mediumPercentage * multiplier), 90); // Cap at 90%
  const largeWidth = Math.min(Math.round(largePercentage * multiplier), 85); // Cap at 85%

  return `w-[${smallWidth}%] min-[600px]:w-[${mediumWidth}%] min-[1028px]:w-[${largeWidth}%]`;
}

// Calculate PAGE_SIZE based on screen size
export function calculatePageSize(width: number, height: number): number {
  // If width >= 1024px (desktop table layout), use height-based logic for large screens
  if (width >= 1024) {
    if (height >= 850) return 15;
    if (height >= 800) return 13;
    if (height >= 750) return 10;
    if (height >= 700) return 7;
    if (height >= 650) return 5;
    if (height <= 650) return 3;
    return 5; // Default for large screens
  }

  // Otherwise use height-based logic for card layout
  if (height >= 1100) return 10;
  if (height >= 1000) return 9;
  if (height >= 910) return 8;
  if (height >= 820) return 7;
  if (height >= 730) return 6;
  if (height >= 650) return 5;
  if (height >= 550) return 4;
  return 3; // Default for small heights
}