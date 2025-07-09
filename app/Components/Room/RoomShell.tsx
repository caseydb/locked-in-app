"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { rtdb } from "../../../lib/firebase";
import { ref, remove } from "firebase/database";
import SignIn from "../SignIn";
import History from "./History";
import RoomLayout from "./RoomLayout";
import RoomModals from "./RoomModals";
import QuitModal from "./QuitModal";
import { useRoomState } from "./hooks/useRoomState";
import { useTabTracking } from "./hooks/useTabTracking";
import { useTimerCoordination } from "./hooks/useTimerCoordination";
import { useFlyingMessages } from "./hooks/useFlyingMessages";

export default function RoomShell({ roomUrl }: { roomUrl: string }) {
  const router = useRouter();
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showHistoryTooltip, setShowHistoryTooltip] = useState(false);
  const [showTaskList, setShowTaskList] = useState(false);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Use extracted hooks
  const roomState = useRoomState(roomUrl);
  const tabTracking = useTabTracking(roomState.currentInstance, roomState.user);
  const timerCoordination = useTimerCoordination(
    roomState.currentInstance,
    roomState.user,
    roomState.timerRunning,
    roomState.timerSecondsRef,
    roomState.task
  );
  const flyingMessages = useFlyingMessages(roomState.currentInstance);

  // Add keyboard shortcuts for Notes and Task List
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      
      // Cmd/Ctrl+J for Timer Notes
      if ((isMac && e.metaKey && e.key.toLowerCase() === "j") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "j")) {
        if (roomState.task.trim()) {
          e.preventDefault();
          setShowNotes((prev) => !prev);
        }
      }
      
      // Cmd/Ctrl+K for Task List (toggle)
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setShowTaskList((prev) => !prev);
      }
      
      // Cmd/Ctrl+M for Mute/Unmute (toggle)
      if ((isMac && e.metaKey && e.key.toLowerCase() === "m") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "m")) {
        e.preventDefault();
        timerCoordination.toggleMute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [roomState.task, timerCoordination]);

  // Handle timer active state change
  const handleActiveChange = (isActive: boolean) => {
    timerCoordination.handleActiveChange(isActive);
    roomState.setTimerRunning(isActive);
    if (isActive) {
      roomState.setInputLocked(true);
      roomState.setHasStarted(true);
    } else {
      roomState.setInputLocked(true);
    }
  };

  // Handle task clear
  const handleClear = () => {
    if (roomState.timerSecondsRef.current && roomState.timerSecondsRef.current > 0 && roomState.task.trim()) {
      setShowQuitModal(true);
      return;
    }
    roomState.setTimerRunning(false);
    roomState.setTask("");
    roomState.setTimerResetKey((k) => k + 1);
    roomState.setInputLocked(false);
    roomState.setHasStarted(false);
    timerCoordination.clearTimerState();
  };

  // Handle quit confirmation
  const handleQuitConfirm = () => {
    if (roomState.timerSecondsRef.current && roomState.timerSecondsRef.current > 0 && roomState.currentInstance && roomState.user && roomState.task.trim()) {
      const duration = timerCoordination.formatTime(roomState.timerSecondsRef.current);
      const quitData = {
        userId: roomState.user.id,
        displayName: roomState.user.displayName,
        task: roomState.task + " (Quit Early)",
        duration,
        timestamp: Date.now(),
      };
      
      timerCoordination.saveToHistory(quitData);
      timerCoordination.notifyEvent("quit");
      timerCoordination.addFlyingMessage(
        `💀 ${roomState.user.displayName} folded faster than a lawn chair.`,
        "text-red-500"
      );

      // Remove user from activeUsers
      const activeRef = ref(rtdb, `instances/${roomState.currentInstance.id}/activeUsers/${roomState.user.id}`);
      remove(activeRef);
    }
    
    resetToInitialState();
    setShowQuitModal(false);
  };

  // Handle push on (don't quit)
  const handlePushOn = () => {
    setShowQuitModal(false);
  };

  // Handle task completion
  const handleComplete = (duration: string) => {
    if (roomState.currentInstance && roomState.user) {
      const completionData = {
        userId: roomState.user.id,
        displayName: roomState.user.displayName,
        task: roomState.task,
        duration,
        timestamp: Date.now(),
      };

      timerCoordination.saveToHistory(completionData);
      timerCoordination.notifyEvent("complete");
      timerCoordination.addFlyingMessage(
        `🏆 ${roomState.user.displayName} has successfully completed a task!`,
        "text-green-400"
      );

      // Remove user from activeUsers
      const activeRef = ref(rtdb, `instances/${roomState.currentInstance.id}/activeUsers/${roomState.user.id}`);
      remove(activeRef);
    }

    resetToInitialState();
  };

  // Reset to initial state helper
  const resetToInitialState = () => {
    roomState.setTimerRunning(false);
    roomState.setTask("");
    roomState.setTimerResetKey((k) => k + 1);
    roomState.setInputLocked(false);
    roomState.setHasStarted(false);
    timerCoordination.clearTimerState();
  };

  // Loading and authentication checks
  if (!roomState.userReady || !roomState.user.id || roomState.user.id.startsWith("user-")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <div className="w-full flex flex-col items-center mb-10 mt-2">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-2 drop-shadow-lg">
              Drop In. Lock In. Get Sh*t Done.
            </h1>
            <p className="text-lg md:text-2xl text-gray-300 text-center max-w-2xl mx-auto opacity-90 font-medium">
              Level up your work with others in the zone.
            </p>
          </div>
          <SignIn />
        </div>
      </div>
    );
  }

  if (roomState.loading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  if (!roomState.roomFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="bg-gray-900/90 rounded-2xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center gap-8 border-4 border-yellow-500">
          <p className="text-2xl font-bold text-red-400">Room not found.</p>
          <button
            className="bg-yellow-500 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-400 transition"
            onClick={() => router.push("/")}
          >
            Go to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (roomState.currentInstance) {
    return (
      <>
        {/* History view */}
        <div className={showHistory ? "" : "hidden"}>
          <History roomId={roomState.currentInstance.id} onClose={() => setShowHistory(false)} />
        </div>

        {/* Main room layout */}
        <div className={showHistory ? "hidden" : ""}>
          <RoomLayout
            currentInstance={roomState.currentInstance}
            task={roomState.task}
            setTask={roomState.setTask}
            timerRunning={roomState.timerRunning}
            hasStarted={roomState.hasStarted}
            inputLocked={roomState.inputLocked}
            hasActiveTimer={roomState.hasActiveTimer}
            timerResetKey={roomState.timerResetKey}
            timerStartRef={roomState.timerStartRef}
            timerPauseRef={roomState.timerPauseRef}
            timerSecondsRef={roomState.timerSecondsRef}
            currentTaskId={roomState.currentTaskId}
            showNotes={showNotes}
            setShowNotes={setShowNotes}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            showTaskList={showTaskList}
            setShowTaskList={setShowTaskList}
            showLeaderboard={showLeaderboard}
            setShowLeaderboard={setShowLeaderboard}
            showRoomsModal={showRoomsModal}
            setShowRoomsModal={setShowRoomsModal}
            showInviteModal={showInviteModal}
            setShowInviteModal={setShowInviteModal}
            showHistoryTooltip={showHistoryTooltip}
            setShowHistoryTooltip={setShowHistoryTooltip}
            localVolume={timerCoordination.localVolume}
            setLocalVolume={timerCoordination.setLocalVolume}
            realTimeUserCount={roomState.realTimeUserCount}
            flyingMessages={flyingMessages.flyingMessages}
            onActiveChange={handleActiveChange}
            onComplete={handleComplete}
            onClear={handleClear}
          />
        </div>

        {/* Quit Modal */}
        <QuitModal
          isOpen={showQuitModal}
          onClose={() => setShowQuitModal(false)}
          onQuit={handleQuitConfirm}
          onPushOn={handlePushOn}
        />

        {/* All other modals */}
        <RoomModals
          currentInstance={roomState.currentInstance}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showLeaderboard={showLeaderboard}
          setShowLeaderboard={setShowLeaderboard}
          showTaskList={showTaskList}
          setShowTaskList={setShowTaskList}
          showRoomsModal={showRoomsModal}
          setShowRoomsModal={setShowRoomsModal}
          showInviteModal={showInviteModal}
          setShowInviteModal={setShowInviteModal}
          task={roomState.task}
          setTask={roomState.setTask}
          timerRunning={roomState.timerRunning}
          hasActiveTimer={roomState.hasActiveTimer}
          timerStartRef={roomState.timerStartRef}
          timerPauseRef={roomState.timerPauseRef}
          currentTimerSeconds={roomState.currentTimerSeconds}
        />
      </>
    );
  }

  return null;
}