import { useState, useEffect } from "react";
import { calculateTimeRemaining } from "../utils";

export function useCountdownTimer() {
  const [timeRemaining, setTimeRemaining] = useState("");

  // Update countdown timer every second
  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining());
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return {
    timeRemaining,
  };
}