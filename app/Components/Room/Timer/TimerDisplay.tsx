import React from "react";
import { formatTime } from "./utils";

interface TimerDisplayProps {
  seconds: number;
}

export default function TimerDisplay({ seconds }: TimerDisplayProps) {
  return (
    <div className="text-3xl sm:text-4xl mb-2 font-mono">
      {formatTime(seconds)}
    </div>
  );
}