import { useState, useEffect } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, set, onValue, off } from "firebase/database";

export function useVolumeControl(
  currentInstance: { id: string } | null,
  user: { id: string; displayName: string } | null,
  initialVolume: number,
  setLocalVolume: (volume: number) => void
) {
  const [previousVolume, setPreviousVolume] = useState(initialVolume > 0 ? initialVolume : 0.5);

  // Helper function to update volume in database
  const updateVolumeInDatabase = (volume: number, prevVolume: number) => {
    if (!currentInstance || !user?.id) return;
    const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
    set(userRef, { 
      id: user.id,
      displayName: user.displayName, 
      volume: volume, 
      previousVolume: prevVolume 
    });
  };

  // Load volume from RTDB on mount
  useEffect(() => {
    if (!currentInstance || !user?.id) return;
    const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
    const handle = onValue(userRef, (snap) => {
      const data = snap.val();
      if (data && typeof data.volume === "number" && data.volume !== initialVolume) {
        setLocalVolume(data.volume);
        if (typeof data.previousVolume !== "number" && data.volume > 0) {
          setPreviousVolume(data.volume);
        }
      }
      if (data && typeof data.previousVolume === "number") {
        setPreviousVolume(data.previousVolume);
      }
    });
    return () => off(userRef, "value", handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInstance?.id, user?.id]);

  const updateVolume = (newVolume: number) => {
    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
    setLocalVolume(newVolume);
    updateVolumeInDatabase(newVolume, newVolume > 0 ? newVolume : previousVolume);
  };

  const toggleMute = () => {
    if (initialVolume === 0) {
      setLocalVolume(previousVolume);
      updateVolumeInDatabase(previousVolume, previousVolume);
    } else {
      setLocalVolume(0);
      updateVolumeInDatabase(0, previousVolume);
    }
  };

  return {
    previousVolume,
    updateVolume,
    toggleMute,
  };
}