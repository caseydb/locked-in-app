// Helper to format time as mm:ss or hh:mm:ss based on duration
export function formatTime(s: number): string {
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
}