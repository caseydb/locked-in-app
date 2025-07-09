import React from "react";

interface StreakCountdownProps {
  streak: number;
  timeRemaining: string;
}

export default function StreakCountdown({ streak, timeRemaining }: StreakCountdownProps) {
  const streakStyle = {
    bg: "bg-gradient-to-br from-[#ffaa00] to-[#e69500]",
  };

  return (
    <div className="fixed bottom-4 left-0 right-0 sm:top-[13px] sm:right-36 sm:bottom-auto sm:left-auto z-40 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-gray-900/45 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gray-800/30 shadow-sm mx-auto sm:mx-0 w-fit">
        <div className="flex items-center justify-center gap-2">
          <div className={`w-5 h-5 ${streakStyle.bg} rounded-full flex items-center justify-center animate-pulse`}>
            <span className="text-black text-xs font-bold">{streak}</span>
          </div>
          <span className="text-gray-400 text-xs sm:text-base font-mono">
            <span className="text-gray-400">day streak</span> |{" "}
            <span className="text-gray-300 font-medium">{timeRemaining}</span> to{" "}
            {streak === 0 ? "start streak!" : "maintain streak!"}
          </span>
        </div>
      </div>
    </div>
  );
}