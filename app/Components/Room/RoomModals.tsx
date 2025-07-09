import React, { useState } from "react";
import History from "./History";
import Leaderboard from "./Leaderboard";
import TaskList from "./TaskList";
import RoomsModal from "./RoomsModal";

interface RoomModalsProps {
  currentInstance: any;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  showTaskList: boolean;
  setShowTaskList: (show: boolean) => void;
  showRoomsModal: boolean;
  setShowRoomsModal: (show: boolean) => void;
  showInviteModal: boolean;
  setShowInviteModal: (show: boolean) => void;
  task: string;
  setTask: (task: string) => void;
  timerRunning: boolean;
  hasActiveTimer: boolean;
  timerStartRef: React.RefObject<() => void>;
  timerPauseRef: React.RefObject<() => void>;
  currentTimerSeconds: number;
}

export default function RoomModals({
  currentInstance,
  showHistory,
  setShowHistory,
  showLeaderboard,
  setShowLeaderboard,
  showTaskList,
  setShowTaskList,
  showRoomsModal,
  setShowRoomsModal,
  showInviteModal,
  setShowInviteModal,
  task,
  setTask,
  timerRunning,
  hasActiveTimer,
  timerStartRef,
  timerPauseRef,
  currentTimerSeconds,
}: RoomModalsProps) {
  const [copied, setCopied] = useState(false);

  return (
    <>
      {/* History Modal */}
      {showHistory && currentInstance && (
        <History roomId={currentInstance.id} onClose={() => setShowHistory(false)} />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && currentInstance && (
        <Leaderboard roomId={currentInstance.id} onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Task List Modal */}
      <TaskList
        isOpen={showTaskList}
        onClose={() => setShowTaskList(false)}
        onStartTask={(taskText) => {
          setTask(taskText);
          setShowTaskList(false);
          setTimeout(() => {
            if (timerStartRef.current) {
              timerStartRef.current();
            }
          }, 50);
        }}
        currentTask={task}
        isTimerRunning={timerRunning}
        hasActiveTimer={hasActiveTimer}
        onPauseTimer={() => {
          if (timerPauseRef.current) {
            timerPauseRef.current();
          }
        }}
        timerSeconds={currentTimerSeconds}
      />

      {/* Rooms Modal */}
      <RoomsModal isOpen={showRoomsModal} onClose={() => setShowRoomsModal(false)} />

      {/* Invite Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-[#181A1B] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[#23272b] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl"
              onClick={() => setShowInviteModal(false)}
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-white mb-6">Invite link</h2>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={window.location.href}
                readOnly
                className="flex-1 px-4 py-3 rounded-lg bg-[#23272b] text-gray-300 border border-[#23272b] focus:border-[#FFAA00] outline-none font-mono text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                }}
                className={`px-6 py-3 font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-2 ${
                  copied ? "bg-green-500 text-white" : "bg-[#FFAA00] text-white"
                } w-24 justify-center`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="8" y="8" width="12" height="12" rx="2" ry="2" fill="currentColor"></rect>
                  <rect
                    x="4"
                    y="4"
                    width="12"
                    height="12"
                    rx="2"
                    ry="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  ></rect>
                </svg>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}