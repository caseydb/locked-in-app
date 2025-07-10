import React from "react";
import { HistoryEntry, User } from "./types";
import { formatDuration, truncateText } from "./utils";

interface MobileHistoryViewProps {
  entries: HistoryEntry[];
  users: Record<string, User>;
}

export default function MobileHistoryView({ entries, users }: MobileHistoryViewProps) {
  return (
    <div className="block lg:hidden space-y-3 w-full">
      {entries.map((entry, i) => (
        <div
          key={i}
          className="bg-[#181A1B] rounded-lg px-4 py-1 border border-[#23272b] w-full min-w-[300px] min-[500px]:min-w-[400px] sm:min-w-[500px] min-[769px]:min-w-[600px] group"
        >
          <div className="flex justify-between items-center mb-0.5 gap-3">
            <div
              className={`font-mono text-base font-medium flex-1 ${
                entry.task.toLowerCase().includes("quit") ? "text-red-500" : "text-white"
              }`}
              title={entry.displayName}
            >
              {entry.userId && users[entry.userId]?.displayName
                ? users[entry.userId].displayName
                : entry.displayName}
            </div>
            <div
              className={`font-mono text-base font-medium flex-shrink-0 ${
                entry.task.toLowerCase().includes("quit") ? "text-red-500" : "text-green-400"
              }`}
            >
              {formatDuration(entry.duration as string | number)}
            </div>
          </div>
          <div
            className={`font-mono text-base leading-snug ${
              entry.task.toLowerCase().includes("quit") ? "text-red-500" : "text-gray-300"
            }`}
          >
            <span className="group-hover:hidden min-[600px]:hidden">{truncateText(entry.task, 35)}</span>
            <span className="hidden min-[600px]:block group-hover:hidden">{entry.task}</span>
            <span className="hidden group-hover:block whitespace-normal break-words">{entry.task}</span>
          </div>
        </div>
      ))}
    </div>
  );
}