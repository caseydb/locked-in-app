import { useState, useEffect } from "react";
import { rtdb } from "../../../../lib/firebase";
import { ref, onValue, off } from "firebase/database";

export type FlyingMessage = {
  id: string;
  text: string;
  color: string;
  userId?: string;
  timestamp: number;
};

export function useFlyingMessages(currentInstance: any) {
  const [flyingMessages, setFlyingMessages] = useState<FlyingMessage[]>([]);

  // Listen for flying messages from Firebase
  useEffect(() => {
    if (!currentInstance) return;

    const flyingMessagesRef = ref(rtdb, `instances/${currentInstance.id}/flyingMessages`);
    const handle = onValue(flyingMessagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Firebase object to array and sort by timestamp
        const messages = Object.entries(data).map(([id, msg]) => {
          const typedMsg = msg as { text: string; color: string; userId: string; timestamp: number };
          return {
            id,
            text: typedMsg.text,
            color: typedMsg.color,
            userId: typedMsg.userId,
            timestamp: typedMsg.timestamp,
          };
        });

        // Filter out messages older than 7 seconds
        const now = Date.now();
        const recentMessages = messages.filter((msg) => now - msg.timestamp < 7000);

        setFlyingMessages(recentMessages);
      } else {
        setFlyingMessages([]);
      }
    });

    return () => off(flyingMessagesRef, "value", handle);
  }, [currentInstance]);

  return {
    flyingMessages,
  };
}