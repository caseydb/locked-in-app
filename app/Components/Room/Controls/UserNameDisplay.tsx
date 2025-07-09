import React, { useRef } from "react";

interface UserNameDisplayProps {
  userName: string;
  onDropdownToggle: () => void;
  onMobileMenuToggle: () => void;
}

export default function UserNameDisplay({ userName, onDropdownToggle, onMobileMenuToggle }: UserNameDisplayProps) {
  const dropdownIconRef = useRef<HTMLSpanElement>(null);

  return (
    <div className="ml-3 sm:ml-3 flex flex-col">
      {/* Desktop view - first name with dropdown */}
      <div className="flex items-center">
        <span
          className="text-base font-mono text-gray-400 select-none cursor-pointer hidden sm:block"
          onClick={onDropdownToggle}
        >
          {userName.split(" ")[0]}
        </span>
        <span
          ref={dropdownIconRef}
          className="ml-2 text-gray-400 cursor-pointer select-none hidden sm:block"
          onClick={onDropdownToggle}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 10L12 15L17 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {/* Mobile view - hamburger menu */}
      <span
        className="text-base font-mono text-gray-400 select-none cursor-pointer block sm:hidden"
        onClick={onMobileMenuToggle}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6H20M4 12H20M4 18H20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}