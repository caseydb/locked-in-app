import React, { useState, useEffect, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { rtdb } from "../../../../lib/firebase";
import { ref, set, onValue, off } from "firebase/database";
import { useInstance } from "../../Instances";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  order?: number;
}

interface NoteItem {
  id: string;
  type: "text" | "checkbox" | "bullet" | "number";
  content: string;
  completed?: boolean;
  level: number;
}

interface SortableTaskProps {
  task: Task;
  isEditing: boolean;
  editingText: string;
  onStartEditing: (task: Task) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: (id: string) => void;
  onEditTextChange: (text: string) => void;
  editInputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onStartTask?: (taskText: string) => void;
  currentTask?: string;
  isTimerRunning?: boolean;
  hasActiveTimer?: boolean;
  onPauseTimer?: () => void;
  timerSeconds?: number;
  isExpanded?: boolean;
  onToggleExpanded?: (taskId: string) => void;
}

function formatTime(s: number) {
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (s % 60).toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes}:${secs}`;
  } else {
    return `${minutes}:${secs}`;
  }
}

export default function SortableTask({
  task,
  isEditing,
  editingText,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onRemove,
  onEditTextChange,
  editInputRef,
  onStartTask,
  currentTask,
  isTimerRunning,
  hasActiveTimer,
  onPauseTimer,
  timerSeconds,
  isExpanded,
  onToggleExpanded,
}: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const { user } = useInstance();
  const [isHovered, setIsHovered] = useState(false);
  const [items, setItems] = useState<NoteItem[]>([{ id: "1", type: "text", content: "", level: 0 }]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<number>(2);
  const inputRefs = useRef<{ [key: string]: HTMLTextAreaElement }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Load notes from Firebase when task is expanded
  useEffect(() => {
    if (!user?.id || !task.id || !isExpanded) return;

    const notesRef = ref(rtdb, `users/${user.id}/taskNotes/${task.id}`);
    const handle = onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.items) {
        setItems(data.items);
        // Find the highest ID to set nextId correctly
        const maxId = Math.max(...data.items.map((item: NoteItem) => parseInt(item.id)), 0);
        setNextId(maxId + 1);
      }
    });

    return () => {
      off(notesRef, "value", handle);
    };
  }, [user?.id, task.id, isExpanded]);

  // Focus when expanded
  useEffect(() => {
    if (isExpanded && items[0]?.id) {
      setFocusedId(items[0].id);
    }
  }, [isExpanded, items]);

  // Handle textarea height adjustment
  useEffect(() => {
    if (isEditing && editInputRef.current instanceof HTMLTextAreaElement) {
      const textarea = editInputRef.current;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const singleLineHeight = 40;
      const multiLineMinHeight = 60;

      if (scrollHeight > singleLineHeight) {
        textarea.style.height = Math.max(scrollHeight, multiLineMinHeight) + "px";
      } else {
        textarea.style.height = Math.max(scrollHeight, singleLineHeight) + "px";
      }
    }
  }, [isEditing, editingText, editInputRef]);

  // Save notes to Firebase with debouncing
  const saveNotes = (newItems: NoteItem[]) => {
    if (!user?.id || !task.id) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      const notesRef = ref(rtdb, `users/${user.id}/taskNotes/${task.id}`);
      set(notesRef, {
        items: newItems,
        taskId: task.id,
        taskText: task.text,
        lastUpdated: Date.now(),
        userId: user.id,
      });
    }, 500); // 500ms debounce
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 999 : "auto",
    willChange: isDragging ? "transform" : "auto",
  };

  const isCurrentTask = currentTask && currentTask.trim() === task.text.trim();

  // Auto-resize textarea
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(28, textarea.scrollHeight)}px`;
  };

  // Handle input changes
  const handleContentChange = (id: string, value: string) => {
    const newItems = items.map((item) => (item.id === id ? { ...item, content: value } : item));
    setItems(newItems);
    saveNotes(newItems);

    // Auto-resize
    const textarea = inputRefs.current[id];
    if (textarea) {
      autoResize(textarea);
    }
  };

  // Toggle checkbox
  const toggleCheckbox = (id: string) => {
    const newItems = items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item));
    setItems(newItems);
    saveNotes(newItems);
  };

  // Get numbered list number
  const getNumberedIndex = (currentIndex: number): number => {
    let count = 1;
    for (let i = 0; i < currentIndex; i++) {
      if (items[i].type === "number" && items[i].level === items[currentIndex].level) {
        count++;
      }
    }
    return count;
  };

  // Handle key down events
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    // Always stop space and enter from propagating to parent
    if (e.key === " " || e.key === "Enter") {
      e.stopPropagation();
    }
    
    const currentIndex = items.findIndex((item) => item.id === id);
    const currentItem = items[currentIndex];

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // Create new item
      const newId = nextId.toString();
      setNextId(nextId + 1);
      let newType: NoteItem["type"] = "text";
      const newLevel = currentItem.level;
      // If current line is formatted and has text, continue the format
      // If current line is empty (0 length), always create normal text
      if (["checkbox", "bullet", "number"].includes(currentItem.type) && currentItem.content.length > 0) {
        newType = currentItem.type;
      }
      // If current item is empty and formatted, convert it to text first
      if (["checkbox", "bullet", "number"].includes(currentItem.type) && currentItem.content.length === 0) {
        const updatedItems = items.map((item) => (item.id === id ? { ...item, type: "text" as const, completed: false } : item));
        setItems(updatedItems);
        saveNotes(updatedItems);
        return;
      }
      const newItem: NoteItem = {
        id: newId,
        type: newType,
        content: "",
        level: newLevel,
      };

      const newItems = [...items];
      newItems.splice(currentIndex + 1, 0, newItem);
      setItems(newItems);
      saveNotes(newItems);
      setFocusedId(newId);

      // Focus new item after render
      setTimeout(() => {
        const newTextarea = inputRefs.current[newId];
        if (newTextarea) {
          newTextarea.focus();
        }
      }, 0);
    }

    if (e.key === "Backspace" && currentItem.content === "" && items.length > 1) {
      e.preventDefault();

      const newItems = items.filter((item) => item.id !== id);
      setItems(newItems);
      saveNotes(newItems);

      if (currentIndex > 0) {
        const prevId = newItems[currentIndex - 1].id;
        setFocusedId(prevId);
        setTimeout(() => {
          const prevTextarea = inputRefs.current[prevId];
          if (prevTextarea) {
            prevTextarea.focus();
            prevTextarea.setSelectionRange(prevTextarea.value.length, prevTextarea.value.length);
          }
        }, 0);
      }
    }

    if (e.key === "Backspace" && currentItem.content === "" && items.length === 1 && currentItem.type !== "text") {
      e.preventDefault();
      const newItems: NoteItem[] = [{ ...currentItem, type: "text" as const, completed: false }];
      setItems(newItems);
      saveNotes(newItems);
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const newLevel = e.shiftKey ? Math.max(0, currentItem.level - 1) : Math.min(3, currentItem.level + 1);
      const newItems = items.map((item) => (item.id === id ? { ...item, level: newLevel } : item));
      setItems(newItems);
      saveNotes(newItems);
    }

    if (e.key === "ArrowUp" && currentIndex > 0) {
      e.preventDefault();
      const prevId = items[currentIndex - 1].id;
      inputRefs.current[prevId]?.focus();
      setFocusedId(prevId);
    }

    if (e.key === "ArrowDown" && currentIndex < items.length - 1) {
      e.preventDefault();
      const nextId = items[currentIndex + 1].id;
      inputRefs.current[nextId]?.focus();
      setFocusedId(nextId);
    }
  };

  // Handle input for auto-formatting
  const handleInput = (id: string, value: string) => {
    const item = items.find((item) => item.id === id);
    if (!item) return;

    let newType = item.type;
    let newContent = value;

    // Only process formatting at the beginning of the line
    if (item.type === "text" && value.length <= 4) {
      if (value === "[]" || value === "[] ") {
        newType = "checkbox";
        newContent = value.replace(/^\[\]\s*/, "");
      } else if (value === "[x] " || value === "[X] ") {
        newType = "checkbox";
        newContent = "";
        const newItems = items.map((item) =>
          item.id === id ? { ...item, type: newType, content: newContent, completed: true } : item
        );
        setItems(newItems);
        saveNotes(newItems);
        return;
      } else if (value === "- ") {
        newType = "bullet";
        newContent = "";
      } else if (/^(\d+)\.\s$/.test(value)) {
        newType = "number";
        newContent = "";
      }
    }

    if (newType !== item.type || newContent !== value) {
      const newItems = items.map((item) => (item.id === id ? { ...item, type: newType, content: newContent } : item));
      setItems(newItems);
      saveNotes(newItems);
    }
  };

  // Drag handlers for notes
  const handleNoteDragStart = (e: React.DragEvent, id: string) => {
    const item = items.find((item) => item.id === id);
    if (item?.type !== "checkbox") {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleNoteDragOver = (e: React.DragEvent, id: string) => {
    const item = items.find((item) => item.id === id);
    if (item?.type !== "checkbox") {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  };

  const handleNoteDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
  };

  const handleNoteDrop = (e: React.DragEvent, targetId: string) => {
    const targetItem = items.find((item) => item.id === targetId);
    if (targetItem?.type !== "checkbox") {
      return;
    }

    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");

    if (draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const draggedIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setItems(newItems);
    saveNotes(newItems);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleNoteDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // Focus first item when notes are initially expanded
  useEffect(() => {
    if (isExpanded && items[0]?.id && !focusedId) {
      setFocusedId(items[0].id);
      const textarea = inputRefs.current[items[0].id];
      if (textarea) {
        setTimeout(() => {
          textarea.focus();
          autoResize(textarea);
        }, 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);


  return (
    <div
      ref={setNodeRef}
      style={style}
      data-task-id={task.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group p-2 mx-2 my-1 rounded-lg border ${
        isDragging
          ? "opacity-50 bg-gray-800 border-gray-600"
          : isCurrentTask
          ? "transition-all duration-200 hover:shadow-lg hover:scale-[1.01] bg-gray-850 border-[#FFAA00] shadow-md shadow-[#FFAA00]/20"
          : "transition-all duration-200 hover:shadow-lg hover:scale-[1.01] bg-gray-850 border-gray-700 hover:border-gray-600 hover:bg-gray-800"
      }`}
    >
      <div className={`${isExpanded ? "space-y-3" : ""}`}>
        <div className={`flex gap-2 ${isEditing ? "items-start" : "items-center"}`}>
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className={`text-gray-500 transition-all duration-200 hover:text-[#FFAA00] cursor-move ${
              isDragging ? "text-[#FFAA00]" : ""
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 6H8.01M8 12H8.01M8 18H8.01M16 6H16.01M16 12H16.01M16 18H16.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Start/Pause Button */}
          {isCurrentTask ? (
            <button
              onClick={() => {
                if (isTimerRunning) {
                  if (onPauseTimer) onPauseTimer();
                } else {
                  if (onStartTask) onStartTask(task.text);
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-1 rounded transition-colors flex items-center justify-center w-6 h-6 ${
                isTimerRunning ? "bg-[#FFAA00] text-black hover:bg-[#FF9900]" : "text-gray-400 hover:text-[#FFAA00]"
              }`}
              title={isTimerRunning ? "Pause timer" : "Resume timer!"}
            >
              {isTimerRunning ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 4H10V20H6V4ZM14 4H18V20H14V4Z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 5V19L19 12L8 5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="currentColor"
                  />
                </svg>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                if (onStartTask) onStartTask(task.text);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={Boolean(hasActiveTimer && currentTask && currentTask.trim() !== task.text.trim())}
              className={`p-1 rounded transition-colors flex items-center justify-center w-6 h-6 ${
                hasActiveTimer && currentTask && currentTask.trim() !== task.text.trim()
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:text-[#FFAA00]"
              }`}
              title={
                hasActiveTimer && currentTask && currentTask.trim() !== task.text.trim()
                  ? "Another task is active"
                  : "Start timer for this task"
              }
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 5V19L19 12L8 5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}

          {/* Task Text */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="relative w-full">
                <textarea
                  ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                  value={editingText}
                  onChange={(e) => {
                    if (e.target.value.length <= 69) {
                      onEditTextChange(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSaveEdit();
                    } else if (e.key === "Escape") {
                      onCancelEdit();
                    } else if (e.key === " ") {
                      e.stopPropagation();
                    }
                  }}
                  onBlur={(e) => {
                    setTimeout(() => {
                      if (document.activeElement !== e.target) {
                        onSaveEdit();
                      }
                    }, 100);
                  }}
                  className="w-full bg-gray-800 text-white rounded px-2 py-1 border border-gray-600 focus:border-[#FFAA00] outline-none resize-none overflow-hidden text-sm"
                  placeholder="Enter task..."
                  style={{
                    minHeight: "40px",
                    lineHeight: "1.2",
                  }}
                />
                <div className="absolute bottom-1 right-2 text-xs text-gray-500 pointer-events-none">
                  {editingText.length}/69
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p
                  className="text-white text-sm cursor-pointer hover:text-gray-300 transition-colors flex-1 min-w-0 truncate"
                  onClick={() => {
                    if (onToggleExpanded) {
                      onToggleExpanded(task.id);
                    }
                  }}
                  onDoubleClick={() => onStartEditing(task)}
                  onPointerDown={(e) => e.stopPropagation()}
                  title={isExpanded ? "Click to collapse" : "Click to expand, double-click to edit"}
                >
                  {task.text}
                </p>
                {isCurrentTask && timerSeconds && timerSeconds > 0 && (
                  <div className="text-xs text-[#FFAA00] font-mono whitespace-nowrap">{formatTime(timerSeconds)}</div>
                )}
              </div>
            )}
          </div>

          {/* Collapse/Remove Button */}
          {isExpanded ? (
            // Collapse button when expanded
            <button
              onClick={() => {
                if (onToggleExpanded) {
                  onToggleExpanded(task.id);
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded transition-colors flex items-center justify-center w-6 h-6 text-gray-400 hover:text-white"
              title="Collapse"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            // Remove button when collapsed (only visible on hover)
            <button
              onClick={() => onRemove(task.id)}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-1 rounded transition-colors flex items-center justify-center w-6 h-6 ${
                isHovered || isEditing ? "opacity-100" : "opacity-0"
              } text-red-400 hover:text-red-500 hover:bg-red-500/20`}
              title="Delete task"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 11V17M14 11V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Notes Section - Only visible when expanded */}
        {isExpanded && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <div className="bg-[#0A0E1A] rounded-xl border border-gray-800/50 overflow-hidden">
              {/* Notes Content */}
              <div className="p-6 max-h-[40vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 group transition-all duration-200 ${
                        draggedId === item.id ? "opacity-50 scale-95" : ""
                      } ${dragOverId === item.id ? "bg-gray-700/30 rounded-lg" : ""}`}
                      style={{ paddingLeft: `${item.level * 24}px` }}
                      draggable={item.type === "checkbox"}
                      onDragStart={(e) => handleNoteDragStart(e, item.id)}
                      onDragOver={(e) => handleNoteDragOver(e, item.id)}
                      onDragLeave={handleNoteDragLeave}
                      onDrop={(e) => handleNoteDrop(e, item.id)}
                      onDragEnd={handleNoteDragEnd}
                    >
                      {/* Drag Handle - Only for checklist items */}
                      {item.type === "checkbox" && (
                        <div className="flex items-center justify-center w-6 h-7 flex-shrink-0 cursor-grab active:cursor-grabbing">
                          <div className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="8" cy="6" r="1.5" />
                              <circle cx="16" cy="6" r="1.5" />
                              <circle cx="8" cy="12" r="1.5" />
                              <circle cx="16" cy="12" r="1.5" />
                              <circle cx="8" cy="18" r="1.5" />
                              <circle cx="16" cy="18" r="1.5" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* List Marker */}
                      <div className="flex items-center justify-center w-6 h-7 flex-shrink-0">
                        {item.type === "checkbox" && (
                          <button
                            onClick={() => toggleCheckbox(item.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 hover:scale-105 ${
                              item.completed
                                ? "bg-[#FFAA00] border-[#FFAA00] shadow-lg shadow-[#FFAA00]/25"
                                : "border-gray-500 hover:border-[#FFAA00] bg-transparent"
                            }`}
                          >
                            {item.completed && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-black">
                                <path
                                  d="M20 6L9 17l-5-5"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </button>
                        )}
                        {item.type === "bullet" && <div className="w-2 h-2 rounded-full bg-gray-400"></div>}
                        {item.type === "number" && (
                          <div className="text-gray-400 font-mono text-sm w-6 text-right">{getNumberedIndex(index)}.</div>
                        )}
                      </div>

                      {/* Content Input */}
                      <div className="flex-1 min-w-0">
                        <textarea
                          ref={(el) => {
                            if (el) inputRefs.current[item.id] = el;
                          }}
                          value={item.content}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleContentChange(item.id, value);
                            // Only check for formatting on text items
                            if (item.type === "text") {
                              handleInput(item.id, value);
                            }
                          }}
                          onKeyDown={(e) => handleKeyDown(e, item.id)}
                          onFocus={() => setFocusedId(item.id)}
                          onPointerDown={(e) => e.stopPropagation()}
                          placeholder={index === 0 ? "Start writing..." : ""}
                          className={`w-full bg-transparent text-white placeholder-gray-500 border-none outline-none resize-none font-medium leading-relaxed ${
                            item.completed ? "line-through text-gray-400" : ""
                          }`}
                          style={{
                            minHeight: "28px",
                            lineHeight: "1.75",
                            fontSize: "16px",
                          }}
                          rows={1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer with shortcuts - only show when no content */}
              {items.length === 1 && items[0].content === "" && (
                <div className="px-6 py-4 border-t border-gray-800/50 bg-gray-900/30">
                  <div className="flex flex-col items-center justify-center text-xs text-gray-500 gap-3">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">[]</span>
                        <span>Checkbox</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">-</span>
                        <span>Bullet</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-1 bg-gray-800 rounded text-gray-300">1.</span>
                        <span>Number</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
