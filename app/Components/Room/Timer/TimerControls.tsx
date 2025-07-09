import React from "react";

interface TimerControlsProps {
  running: boolean;
  seconds: number;
  disabled?: boolean;
  requiredTask?: boolean;
  onStart: () => void;
  onStop: () => void;
  onComplete: () => void;
}

export default function TimerControls({
  running,
  seconds,
  disabled = false,
  requiredTask = true,
  onStart,
  onStop,
  onComplete,
}: TimerControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md sm:max-w-none">
      {!running ? (
        <button
          className="bg-white text-black font-extrabold text-xl sm:text-2xl px-8 sm:px-12 py-3 sm:py-4 rounded-xl shadow-lg transition hover:scale-105 disabled:opacity-40 w-full sm:w-auto cursor-pointer"
          onClick={onStart}
          disabled={disabled || !requiredTask}
        >
          {seconds > 0 ? "Resume" : "Start"}
        </button>
      ) : (
        <>
          <button
            className="bg-white text-black font-extrabold text-xl sm:text-2xl px-8 sm:px-12 py-3 sm:py-4 rounded-xl shadow-lg transition hover:scale-102 disabled:opacity-40 w-full sm:w-48 cursor-pointer"
            onClick={onStop}
          >
            Pause
          </button>
          <button
            className="bg-green-500 text-white font-extrabold text-xl sm:text-2xl px-8 sm:px-12 py-3 sm:py-4 rounded-xl shadow-lg transition hover:scale-102 disabled:opacity-40 w-full sm:w-48 cursor-pointer"
            onClick={onComplete}
          >
            Complete
          </button>
        </>
      )}
    </div>
  );
}