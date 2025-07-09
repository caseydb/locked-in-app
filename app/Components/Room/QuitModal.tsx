import React from "react";

interface QuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuit: () => void;
  onPushOn: () => void;
}

export default function QuitModal({ isOpen, onClose, onQuit, onPushOn }: QuitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 pointer-events-auto" />
      <div
        className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto"
        onClick={onClose}
      >
        <div
          className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-400">
                  <path
                    d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Quit Session</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to quit? This will be logged to your history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onPushOn}
                className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Push On
              </button>
              <button
                onClick={onQuit}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}