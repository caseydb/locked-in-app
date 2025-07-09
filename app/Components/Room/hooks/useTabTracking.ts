import { useEffect, useRef } from "react";
import { rtdb } from "../../../../lib/firebase";
import { ref, remove, runTransaction } from "firebase/database";

export function useTabTracking(currentInstance: { id: string } | null, user: { id: string; displayName: string } | null) {
  const userTabCountRef = useRef(0);

  // Track user tab count to handle multi-tab scenarios
  useEffect(() => {
    if (!currentInstance || !user) return;

    const tabCountRef = ref(rtdb, `instances/${currentInstance.id}/tabCounts/${user.id}`);

    // Increment tab count when this tab opens/joins room
    runTransaction(tabCountRef, (currentData) => {
      const currentCount = currentData?.count || 0;
      const newCount = currentCount + 1;
      return {
        count: newCount,
        displayName: user.displayName,
        lastUpdated: Date.now(),
      };
    });


    // Add beforeunload listener to track page navigation/refresh
    const handleBeforeUnload = () => {
      runTransaction(tabCountRef, (currentData) => {
        const currentCount = currentData?.count || 0;
        const newCount = Math.max(0, currentCount - 1);

        if (newCount === 0) {
          const activeRef = ref(rtdb, `instances/${currentInstance.id}/activeUsers/${user.id}`);
          const usersRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
          remove(activeRef);
          remove(usersRef);
          return null;
        } else {
          return {
            count: newCount,
            displayName: user.displayName,
            lastUpdated: Date.now(),
          };
        }
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Fallback cleanup when component unmounts
      const currentTabCount = userTabCountRef.current;
      if (currentTabCount > 0) {
        runTransaction(tabCountRef, (currentData) => {
          const currentCount = currentData?.count || 0;
          const newCount = Math.max(0, currentCount - 1);

          if (newCount === 0) {
            const activeRef = ref(rtdb, `instances/${currentInstance.id}/activeUsers/${user.id}`);
            const usersRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
            remove(activeRef);
            remove(usersRef);
            return null;
          } else {
            return {
              count: newCount,
              displayName: user.displayName,
              lastUpdated: Date.now(),
            };
          }
        });
      }

      // Note: unsubscribe was removed as it's not defined in this scope
    };
  }, [currentInstance, user]);

  return {
    userTabCountRef,
  };
}