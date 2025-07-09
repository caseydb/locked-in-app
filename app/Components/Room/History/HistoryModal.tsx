import React from "react";

interface HistoryModalProps {
  children: React.ReactNode;
  dynamicWidthClasses: string;
  onClose?: () => void;
}

export default function HistoryModal({ children, dynamicWidthClasses, onClose }: HistoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className={`bg-[#181f2a] rounded-3xl shadow-2xl px-4 sm:px-6 md:px-10 py-4 sm:py-5 ${dynamicWidthClasses} max-w-[1200px] flex flex-col items-center gap-2 sm:gap-3 border-4 border-[#181f2a] max-h-[90vh] overflow-y-auto custom-scrollbar`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1 mt-1">History</div>
        {children}
      </div>
    </div>
  );
}