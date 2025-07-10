import React, { useState, useRef, useEffect } from "react";
import { useInstance } from "../../Instances";
import { signOut } from "firebase/auth";
import { auth } from "../../../../lib/firebase";
import { useRouter } from "next/navigation";
import VolumeControl from "./VolumeControl";
import UserNameDisplay from "./UserNameDisplay";
import ControlsDropdown from "./ControlsDropdown";
import NameEditModal from "./NameEditModal";
import MobileSideModal from "./MobileSideModal";
import HistoryTooltip from "./HistoryTooltip";
import { useVolumeControl } from "./hooks/useVolumeControl";

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
  setShowTaskList: (show: boolean) => void;
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  setShowRoomsModal: (show: boolean) => void;
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
  setShowTaskList,
  showLeaderboard,
  setShowLeaderboard,
  setShowRoomsModal,
}: ControlsProps) {
  const { user, currentInstance, leaveInstance } = useInstance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showSideModal, setShowSideModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const volumeControl = useVolumeControl(currentInstance, user, localVolume, setLocalVolume);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const isInDropdownMenu = dropdownRef.current && dropdownRef.current.contains(target);
      const isInDropdownIcon = (e.target as Element).closest('[data-dropdown-trigger]');
      
      if (!isInDropdownMenu && !isInDropdownIcon) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleLeaveRoom = () => {
    leaveInstance();
    router.push("/");
  };

  const handleHistoryToggle = () => {
    if (instanceType === "public") {
      setShowHistoryTooltip(true);
      setTimeout(() => setShowHistoryTooltip(false), 3000);
    } else {
      setShowHistory(!showHistory);
    }
    setDropdownOpen(false);
  };

  return (
    <div className={className + " select-none"}>
      <div className="flex items-center">
        <VolumeControl
          localVolume={localVolume}
          previousVolume={volumeControl.previousVolume}
          onVolumeChange={volumeControl.updateVolume}
          onMuteToggle={volumeControl.toggleMute}
        />

        <UserNameDisplay
          userName={user.displayName}
          onDropdownToggle={() => setDropdownOpen(!dropdownOpen)}
          onMobileMenuToggle={() => setShowSideModal(true)}
        />
      </div>

      <ControlsDropdown
        ref={dropdownRef}
        isOpen={dropdownOpen}
        localVolume={localVolume}
        onVolumeChange={volumeControl.updateVolume}
        instanceType={instanceType}
        showHistory={showHistory}
        onShowHistory={handleHistoryToggle}
        onShowHistoryTooltip={setShowHistoryTooltip}
        onShowInviteModal={() => {
          setShowInviteModal(true);
          setDropdownOpen(false);
        }}
        onShowRoomsModal={() => {
          setShowRoomsModal(true);
          setDropdownOpen(false);
        }}
        onShowNameModal={() => {
          setShowNameModal(true);
          setDropdownOpen(false);
        }}
        onLeaveRoom={handleLeaveRoom}
        onSignOut={handleSignOut}
      />

      <HistoryTooltip isVisible={showHistoryTooltip} />

      <NameEditModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        user={user}
        currentInstance={currentInstance}
        initialName={user.displayName}
      />

      <MobileSideModal
        isOpen={showSideModal}
        onClose={() => setShowSideModal(false)}
        user={user}
        localVolume={localVolume}
        onVolumeChange={volumeControl.updateVolume}
        instanceType={instanceType}
        onShowHistory={handleHistoryToggle}
        onShowHistoryTooltip={setShowHistoryTooltip}
        onShowInviteModal={() => {
          setShowInviteModal(true);
          setShowSideModal(false);
        }}
        onShowTaskList={() => {
          setShowTaskList(true);
          setShowSideModal(false);
        }}
        onShowLeaderboard={() => {
          setShowLeaderboard(!showLeaderboard);
          setShowSideModal(false);
        }}
        onShowRoomsModal={() => {
          setShowRoomsModal(true);
          setShowSideModal(false);
        }}
        onShowNameModal={() => {
          setShowNameModal(true);
          setShowSideModal(false);
        }}
        onLeaveRoom={handleLeaveRoom}
        onSignOut={handleSignOut}
      />
    </div>
  );
}