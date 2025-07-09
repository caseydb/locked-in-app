import { useState, useEffect } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, onValue, off } from "firebase/database";
import { HistoryEntry, User } from "../types";

export function useHistoryData(roomId: string) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  // Load users data
  useEffect(() => {
    if (!roomId) return;
    const usersRef = ref(rtdb, `instances/${roomId}/users`);
    const handle = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(data);
      } else {
        setUsers({});
      }
    });
    return () => off(usersRef, "value", handle);
  }, [roomId]);

  // Load history data
  useEffect(() => {
    if (!roomId) return;
    const historyRef = ref(rtdb, `instances/${roomId}/history`);
    const handle = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert to array and sort by timestamp desc
        const arr = Object.values(data) as HistoryEntry[];
        arr.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(arr);
      } else {
        setHistory([]);
      }
      setLoading(false);
    });
    return () => off(historyRef, "value", handle);
  }, [roomId]);

  return {
    history,
    users,
    loading,
  };
}