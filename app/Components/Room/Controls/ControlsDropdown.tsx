import React, { forwardRef } from "react";

interface ControlsDropdownProps {
  isOpen: boolean;
  localVolume: number;
  onVolumeChange: (volume: number) => void;
  instanceType: "public" | "private";
  showHistory: boolean;
  onShowHistory: () => void;
  onShowHistoryTooltip: (show: boolean) => void;
  onShowInviteModal: () => void;
  onShowTaskList: () => void;
  onShowLeaderboard: () => void;
  onShowRoomsModal: () => void;
  onShowNameModal: () => void;
  onLeaveRoom: () => void;
  onSignOut: () => void;
}

const ControlsDropdown = forwardRef<HTMLDivElement, ControlsDropdownProps>(
  ({
    isOpen,
    localVolume,
    onVolumeChange,
    instanceType,
    showHistory,
    onShowHistory,
    onShowHistoryTooltip,
    onShowInviteModal,
    onShowTaskList,
    onShowLeaderboard,
    onShowRoomsModal,
    onShowNameModal,
    onLeaveRoom,
    onSignOut,
  }, ref) => {
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className="absolute top-full right-0 mt-2 w-80 bg-[#181A1B] rounded-2xl shadow-2xl border border-[#23272b] z-50"
      >
        <div className="p-4 space-y-3">
          {/* Volume Slider */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-400 text-sm font-mono w-12">Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localVolume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-gray-400 text-sm font-mono w-10 text-right">
              {Math.round(localVolume * 100)}%
            </span>
          </div>

          {/* History Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={() => {
              if (instanceType === "public") {
                onShowHistoryTooltip(true);
                setTimeout(() => onShowHistoryTooltip(false), 3000);
              } else {
                onShowHistory();
              }
            }}
          >
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">History</span>
          </button>

          {/* Invite Button - Only for private rooms */}
          {instanceType === "private" && (
            <button
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
              onClick={onShowInviteModal}
            >
              <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Invite</span>
            </button>
          )}

          {/* Tasks Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={onShowTaskList}
          >
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Tasks</span>
          </button>

          {/* Leaderboard Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={onShowLeaderboard}
          >
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Leaderboard</span>
          </button>

          {/* Rooms Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={onShowRoomsModal}
          >
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Rooms</span>
          </button>

          {/* Edit Name Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={onShowNameModal}
          >
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Edit Display Name</span>
          </button>

          {/* Leave Room Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={onLeaveRoom}
          >
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Leave Room</span>
          </button>

          {/* Sign Out Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={onSignOut}
          >
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Sign Out</span>
          </button>
        </div>
      </div>
    );
  }
);

ControlsDropdown.displayName = "ControlsDropdown";

export default ControlsDropdown;