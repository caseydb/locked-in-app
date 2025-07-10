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
      {/* First name with dropdown arrow */}
      <div className="flex items-center">
        <span
          className="text-base font-mono text-gray-400 select-none cursor-pointer hidden sm:block"
          onClick={onDropdownToggle}
        >
          {userName.split(" ")[0]}
        </span>
        {/* Mobile hamburger icon (screens < 640px) */}
        <span
          className="text-2xl font-mono text-gray-400 select-none cursor-pointer block sm:hidden"
          title="Menu"
          onClick={onMobileMenuToggle}
        >
          ☰
        </span>
        {/* Dropdown arrow - aligned to middle of name - hidden on mobile */}
        <span
          ref={dropdownIconRef}
          className="cursor-pointer text-gray-400 text-2xl ml-2 leading-none hidden sm:block"
          style={{ transform: "translateY(-6px)" }}
          onClick={onDropdownToggle}
        >
          ⌄
        </span>
      </div>
    </div>
  );
}