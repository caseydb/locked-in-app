import { useState, useEffect } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, set, onValue, off } from "firebase/database";

export function useVolumeControl(
  currentInstance: any,
  user: any,
  initialVolume: number,
  setLocalVolume: (volume: number) => void
) {
  const [previousVolume, setPreviousVolume] = useState(initialVolume > 0 ? initialVolume : 0.5);

  // Sync volume to RTDB when it changes
  useEffect(() => {
    if (!currentInstance || !user?.id) return;
    const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
    set(userRef, { ...user, displayName: user.displayName, volume: initialVolume, previousVolume });
  }, [initialVolume, previousVolume, currentInstance, user]);

  // Load volume from RTDB on mount
  useEffect(() => {
    if (!currentInstance || !user?.id) return;
    const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
    const handle = onValue(userRef, (snap) => {
      const data = snap.val();
      if (data && typeof data.volume === "number") {
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
  }, [currentInstance, user, setLocalVolume]);

  const updateVolume = (newVolume: number) => {
    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
    setLocalVolume(newVolume);
  };

  const toggleMute = () => {
    if (initialVolume === 0) {
      setLocalVolume(previousVolume);
    } else {
      setLocalVolume(0);
    }
  };

  return {
    previousVolume,
    updateVolume,
    toggleMute,
  };
}