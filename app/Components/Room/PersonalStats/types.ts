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
  isPremium: boolean;
}

export interface InstanceData {
  history?: Record<string, HistoryEntry>;
  users?: Record<string, User>;
}

export interface CompletedTask {
  task: string;
  duration: string;
  timestamp: number;
  seconds: number;
  roomId: string;
}