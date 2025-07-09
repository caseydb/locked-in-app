import React from "react";

interface HistoryTooltipProps {
  isVisible: boolean;
}

export default function HistoryTooltip({ isVisible }: HistoryTooltipProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-8 z-50 bg-[#181A1B] text-white px-4 py-2 rounded-lg shadow-lg border border-[#23272b] text-sm font-mono">
      History is only available in private rooms.
      <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#181A1B] border-r border-b border-[#23272b] transform rotate-45"></div>
    </div>
  );
}