import React from "react";

interface TaskHeaderProps {
  incompleteTasks: number;
  isWide: boolean;
  onToggleWidth: () => void;
  onClose: () => void;
  onShowClearMenu: () => void;
  showClearMenu: boolean;
  onClearAll: () => void;
}

export default function TaskHeader({
  incompleteTasks,
  isWide,
  onToggleWidth,
  onClose,
  onShowClearMenu,
  showClearMenu,
  onClearAll,
}: TaskHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">Tasks</h2>
        <div className="bg-[#FFAA00] text-black px-2 py-1 rounded text-xs font-bold">
          {incompleteTasks}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Width Toggle Button */}
        <button
          onClick={onToggleWidth}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title={isWide ? "Narrow view" : "Wide view"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d={isWide ? "M8 18L12 6L16 18" : "M7 8L3 12L7 16M17 8L21 12L17 16M14 4L10 20"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Clear Menu */}
        <div className="relative">
          <button
            onClick={onShowClearMenu}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Clear tasks"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {showClearMenu && (
            <div className="clear-menu absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1 z-10">
              <button
                onClick={onClearAll}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 transition-colors text-sm"
              >
                Clear All Tasks
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}