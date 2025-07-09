import React from "react";

interface MobileSideModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { displayName: string; id: string };
  localVolume: number;
  onVolumeChange: (volume: number) => void;
  instanceType: "public" | "private";
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

export default function MobileSideModal({
  isOpen,
  onClose,
  user,
  localVolume,
  onVolumeChange,
  instanceType,
  onShowHistory,
  onShowHistoryTooltip,
  onShowInviteModal,
  onShowTaskList,
  onShowLeaderboard,
  onShowRoomsModal,
  onShowNameModal,
  onLeaveRoom,
  onSignOut,
}: MobileSideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80" onClick={onClose}>
      <div
        className="fixed top-0 right-0 h-full w-80 bg-[#181A1B] shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-[#23272b]"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#23272b]">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl"
            onClick={onClose}
          >
            ×
          </button>
          <div className="flex items-center mt-8">
            <div className="w-12 h-12 bg-[#FFAA00] rounded-full flex items-center justify-center text-black font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-white font-semibold">{user.displayName}</p>
              <p className="text-gray-400 text-sm">{instanceType} room</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Volume Slider */}
          <div className="space-y-2">
            <label className="text-gray-400 text-sm font-mono block">Volume</label>
            <div className="flex items-center space-x-3">
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
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
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
                onClose();
              }}
            >
              <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">History</span>
            </button>

            {/* Invite Button - Only for private rooms */}
            {instanceType === "private" && (
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
                onClick={() => {
                  onShowInviteModal();
                  onClose();
                }}
              >
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Invite</span>
              </button>
            )}

            {/* Tasks Button */}
            <button
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
              onClick={() => {
                onShowTaskList();
                onClose();
              }}
            >
              <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Tasks</span>
            </button>

            {/* Leaderboard Button */}
            <button
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
              onClick={() => {
                onShowLeaderboard();
                onClose();
              }}
            >
              <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Leaderboard</span>
            </button>

            {/* Rooms Button */}
            <button
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
              onClick={() => {
                onShowRoomsModal();
                onClose();
              }}
            >
              <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Rooms</span>
            </button>

            {/* Edit Name Button */}
            <button
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
              onClick={() => {
                onShowNameModal();
                onClose();
              }}
            >
              <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Edit Display Name</span>
            </button>

            {/* Leave Room Button */}
            <button
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
              onClick={() => {
                onLeaveRoom();
                onClose();
              }}
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
      </div>
    </div>
  );
}