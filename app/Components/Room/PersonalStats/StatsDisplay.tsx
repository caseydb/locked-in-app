import React, { useState } from "react";
import { formatTime } from "./utils";

interface StatsDisplayProps {
  streak: number;
  tasksCompleted: number;
  totalSeconds: number;
  timeRemaining: string;
}

export default function StatsDisplay({ streak, tasksCompleted, totalSeconds, timeRemaining }: StatsDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const streakStyle = {
    bg: "bg-gradient-to-br from-[#ffaa00] to-[#e69500]",
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 sm:top-[13px] sm:right-36 sm:bottom-auto sm:left-auto z-40 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="relative">
        <div
          className="bg-gray-900/45 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gray-800/30 shadow-sm mx-auto sm:mx-0 w-fit cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-5 h-5 ${streakStyle.bg} rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110`}
            >
              <span className="text-black text-xs font-bold">{streak}</span>
            </div>
            <span className="text-gray-400 text-xs sm:text-base font-mono">
              <span className="text-gray-400">day streak</span> |{" "}
              <span className="text-gray-300 font-medium">{tasksCompleted}</span> tasks |{" "}
              <span className="text-gray-300 font-medium">{formatTime(totalSeconds)}</span> today
            </span>
          </div>
        </div>
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 sm:bottom-auto sm:top-full sm:mt-2">
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700 shadow-lg">
              <div className="text-gray-300 text-xs font-mono whitespace-nowrap">
                New streak period in: <span className="text-gray-100 font-medium">{timeRemaining} (UTC)</span>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 sm:bottom-full sm:top-auto border-4 border-transparent border-t-gray-700 sm:border-t-transparent sm:border-b-gray-700"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}