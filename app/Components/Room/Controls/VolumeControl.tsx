import React, { useRef } from "react";

interface VolumeControlProps {
  localVolume: number;
  previousVolume: number;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
}

export default function VolumeControl({ localVolume, onMuteToggle }: VolumeControlProps) {
  const soundIconRef = useRef<HTMLSpanElement>(null);

  return (
    <div className="relative hidden sm:block">
      <span
        ref={soundIconRef}
        className="cursor-pointer flex items-center"
        onClick={onMuteToggle}
        title={localVolume === 0 ? "Unmute" : "Mute"}
      >
        {localVolume === 0 ? (
          // Muted speaker icon
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
              <line x1="9" y1="6" x2="26" y2="21.5" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
              <line x1="9" y1="6" x2="26" y2="21.5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        ) : (
          // Unmuted speaker icon
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
    </div>
  );
}