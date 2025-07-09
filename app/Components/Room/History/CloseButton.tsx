import React from "react";

interface CloseButtonProps {
  onClose?: () => void;
}

export default function CloseButton({ onClose }: CloseButtonProps) {
  return (
    <button
      className="mt-2 sm:mt-3 bg-[#FFAA00] text-black font-extrabold text-lg sm:text-xl px-8 sm:px-10 py-3 rounded-lg shadow hover:scale-105 transition-transform"
      onClick={onClose}
    >
      Close
    </button>
  );
}