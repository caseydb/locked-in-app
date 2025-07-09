import React from "react";
import ActiveWorkers from "./ActiveWorkers";
import PersonalStats from "./PersonalStats";
import Controls from "./Controls";
import TaskInput from "./TaskInput";
import Timer from "./Timer";
import Notes from "./Notes/Notes";
import FlyingMessages from "./FlyingMessages";
import WelcomeBackMessage from "./WelcomeBackMessage";
import Sounds from "./Sounds";
import { FlyingMessage } from "./hooks/useFlyingMessages";

interface Instance {
  id: string;
  type: "public" | "private";
  users: { displayName: string; id: string }[];
}

interface RoomLayoutProps {
  currentInstance: Instance;
  task: string;
  setTask: (task: string) => void;
  timerRunning: boolean;
  hasStarted: boolean;
  inputLocked: boolean;
  hasActiveTimer: boolean;
  timerResetKey: number;
  timerStartRef: React.RefObject<() => void>;
  timerPauseRef: React.RefObject<() => void>;
  timerSecondsRef: React.RefObject<number>;
  currentTaskId: string | null;
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  showTaskList: boolean;
  setShowTaskList: (show: boolean) => void;
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  showRoomsModal: boolean;
  setShowRoomsModal: (show: boolean) => void;
  showInviteModal: boolean;
  setShowInviteModal: (show: boolean) => void;
  showHistoryTooltip: boolean;
  setShowHistoryTooltip: (show: boolean) => void;
  localVolume: number;
  setLocalVolume: (volume: number) => void;
  realTimeUserCount: number;
  flyingMessages: FlyingMessage[];
  onActiveChange: (isActive: boolean) => void;
  onComplete: (duration: string) => void;
  onClear: () => void;
}

export default function RoomLayout({
  currentInstance,
  task,
  setTask,
  timerRunning,
  hasStarted,
  inputLocked,
  hasActiveTimer,
  timerResetKey,
  timerStartRef,
  timerPauseRef,
  timerSecondsRef,
  currentTaskId,
  showNotes,
  setShowNotes,
  showHistory,
  setShowHistory,
  showTaskList,
  setShowTaskList,
  showLeaderboard,
  setShowLeaderboard,
  setShowRoomsModal,
  setShowInviteModal,
  showHistoryTooltip,
  setShowHistoryTooltip,
  localVolume,
  setLocalVolume,
  realTimeUserCount,
  flyingMessages,
  onActiveChange,
  onComplete,
  onClear,
}: RoomLayoutProps) {
  return (
    <>
      {/* Active work border overlay */}
      {timerRunning && <div className="fixed inset-0 border-4 border-[#FFAA00] pointer-events-none z-50"></div>}
      
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white relative">
        {/* Personal stats with streak */}
        <PersonalStats />
        
        {/* Controls in top right */}
        <Controls
          className="fixed top-[16px] right-8 z-50"
          localVolume={localVolume}
          setLocalVolume={setLocalVolume}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showHistoryTooltip={showHistoryTooltip}
          setShowHistoryTooltip={setShowHistoryTooltip}
          instanceType={currentInstance.type}
          setShowInviteModal={setShowInviteModal}
          setShowTaskList={setShowTaskList}
          showLeaderboard={showLeaderboard}
          setShowLeaderboard={setShowLeaderboard}
          setShowRoomsModal={setShowRoomsModal}
        />

        {/* Room type indicator - centered bottom - hidden on mobile */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[60] text-gray-400 text-sm sm:text-base font-mono select-none px-2 text-center whitespace-nowrap hidden sm:block">
          {currentInstance.type === "private" ? (
            "Private Room"
          ) : (
            <>Public Room | {realTimeUserCount === 1 ? "Just You" : `+ ${realTimeUserCount} ppl`}</>
          )}
        </div>

        {/* Tasks button - desktop only: bottom right corner */}
        <button
          className={`fixed bottom-4 right-8 z-[60] text-gray-400 text-base font-mono underline underline-offset-4 select-none hover:text-[#FFAA00] transition-colors px-2 py-1 bg-transparent border-none cursor-pointer hidden sm:flex items-center ${
            showTaskList ? "!hidden" : ""
          }`}
          onClick={() => setShowTaskList(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2">
            <path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Tasks
        </button>

        {/* Leaderboard button - bottom left */}
        <button
          className="fixed bottom-4 left-8 z-[60] text-gray-400 text-base font-mono cursor-pointer underline underline-offset-4 select-none hover:text-[#FFAA00] transition-colors px-2 py-1 bg-transparent border-none hidden sm:block"
          onClick={() => setShowLeaderboard(true)}
        >
          Leaderboard
        </button>

        {/* Flying messages and other overlays */}
        <FlyingMessages
          flyingMessages={flyingMessages}
          flyingPlaceholders={[]}
          activeWorkers={currentInstance.users.map((u) => ({ name: u.displayName, userId: u.id }))}
        />
        
        <WelcomeBackMessage roomId={currentInstance.id} />
        <Sounds roomId={currentInstance.id} localVolume={localVolume} />
        <ActiveWorkers roomId={currentInstance.id} />

        {/* Main content: TaskInput or Timer/room UI */}
        <div className={showHistory ? "hidden" : "flex flex-col items-center justify-center"}>
          <TaskInput
            task={task}
            setTask={setTask}
            disabled={(hasStarted && inputLocked) || hasActiveTimer}
            onStart={() => timerStartRef.current && timerStartRef.current()}
          />
        </div>

        {/* Timer and Notes section */}
        <div className={showHistory ? "hidden" : "flex flex-col items-center justify-center"}>
          {/* Notes - inline above timer, only show when task exists */}
          {task.trim() && <Notes isOpen={showNotes} taskId={currentTaskId} taskText={task} />}

          <Timer
            key={timerResetKey}
            onActiveChange={onActiveChange}
            startRef={timerStartRef}
            pauseRef={timerPauseRef}
            onComplete={onComplete}
            secondsRef={timerSecondsRef}
            requiredTask={!!task.trim()}
            task={task}
          />
          
          {/* Action buttons */}
          {task.trim() && (
            <div className="flex justify-center w-full gap-6">
              <button
                className="mt-4 text-gray-400 text-base font-mono underline underline-offset-4 select-none hover:text-[#FFAA00] transition-colors px-2 py-1 bg-transparent border-none cursor-pointer"
                onClick={onClear}
              >
                Clear
              </button>
              <button
                className="mt-4 text-gray-400 text-base font-mono underline underline-offset-4 select-none hover:text-[#FFAA00] transition-colors px-2 py-1 bg-transparent border-none cursor-pointer"
                onClick={() => setShowNotes(!showNotes)}
              >
                Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}