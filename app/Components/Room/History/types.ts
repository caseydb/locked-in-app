export interface HistoryEntry {
  displayName: string;
  task: string;
  duration: string;
  timestamp: number;
  userId?: string;
}

export interface User {
  id: string;
  displayName: string;
}