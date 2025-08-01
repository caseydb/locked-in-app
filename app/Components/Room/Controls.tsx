import React, { useState, useRef, useEffect } from "react";
import { useInstance } from "../Instances";
// TODO: Remove firebase imports when replacing with proper persistence
// import { rtdb } from "../../../lib/firebase";
// import { ref, set, onValue, off } from "firebase/database";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { updatePreferences, setPreference } from "../../store/preferenceSlice";

interface ControlsProps {
  className?: string;
  localVolume: number;
  setLocalVolume: (v: number) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showHistoryTooltip: boolean;
  setShowHistoryTooltip: (show: boolean) => void;
  instanceType: "public" | "private";
  setShowInviteModal: (show: boolean) => void;
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  setShowRoomsModal: (show: boolean) => void;
  setShowPreferences: (show: boolean) => void;
  showAnalytics: boolean;
  setShowAnalytics: (show: boolean) => void;
  closeAllModals: () => void;
  isPomodoroMode: boolean;
  showTimerDropdown: boolean;
  setShowTimerDropdown: (show: boolean) => void;
  timerDropdownRef: React.RefObject<HTMLDivElement | null>;
}

export default function Controls({
  className = "",
  localVolume,
  setLocalVolume,
  showHistory,
  setShowHistory,
  showHistoryTooltip,
  setShowHistoryTooltip,
  instanceType,
  setShowInviteModal,
  showLeaderboard,
  setShowLeaderboard,
  setShowRoomsModal,
  setShowPreferences,
  showAnalytics,
  setShowAnalytics,
  closeAllModals,
  isPomodoroMode,
  showTimerDropdown,
  setShowTimerDropdown,
  timerDropdownRef,
}: ControlsProps) {
  const { user, currentInstance, leaveInstance } = useInstance();
  const [editedName, setEditedName] = useState(user.displayName);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showSideModal, setShowSideModal] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(localVolume > 0 ? localVolume : 0.5);
  const soundIconRef = useRef<HTMLSpanElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownIconRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();

  // Get user data from Redux store
  const reduxUser = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch<AppDispatch>();

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const isInDropdownMenu = dropdownRef.current && dropdownRef.current.contains(target);
      const isInDropdownIcon = dropdownIconRef.current && dropdownIconRef.current.contains(target);
      // Only close if click is outside dropdown menu and icon
      if (!isInDropdownMenu && !isInDropdownIcon) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // TODO: Replace with Firebase RTDB sync for volume
  // Sync volume to RTDB when it changes
  useEffect(() => {
    if (!currentInstance || !user?.id) return;
    // const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
    // set(userRef, { ...user, displayName: user.displayName, volume: localVolume, previousVolume });

    // Volume state is managed locally
  }, [localVolume, previousVolume, currentInstance, user]);

  // TODO: Replace with Firebase RTDB listener for volume
  // On mount, load volume from RTDB if present
  useEffect(() => {
    if (!currentInstance || !user?.id) return;
    // const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
    // const handle = onValue(userRef, (snap) => {
    //   const data = snap.val();
    //   if (data && typeof data.volume === "number") {
    //     setLocalVolume(data.volume);
    //     // If no previousVolume saved and current volume > 0, use current as previous
    //     if (typeof data.previousVolume !== "number" && data.volume > 0) {
    //       setPreviousVolume(data.volume);
    //     }
    //   }
    //   if (data && typeof data.previousVolume === "number") {
    //     setPreviousVolume(data.previousVolume);
    //   }
    // });
    // return () => {
    //   off(userRef, "value", handle);
    // };

    // Temporary: Use default volume
    // Volume will reset on refresh
  }, [currentInstance, user, setLocalVolume]);

  // Helper function to update volume and track previous volume
  const updateVolume = (newVolume: number) => {
    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
    setLocalVolume(newVolume);
  };

  return (
    <div className={className + " select-none relative"}>
      <div className="flex items-center">
        {/* Beautiful Timer Mode Dropdown - first */}
        <div className="relative mr-3" ref={timerDropdownRef}>
          <button
            onClick={() => setShowTimerDropdown(!showTimerDropdown)}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
              showTimerDropdown ? 'border border-gray-700' : 'border border-transparent hover:border-[#FFAA00]/50'
            }`}
          >
            {/* Label */}
            <span className="text-base font-mono text-gray-400">{isPomodoroMode ? "Pomodoro" : "Deep Work"}</span>
            {/* Dropdown arrow */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                showTimerDropdown ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showTimerDropdown && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="p-1">
                {/* Timer Option */}
                <button
                  onClick={() => {
                    setShowTimerDropdown(false);
                    // Optimistic update first
                    dispatch(setPreference({ key: "mode", value: "stopwatch" }));
                    // Then update preference in database
                    if (reduxUser.user_id) {
                      dispatch(updatePreferences({
                        userId: reduxUser.user_id,
                        updates: { mode: "stopwatch" }
                      }));
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 cursor-pointer ${
                    !isPomodoroMode
                      ? "bg-[#FFAA00]/10 text-[#FFAA00]"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 6V12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Deep Work</span>
                    <span className="text-xs opacity-70">Classic stopwatch</span>
                  </div>
                  {!isPomodoroMode && (
                    <div className="ml-auto w-2 h-2 bg-[#FFAA00] rounded-full animate-pulse"></div>
                  )}
                </button>

                {/* Pomodoro Option */}
                <button
                  onClick={() => {
                    setShowTimerDropdown(false);
                    // Optimistic update first
                    dispatch(setPreference({ key: "mode", value: "countdown" }));
                    // Then update preference in database
                    if (reduxUser.user_id) {
                      dispatch(updatePreferences({
                        userId: reduxUser.user_id,
                        updates: { mode: "countdown" }
                      }));
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 cursor-pointer ${
                    isPomodoroMode
                      ? "bg-[#FFAA00]/10 text-[#FFAA00]"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                  }`}
                >
                  <div 
                    className="w-5 h-5"
                    style={{
                      WebkitMask: `url(/hourglass-icon.svg) no-repeat center`,
                      mask: `url(/hourglass-icon.svg) no-repeat center`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      backgroundColor: "currentColor"
                    }}
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Pomodoro</span>
                    <span className="text-xs opacity-70">Custom countdown</span>
                  </div>
                  {isPomodoroMode && (
                    <div className="ml-auto w-2 h-2 bg-[#FFAA00] rounded-full animate-pulse"></div>
                  )}
                </button>
              </div>

              {/* Bottom gradient decoration */}
              <div className="h-px bg-gradient-to-r from-transparent via-[#FFAA00]/20 to-transparent"></div>
            </div>
          )}
        </div>
        
        {/* Name and dropdown button with integrated speaker icon */}
        <div className="ml-auto hidden sm:block">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`group relative flex items-center gap-2 pl-2 pr-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
              dropdownOpen ? 'border border-gray-700' : 'border border-transparent hover:border-[#FFAA00]/50'
            }`}
          >
            {/* Speaker icon inside the button but with its own click handler */}
            <span
              ref={soundIconRef}
              className="cursor-pointer flex items-center px-2"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the dropdown
                if (localVolume === 0) {
                  // Unmute: restore previous volume
                  setLocalVolume(previousVolume);
                } else {
                  // Mute: set to 0 (don't update previousVolume)
                  setLocalVolume(0);
                }
              }}
              title={localVolume === 0 ? "Unmute" : "Mute"}
            >
              {localVolume === 0 ? (
                // Muted macOS-style speaker icon (gray-400 for header)
                <svg width="22" height="22" viewBox="0 0 28 24" fill="none">
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
                    {/* Gray-400 border for mute line (underneath, slightly thicker and longer) */}
                    <line x1="9" y1="6" x2="26" y2="21.5" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
                    {/* Red mute line (on top, slightly thicker and longer) */}
                    <line x1="9" y1="6" x2="26" y2="21.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </svg>
              ) : (
                // Unmuted macOS-style speaker icon (gray-400 for header)
                <svg width="22" height="22" viewBox="0 0 28 24" fill="none">
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
            <span className="text-base font-mono text-gray-400 max-w-[200px] truncate">
              {reduxUser.first_name || user.displayName.split(" ")[0]}
            </span>
            {/* Dropdown arrow */}
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Mobile hamburger icon (screens < 640px) */}
          <span
            className="text-2xl font-mono text-gray-400 select-none cursor-pointer block sm:hidden"
            title="Menu"
            onClick={() => setShowSideModal(true)}
          >
            ☰
          </span>
        </div>
      </div>
      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 bg-gray-900/95 backdrop-blur-sm text-gray-400 rounded-lg shadow-2xl py-4 px-2 min-w-[320px] border border-gray-700 z-50 hidden sm:block animate-in slide-in-from-top-2 fade-in duration-200"
        >
          {/* User Header */}
          <div className="flex items-center mb-4 mx-3 pb-3 border-b border-gray-700/50">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm">
              {(() => {
                const firstLetter = reduxUser.first_name?.charAt(0) || user.displayName?.charAt(0) || 'U';
                const lastLetter = reduxUser.last_name?.charAt(0) || '';
                return (firstLetter + lastLetter).toUpperCase();
              })()}
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-300 font-mono text-sm">
                {reduxUser.first_name 
                  ? `${reduxUser.first_name}${reduxUser.last_name ? ` ${reduxUser.last_name}` : ''}`
                  : user.displayName}
              </h3>
              <p className="text-xs text-gray-500 font-mono">{reduxUser.email || auth.currentUser?.email || ""}</p>
            </div>
          </div>

          {/* Sound Controls Section */}
          <div className="mb-3 mx-3 pb-3 border-b border-gray-700/50">
            <h4 className="text-xs font-medium text-gray-500 mb-2 font-mono uppercase tracking-wider">Sound</h4>
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
                onChange={(e) => updateVolume(Number(e.target.value))}
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
          <div className="p-1">
            {/* Preferences Button */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-gray-400 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00] cursor-pointer"
              onClick={() => {
                closeAllModals();
                setShowPreferences(true);
                setDropdownOpen(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-medium font-mono">Preferences</span>
            </button>

            {/* View Rooms Button */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-gray-400 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00] cursor-pointer"
              onClick={() => {
                closeAllModals();
                setShowRoomsModal(true);
                setDropdownOpen(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="3"
                  width="7"
                  height="7"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <rect
                  x="14"
                  y="3"
                  width="7"
                  height="7"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <rect
                  x="3"
                  y="14"
                  width="7"
                  height="7"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <rect
                  x="14"
                  y="14"
                  width="7"
                  height="7"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <span className="font-medium font-mono">View Rooms</span>
            </button>

            {/* Leave Room Button */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-gray-400 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00] cursor-pointer"
              onClick={() => {
                leaveInstance();
                router.push("/");
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-medium font-mono">Leave Room</span>
            </button>

            {/* Sign Out Button */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-gray-400 hover:bg-[#FFAA00]/10 hover:text-[#FFAA00] cursor-pointer"
              onClick={async () => {
                await signOut(auth);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-medium font-mono">Sign Out</span>
            </button>
          </div>
        </div>
      )}
      {/* History tooltip for public rooms */}
      {showHistoryTooltip && (
        <div className="fixed bottom-20 left-8 z-50 bg-[#181A1B] text-white px-4 py-2 rounded-lg shadow-lg border border-[#23272b] text-sm font-mono">
          History is only available in private rooms.
          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#181A1B] border-r border-b border-[#23272b] transform rotate-45"></div>
        </div>
      )}

      {/* Name Edit Modal */}
      {showNameModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowNameModal(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-800 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer"
              onClick={() => setShowNameModal(false)}
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">Edit Name</h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (editedName.trim() && editedName !== user.displayName) {
                  if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { displayName: editedName.trim() });
                  }
                  // Update the local user state
                  // TODO: Replace with Firebase RTDB update for display name
                  user.displayName = editedName.trim();
                  if (currentInstance) {
                    // const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
                    // set(userRef, { ...user, displayName: editedName.trim() });
                    // Temporary: Just update local user object
                  }
                }
                setShowNameModal(false);
              }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#23272b] text-gray-300 border border-[#23272b] focus:border-[#FFAA00] outline-none font-mono text-sm"
                  placeholder="Enter your name"
                  maxLength={32}
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3 font-bold rounded-lg hover:scale-105 transition-all bg-[#FFAA00] text-white w-24 justify-center flex items-center cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side Modal for Mobile */}
      {showSideModal && (
        <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setShowSideModal(false)}>
          <div
            className="fixed top-0 right-0 h-full w-80 bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-800"
            style={{ transform: showSideModal ? "translateX(0)" : "translateX(100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer"
                onClick={() => setShowSideModal(false)}
              >
                ×
              </button>
              <div className="flex items-center mt-8">
                <div className="w-12 h-12 bg-[#FFAA00] rounded-full flex items-center justify-center text-black font-bold">
                  {(reduxUser.first_name || user.displayName).charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-white font-mono">
                    {reduxUser.first_name && reduxUser.last_name
                      ? `${reduxUser.first_name} ${reduxUser.last_name}`
                      : user.displayName}
                  </h3>
                  <p className="text-sm text-gray-400 font-mono">{reduxUser.email || auth.currentUser?.email || ""}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {/* Sound Controls */}
              <div className="border-b border-[#23272b] pb-4 mb-4">
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
                          <line
                            x1="9"
                            y1="6"
                            x2="26"
                            y2="21.5"
                            stroke="#9ca3af"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <line
                            x1="9"
                            y1="6"
                            x2="26"
                            y2="21.5"
                            stroke="#ef4444"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
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
                    onChange={(e) => updateVolume(Number(e.target.value))}
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

              {/* Invite Others Button */}
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center group cursor-pointer"
                onClick={() => {
                  closeAllModals();
                  setShowInviteModal(true);
                  setShowSideModal(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <path
                    d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                </svg>
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Invite Others</span>
              </button>

              {/* View Rooms Button */}
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center group cursor-pointer"
                onClick={() => {
                  closeAllModals();
                  setShowRoomsModal(true);
                  setShowSideModal(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <rect
                    x="3"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    />
                  <rect
                    x="14"
                    y="3"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    />
                  <rect
                    x="3"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    />
                  <rect
                    x="14"
                    y="14"
                    width="7"
                    height="7"
                    rx="1"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    />
                </svg>
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">View Rooms</span>
              </button>

              {/* Preferences Button */}
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center group cursor-pointer"
                onClick={() => {
                  closeAllModals();
                  setShowPreferences(true);
                  setShowSideModal(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <path
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                </svg>
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Preferences</span>
              </button>

              {/* Leaderboard Button */}
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center group cursor-pointer"
                onClick={() => {
                  closeAllModals();
                  setShowLeaderboard(!showLeaderboard);
                  setShowSideModal(false);
                }}
              >
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Leaderboard</span>
              </button>

              {/* History Button */}
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center group cursor-pointer"
                onClick={() => {
                  if (instanceType === "public") {
                    setShowHistoryTooltip(true);
                    setTimeout(() => setShowHistoryTooltip(false), 3000);
                  } else {
                    closeAllModals();
                    setShowHistory(!showHistory);
                  }
                  setShowSideModal(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <path
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                </svg>
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">
                  {showHistory ? "Timer" : "History"}
                </span>
              </button>

              {/* Analytics Button */}
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center group cursor-pointer"
                onClick={() => {
                  closeAllModals();
                  setShowAnalytics(!showAnalytics);
                  setShowSideModal(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <path
                    d="M9 11v6M12 5v12M15 8v9M3 21h18"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                </svg>
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Analytics</span>
              </button>

              {/* Leave Room Button */}
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center group cursor-pointer"
                onClick={() => {
                  leaveInstance();
                  router.push("/");
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <path
                    d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                </svg>
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Leave Room</span>
              </button>

              {/* Sign Out Button */}
              <button
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center group cursor-pointer"
                onClick={async () => {
                  await signOut(auth);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    />
                </svg>
                <span className="text-gray-400 group-hover:text-[#FFAA00] font-medium font-mono">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
