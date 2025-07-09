"use client";
import React, { useState, useRef, useEffect } from "react";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useInstance } from "../../Instances";
import TaskHeader from "./TaskHeader";
import TaskInput from "./TaskInput";
import SortableTask from "./SortableTask";
import ClearAllConfirmModal from "./ClearAllConfirmModal";
import { useTaskOperations } from "./hooks/useTaskOperations";
import { useTaskDragDrop } from "./hooks/useTaskDragDrop";

interface TaskListProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTask?: (taskText: string) => void;
  currentTask?: string;
  isTimerRunning?: boolean;
  hasActiveTimer?: boolean;
  onPauseTimer?: () => void;
  timerSeconds?: number;
}

export default function TaskList({
  isOpen,
  onClose,
  onStartTask,
  currentTask,
  isTimerRunning,
  hasActiveTimer,
  onPauseTimer,
  timerSeconds,
}: TaskListProps) {
  const { user } = useInstance();
  const [newTaskText, setNewTaskText] = useState("");
  const [editingText, setEditingText] = useState("");
  const [isWide, setIsWide] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const taskOperations = useTaskOperations(user?.id);
  const {
    tasks,
    editingId,
    setEditingId,
    addTask,
    removeTask,
    updateTask,
    clearAllTasks,
    reorderTasks,
    refreshTasks,
  } = taskOperations;

  const dragDrop = useTaskDragDrop(tasks, reorderTasks);

  // Focus edit input when editing
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      if (editInputRef.current instanceof HTMLInputElement) {
        editInputRef.current.select();
      } else if (editInputRef.current instanceof HTMLTextAreaElement) {
        editInputRef.current.select();
      }
    }
  }, [editingId]);

  // Close clear menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showClearMenu && !(event.target as Element).closest(".clear-menu")) {
        setShowClearMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showClearMenu]);

  const handleAddTask = (text: string) => {
    addTask(text);
    setNewTaskText("");
  };

  const startEditing = (task: any) => {
    setEditingId(task.id);
    setEditingText(task.text);
  };

  const saveEdit = () => {
    if (editingText.trim() && editingId) {
      updateTask(editingId, { text: editingText.trim() });
    }
    setEditingId(null);
    setEditingText("");
    refreshTasks();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
    refreshTasks();
  };

  const handleStartTask = (taskText: string) => {
    if (onStartTask) onStartTask(taskText);
  };

  const handleClearAll = () => {
    setShowClearMenu(false);
    setShowClearAllConfirm(true);
  };

  const confirmClearAll = () => {
    clearAllTasks();
    setShowClearAllConfirm(false);
  };

  const handleToggleExpanded = (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      // Auto-scroll to show the expanded task after a brief delay for animation
      setTimeout(() => {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const container = document.getElementById('task-list-container');
        
        if (taskElement && container) {
          const taskRect = taskElement.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          
          // Check if the task's bottom (including expanded notes area) is below the container's visible area
          const expandedHeight = 150; // Approximate height of the notes textarea area
          const taskBottom = taskRect.bottom + expandedHeight;
          
          if (taskBottom > containerRect.bottom) {
            // Scroll to bring the entire expanded task into view
            const scrollAmount = taskBottom - containerRect.bottom + 20; // 20px padding
            container.scrollBy({
              top: scrollAmount,
              behavior: 'smooth'
            });
          }
        }
      }, 100); // Small delay to allow for expansion animation
    }
  };

  const filteredTasks = tasks.filter((task) => !task.completed);
  const incompleteTasks = filteredTasks.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none animate-in fade-in duration-300">
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

      <div
        className={`absolute bottom-4 right-4 ${
          isWide ? "w-[960px]" : "w-[480px]"
        } max-w-[calc(100vw-2rem)] sm:max-w-[${
          isWide ? "960px" : "480px"
        }] bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 pointer-events-auto animate-in slide-in-from-bottom-4 duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <TaskHeader
          incompleteTasks={incompleteTasks}
          isWide={isWide}
          onToggleWidth={() => setIsWide(!isWide)}
          onClose={onClose}
          onShowClearMenu={() => setShowClearMenu(!showClearMenu)}
          showClearMenu={showClearMenu}
          onClearAll={handleClearAll}
        />

        <TaskInput
          onAddTask={handleAddTask}
          newTaskText={newTaskText}
          setNewTaskText={setNewTaskText}
          isOpen={isOpen}
        />

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar" id="task-list-container">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-4 opacity-50">
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm">No tasks yet. Add one above to get started!</p>
            </div>
          ) : (
            <DndContext
              sensors={dragDrop.sensors}
              collisionDetection={closestCenter}
              onDragStart={dragDrop.handleDragStart}
              onDragEnd={dragDrop.handleDragEnd}
            >
              <SortableContext items={filteredTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                {filteredTasks.map((task) => (
                  <SortableTask
                    key={task.id}
                    task={task}
                    isEditing={editingId === task.id}
                    editingText={editingText}
                    onStartEditing={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={cancelEdit}
                    onRemove={removeTask}
                    onEditTextChange={setEditingText}
                    editInputRef={editInputRef}
                    onStartTask={handleStartTask}
                    currentTask={currentTask}
                    isTimerRunning={isTimerRunning}
                    hasActiveTimer={hasActiveTimer}
                    onPauseTimer={onPauseTimer}
                    timerSeconds={timerSeconds}
                    isExpanded={expandedTaskId === task.id}
                    onToggleExpanded={handleToggleExpanded}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {dragDrop.activeId ? (
                  <div className="p-2 mx-2 my-1 rounded-lg border bg-gray-850 border-[#FFAA00] shadow-2xl shadow-[#FFAA00]/40 scale-105 transform-gpu">
                    <div className="flex items-center gap-2">
                      <div className="text-[#FFAA00]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M8 6H8.01M8 12H8.01M8 18H8.01M16 6H16.01M16 12H16.01M16 18H16.01"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className="w-6 h-6 rounded border-2 border-gray-500 flex items-center justify-center"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate text-sm">
                          {tasks.find((task) => task.id === dragDrop.activeId)?.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      <ClearAllConfirmModal
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={confirmClearAll}
        taskCount={tasks.length}
      />
    </div>
  );
}