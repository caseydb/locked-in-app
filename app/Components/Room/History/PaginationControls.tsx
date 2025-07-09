import React from "react";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function PaginationControls({ page, totalPages, onPrevious, onNext }: PaginationControlsProps) {
  return (
    <div className="mt-3 flex items-center justify-center gap-4 lg:gap-8">
      <button
        className={`px-2 lg:px-3 py-1.5 w-20 lg:w-28 rounded-md text-sm lg:text-base font-mono transition-colors ${
          page === 1
            ? "bg-[#181A1B] text-gray-500 cursor-not-allowed"
            : "bg-gray-800 text-gray-200 hover:bg-gray-700"
        }`}
        onClick={onPrevious}
        disabled={page === 1}
      >
        Previous
      </button>
      <span className="text-gray-300 text-base lg:text-xl font-mono">
        Page {page} of {totalPages}
      </span>
      <button
        className={`px-2 lg:px-3 py-1.5 w-20 lg:w-28 rounded-md text-sm lg:text-base font-mono transition-colors ${
          page === totalPages
            ? "bg-[#181A1B] text-gray-500 cursor-not-allowed"
            : "bg-gray-800 text-gray-200 hover:bg-gray-700"
        }`}
        onClick={onNext}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}