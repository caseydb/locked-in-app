import { useEffect, useState } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, set, onValue, off, remove } from "firebase/database";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  order?: number;
}

export function useTaskOperations(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load tasks from Firebase
  useEffect(() => {
    if (!userId) return;

    const tasksRef = ref(rtdb, `users/${userId}/tasks`);
    const handle = onValue(tasksRef, (snapshot) => {
      const tasksData = snapshot.val();
      if (tasksData) {
        const tasksArray = Object.entries(tasksData).map(([id, task]) => ({
          id,
          ...(task as Omit<Task, "id">),
        }));
        tasksArray.sort((a, b) => (a.order || 0) - (b.order || 0));

        // Only update if no task is being edited
        if (!editingId) {
          setTasks(tasksArray);
        }
      } else {
        setTasks([]);
      }
    });

    return () => off(tasksRef, "value", handle);
  }, [userId, editingId]);

  const addTask = (text: string) => {
    if (text.trim() && userId) {
      const id = Date.now().toString();
      const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((task) => task.order || 0)) : -1;
      const newTask: Omit<Task, "id"> = {
        text: text.trim(),
        completed: false,
        order: maxOrder + 1,
      };
      const taskRef = ref(rtdb, `users/${userId}/tasks/${id}`);
      set(taskRef, newTask);
    }
  };

  const removeTask = (id: string) => {
    if (userId) {
      const taskRef = ref(rtdb, `users/${userId}/tasks/${id}`);
      remove(taskRef);
    }
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    if (userId) {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        const taskRef = ref(rtdb, `users/${userId}/tasks/${id}`);
        set(taskRef, { ...task, ...updates });
      }
    }
  };

  const clearAllTasks = () => {
    if (userId) {
      const tasksRef = ref(rtdb, `users/${userId}/tasks`);
      set(tasksRef, null);
    }
  };

  const reorderTasks = (reorderedTasks: Task[]) => {
    if (userId) {
      reorderedTasks.forEach((task, index) => {
        const taskRef = ref(rtdb, `users/${userId}/tasks/${task.id}`);
        set(taskRef, { ...task, order: index });
      });
    }
  };

  // Force refresh tasks from Firebase
  const refreshTasks = () => {
    if (!userId) return;
    const tasksRef = ref(rtdb, `users/${userId}/tasks`);
    onValue(
      tasksRef,
      (snapshot) => {
        const tasksData = snapshot.val();
        if (tasksData) {
          const tasksArray = Object.entries(tasksData).map(([id, task]) => ({
            id,
            ...(task as Omit<Task, "id">),
          }));
          tasksArray.sort((a, b) => (a.order || 0) - (b.order || 0));
          setTasks(tasksArray);
        } else {
          setTasks([]);
        }
      },
      { onlyOnce: true }
    );
  };

  return {
    tasks,
    editingId,
    setEditingId,
    addTask,
    removeTask,
    updateTask,
    clearAllTasks,
    reorderTasks,
    refreshTasks,
  };
}