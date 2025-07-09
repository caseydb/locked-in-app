import React from "react";

interface EmptyStateProps {
  onClose?: () => void;
}

export default function EmptyState({ onClose }: EmptyStateProps) {
  return (
    <>
      <div className="text-center text-white">No History Yet</div>
      <button
        className="mt-2 sm:mt-3 bg-[#FFAA00] text-black font-extrabold text-lg sm:text-xl px-8 sm:px-10 py-3 rounded-lg shadow hover:scale-105 transition-transform"
        onClick={onClose}
      >
        Close
      </button>
    </>
  );
}