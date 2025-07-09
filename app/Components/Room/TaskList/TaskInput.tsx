import React, { useRef, useEffect } from "react";

interface TaskInputProps {
  onAddTask: (text: string) => void;
  newTaskText: string;
  setNewTaskText: (text: string) => void;
  isOpen: boolean;
}

export default function TaskInput({ onAddTask, newTaskText, setNewTaskText, isOpen }: TaskInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-b border-gray-700">
      <input
        ref={inputRef}
        type="text"
        value={newTaskText}
        onChange={(e) => {
          if (e.target.value.length <= 69) {
            setNewTaskText(e.target.value);
          }
        }}
        placeholder="Add a new task..."
        className="flex-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-600 focus:border-[#FFAA00] outline-none text-sm"
        maxLength={69}
      />
      <button
        type="submit"
        disabled={!newTaskText.trim()}
        className="px-4 py-2 bg-[#FFAA00] text-black rounded font-semibold hover:bg-[#FF9900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        Add
      </button>
    </form>
  );
}