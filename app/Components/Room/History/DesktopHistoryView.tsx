import React from "react";
import { HistoryEntry, User } from "./types";
import { formatDuration, truncateText } from "./utils";

interface DesktopHistoryViewProps {
  entries: HistoryEntry[];
  users: Record<string, User>;
}

export default function DesktopHistoryView({ entries, users }: DesktopHistoryViewProps) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-0 min-w-[600px]">
        <thead>
          <tr className="text-gray-400 text-base">
            <th className="px-2 py-1 w-48">Name</th>
            <th className="px-2 py-1">Task</th>
            <th className="pl-8 pr-2 py-1 w-32">Time</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i} className="group">
              <td
                className={`px-2 py-1 font-mono whitespace-nowrap text-base w-48 ${
                  entry.task.toLowerCase().includes("quit") ? "text-red-500" : "text-white"
                }`}
                title={entry.displayName}
              >
                {entry.userId && users[entry.userId]?.displayName
                  ? users[entry.userId].displayName
                  : entry.displayName}
              </td>
              <td
                className={`px-2 py-1 font-mono text-base ${
                  entry.task.toLowerCase().includes("quit") ? "text-red-500" : "text-white"
                }`}
                title={entry.task}
              >
                <span className="group-hover:hidden min-[600px]:hidden">{truncateText(entry.task, 35)}</span>
                <span className="hidden min-[600px]:block group-hover:hidden">{entry.task}</span>
                <span className="hidden group-hover:block whitespace-normal break-words">{entry.task}</span>
              </td>
              <td
                className={`pl-8 pr-2 py-1 font-mono whitespace-nowrap text-base w-32 ${
                  entry.task.toLowerCase().includes("quit") ? "text-red-500" : "text-green-400"
                }`}
              >
                {formatDuration(entry.duration as string | number)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}