export interface HistoryEntry {
  displayName: string;
  task: string;
  duration: string | number; // Can be number (legacy) or string (new format)
  timestamp: number;
  userId?: string;
}

export interface User {
  id: string;
  displayName: string;
}