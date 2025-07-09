import React, { useState } from "react";
import { updateProfile } from "firebase/auth";
import { auth } from "../../../../lib/firebase";
import { rtdb } from "../../../../lib/firebase";
import { ref, set } from "firebase/database";

interface NameEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  currentInstance: any;
  initialName: string;
}

export default function NameEditModal({ isOpen, onClose, user, currentInstance, initialName }: NameEditModalProps) {
  const [editedName, setEditedName] = useState(initialName);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim() && editedName !== user.displayName) {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: editedName.trim() });
      }
      // Update the local user state
      user.displayName = editedName.trim();
      if (currentInstance) {
        const userRef = ref(rtdb, `instances/${currentInstance.id}/users/${user.id}`);
        set(userRef, { ...user, displayName: editedName.trim() });
      }
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="bg-[#181A1B] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[#23272b] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-xl"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Edit Name</h2>

        <form onSubmit={handleSubmit}>
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
              className="px-6 py-3 font-bold rounded-lg hover:scale-105 transition-all bg-[#FFAA00] text-white w-24 justify-center flex items-center"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}