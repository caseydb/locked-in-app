import React, { forwardRef } from "react";
import { useInstance } from "../../Instances";
import { auth } from "@/lib/firebase";

interface ControlsDropdownProps {
  isOpen: boolean;
  localVolume: number;
  onVolumeChange: (volume: number) => void;
  instanceType: "public" | "private";
  showHistory: boolean;
  onShowHistory: () => void;
  onShowHistoryTooltip: (show: boolean) => void;
  onShowInviteModal: () => void;
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
    onShowRoomsModal,
    onShowNameModal,
    onLeaveRoom,
    onSignOut,
  }, ref) => {
    const { user } = useInstance();
    
    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className="absolute right-0 mt-2 bg-[#181A1B] text-gray-400 rounded-2xl shadow-2xl py-6 px-4 min-w-[320px] border border-[#23272b] z-50 hidden sm:block"
      >
        {/* User Header */}
        <div className="flex items-center mb-6 pb-4 border-b border-[#23272b]">
          <div className="w-12 h-12 bg-[#FFAA00] rounded-full flex items-center justify-center text-black font-bold">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <h3 className="font-semibold text-white font-mono">{user.displayName}</h3>
            <p className="text-sm text-gray-400 font-mono">{auth.currentUser?.email || ""}</p>
          </div>
        </div>

        {/* Sound Controls Section */}
        <div className="mb-6 pb-4 border-b border-[#23272b]">
          <h4 className="font-semibold text-gray-400 mb-3 font-mono">Sound</h4>
          <div className="relative flex items-center w-full h-8">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-gray-400 pointer-events-none">
              {localVolume === 0 ? (
                // Muted speaker icon
                <svg width="18" height="18" viewBox="0 0 28 24" fill="none">
                  <g>
                    <rect x="2" y="8" width="5" height="8" rx="1" fill="#9ca3af" />
                    <polygon points="7,8 14,3 14,21 7,16" fill="#9ca3af" />
                    <path
                      d="M17 8c1.333 1.333 1.333 6.667 0 8"
                      stroke="#9ca3af"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M20.5 6c2.5 2.667 2.5 10.667 0 13.334"
                      stroke="#9ca3af"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M24 3.5c3.5 4 3.5 13 0 17"
                      stroke="#9ca3af"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <line x1="9" y1="6" x2="26" y2="21.5" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                    <line x1="9" y1="6" x2="26" y2="21.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </svg>
              ) : (
                // Unmuted speaker icon
                <svg width="18" height="18" viewBox="0 0 28 24" fill="none">
                  <g>
                    <rect x="2" y="8" width="5" height="8" rx="1" fill="#9ca3af" />
                    <polygon points="7,8 14,3 14,21 7,16" fill="#9ca3af" />
                    <path
                      d="M17 8c1.333 1.333 1.333 6.667 0 8"
                      stroke="#9ca3af"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M20.5 6c2.5 2.667 2.5 10.667 0 13.334"
                      stroke="#9ca3af"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M24 3.5c3.5 4 3.5 13 0 17"
                      stroke="#9ca3af"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
              )}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={localVolume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full h-6 rounded-full appearance-none outline-none ml-6 slider-thumb-custom"
              style={{
                background: (() => {
                  const offset = (24 / 320) * 100;
                  const edge = localVolume * (100 - offset) + offset / 2;
                  return `linear-gradient(to right, #fff 0%, #fff ${edge}%, #9ca3af ${edge}%, #9ca3af 100%)`;
                })(),
                borderRadius: "9999px",
                boxShadow: "0 0 0 1px #23272b",
                height: "1.5rem",
              }}
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {/* View Rooms Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={onShowRoomsModal}
          >
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">View Rooms</span>
          </button>

          {/* Invite Others Button */}
          <button
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#23272b] transition-colors flex items-center group"
            onClick={onShowInviteModal}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
              <path
                d="M12 5v14M5 12h14"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                className="group-hover:stroke-[#FFAA00]"
              />
            </svg>
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Invite Others</span>
          </button>

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
            <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">
              {showHistory ? "Timer" : "History"}
            </span>
          </button>

          {/* Edit Display Name Button */}
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